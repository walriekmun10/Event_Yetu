<?php

/**
 * M-Pesa STK Push Endpoint
 * Initiates a payment request via M-Pesa STK Push (Lipa Na M-Pesa Online)
 * 
 * POST /api/payments/mpesa_stk_push.php
 * 
 * Request Body (JSON):
 * {
 *   "phoneNumber": "254712345678",
 *   "amount": 1000,
 *   "bookingId": 1,
 *   "accountReference": "Event123",  // Optional
 *   "description": "DJ Services"      // Optional
 * }
 * 
 * Success Response:
 * {
 *   "success": true,
 *   "message": "STK Push sent successfully",
 *   "merchantRequestId": "29115-34620561-1",
 *   "checkoutRequestId": "ws_CO_191220191020363925",
 *   "responseCode": "0",
 *   "responseDescription": "Success. Request accepted for processing",
 *   "customerMessage": "Success. Request accepted for processing",
 *   "paymentId": 5
 * }
 * 
 * Error Response:
 * {
 *   "success": false,
 *   "error": "Error message"
 * }
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/mpesa.php';
require_once __DIR__ . '/../../helpers/mpesa_helpers.php';
require_once __DIR__ . '/../../config/jwt.php';

try {
    // Get and parse input
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true);

    if (!$input || !is_array($input)) {
        sendJsonResponse([
            'success' => false,
            'error' => 'Invalid JSON input. Please send valid JSON data.',
            'received' => substr($rawInput, 0, 100)
        ], 400);
    }

    // Validate required fields
    $requiredFields = ['phoneNumber', 'amount', 'bookingId'];
    $missingFields = [];
    foreach ($requiredFields as $field) {
        if (!isset($input[$field]) || $input[$field] === '' || $input[$field] === null) {
            $missingFields[] = $field;
        }
    }

    if (!empty($missingFields)) {
        sendJsonResponse([
            'success' => false,
            'error' => 'Missing required fields: ' . implode(', ', $missingFields),
            'required' => $requiredFields,
            'received' => array_keys($input)
        ], 400);
    }

    // Extract and validate input
    $phoneNumber = formatPhoneNumber($input['phoneNumber']);
    if (!$phoneNumber) {
        sendJsonResponse(['success' => false, 'error' => 'Invalid phone number format. Use 254XXXXXXXXX or 07XXXXXXXX'], 400);
    }

    $amount = validateAmount($input['amount']);
    if (!$amount) {
        sendJsonResponse(['success' => false, 'error' => 'Invalid amount. Must be between 1 and 150,000 KES'], 400);
    }

    $bookingId = intval($input['bookingId']);
    if ($bookingId <= 0) {
        sendJsonResponse(['success' => false, 'error' => 'Invalid booking ID'], 400);
    }

    // Optional fields
    $accountReference = isset($input['accountReference'])
        ? sanitizeInput($input['accountReference'], 12)
        : MPESA_ACCOUNT_REFERENCE . $bookingId;

    $description = isset($input['description'])
        ? sanitizeInput($input['description'], 100)
        : MPESA_TRANSACTION_DESC;

    // Verify booking exists and get details
    $stmt = $pdo->prepare('SELECT b.*, s.service_name, s.service_price FROM bookings b 
                           JOIN services s ON b.booking_service_id = s.service_id 
                           WHERE b.booking_id = :id');
    $stmt->execute([':id' => $bookingId]);
    $booking = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$booking) {
        sendJsonResponse(['success' => false, 'error' => 'Booking not found'], 404);
    }

    // Check if booking already has a completed payment
    $stmt = $pdo->prepare('SELECT * FROM payments WHERE payment_booking_id = :bid AND payment_status = "Completed"');
    $stmt->execute([':bid' => $bookingId]);
    if ($stmt->fetch()) {
        sendJsonResponse(['success' => false, 'error' => 'This booking has already been paid for'], 400);
    }

    // Verify amount matches service price
    if (abs($amount - floatval($booking['service_price'])) > 0.01) {
        logMpesaTransaction('WARNING', [
            'message' => 'Amount mismatch',
            'expected' => $booking['service_price'],
            'received' => $amount,
            'booking_id' => $bookingId
        ]);
    }

    // TEST MODE - Simulate payment without calling M-Pesa
    if (defined('MPESA_TEST_MODE') && MPESA_TEST_MODE === true) {
        // Create a simulated payment record
        $merchantRequestId = 'TEST-' . uniqid();
        $checkoutRequestId = 'TEST-CO-' . time();
        $mpesaReceipt = 'TEST' . strtoupper(substr(md5(uniqid()), 0, 10));
        
        // Insert payment record
        $stmt = $pdo->prepare('INSERT INTO payments (payment_booking_id, payment_mpesa_receipt, payment_amount, payment_phone, payment_status, payment_merchant_request_id, payment_checkout_request_id, payment_result_code, payment_result_desc, payment_transaction_date) 
                               VALUES (:bid, :receipt, :amount, :phone, :status, :merchant_req, :checkout_req, :result_code, :result_desc, NOW())');
        $stmt->execute([
            ':bid' => $bookingId,
            ':receipt' => $mpesaReceipt,
            ':amount' => $amount,
            ':phone' => $phoneNumber,
            ':status' => 'Completed',
            ':merchant_req' => $merchantRequestId,
            ':checkout_req' => $checkoutRequestId,
            ':result_code' => '0',
            ':result_desc' => 'TEST MODE: Payment simulated successfully'
        ]);
        
        $paymentId = $pdo->lastInsertId();
        
        // Update booking status
        $pdo->prepare('UPDATE bookings SET booking_status = "confirmed" WHERE booking_id = :id')
            ->execute([':id' => $bookingId]);
        
        logMpesaTransaction('TEST_MODE', [
            'message' => 'Simulated payment completed',
            'payment_id' => $paymentId,
            'mpesa_receipt' => $mpesaReceipt
        ]);
        
        sendJsonResponse([
            'success' => true,
            'message' => 'TEST MODE: Payment simulated successfully',
            'merchantRequestId' => $merchantRequestId,
            'checkoutRequestId' => $checkoutRequestId,
            'responseCode' => '0',
            'responseDescription' => 'Test payment accepted',
            'customerMessage' => 'Payment simulated in TEST MODE',
            'paymentId' => $paymentId,
            'testMode' => true
        ], 200);
    }

    // Get M-Pesa access token
    $tokenData = getMpesaAccessToken();
    if (isset($tokenData['error'])) {
        logMpesaTransaction('ERROR', $tokenData);
        sendJsonResponse(['success' => false, 'error' => 'Failed to authenticate with M-Pesa: ' . $tokenData['error']], 500);
    }

    // Generate timestamp and password
    $timestamp = date('YmdHis');
    $password = generateMpesaPassword($timestamp);

    // Prepare STK Push request
    $stkPushData = [
        'BusinessShortCode' => MPESA_SHORTCODE,
        'Password' => $password,
        'Timestamp' => $timestamp,
        'TransactionType' => MPESA_TRANSACTION_TYPE,
        'Amount' => $amount,
        'PartyA' => $phoneNumber,
        'PartyB' => MPESA_SHORTCODE,
        'PhoneNumber' => $phoneNumber,
        'CallBackURL' => MPESA_CALLBACK_URL,
        'AccountReference' => $accountReference,
        'TransactionDesc' => $description
    ];

    logMpesaTransaction('STK_PUSH_REQUEST', $stkPushData);

    // Send STK Push request
    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL => MPESA_STK_PUSH_URL,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $tokenData['access_token'],
            'Content-Type: application/json'
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($stkPushData),
        CURLOPT_SSL_VERIFYPEER => false, // Set to true in production with proper certificates
        CURLOPT_SSL_VERIFYHOST => false  // Set to true in production
    ]);

    $response = curl_exec($curl);
    $curlError = curl_error($curl);
    $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);

    if ($curlError) {
        logMpesaTransaction('ERROR', ['curl_error' => $curlError]);
        sendJsonResponse(['success' => false, 'error' => 'Network error: ' . $curlError], 500);
    }

    $result = json_decode($response, true);
    logMpesaTransaction('STK_PUSH_RESPONSE', $result);

    // Check response
    if ($httpCode !== 200 || !isset($result['ResponseCode']) || $result['ResponseCode'] !== '0') {
        $errorMessage = $result['errorMessage'] ?? $result['ResponseDescription'] ?? 'Unknown error';
        sendJsonResponse(['success' => false, 'error' => 'M-Pesa request failed: ' . $errorMessage], 400);
    }

    // Save payment record to database
    $stmt = $pdo->prepare('INSERT INTO payments 
        (payment_booking_id, payment_amount, payment_phone, payment_status, payment_merchant_request_id, payment_checkout_request_id) 
        VALUES (:bid, :amt, :phone, :status, :mrid, :crid)');

    $stmt->execute([
        ':bid' => $bookingId,
        ':amt' => $amount,
        ':phone' => $phoneNumber,
        ':status' => 'Pending',
        ':mrid' => $result['MerchantRequestID'],
        ':crid' => $result['CheckoutRequestID']
    ]);

    $paymentId = $pdo->lastInsertId();

    // Send success response
    sendJsonResponse([
        'success' => true,
        'message' => 'STK Push sent successfully',
        'merchantRequestId' => $result['MerchantRequestID'],
        'checkoutRequestId' => $result['CheckoutRequestID'],
        'responseCode' => $result['ResponseCode'],
        'responseDescription' => $result['ResponseDescription'],
        'customerMessage' => $result['CustomerMessage'],
        'paymentId' => $paymentId
    ], 200);
} catch (PDOException $e) {
    logMpesaTransaction('DB_ERROR', ['error' => $e->getMessage()]);
    sendJsonResponse(['success' => false, 'error' => 'Database error occurred'], 500);
} catch (Exception $e) {
    logMpesaTransaction('ERROR', ['error' => $e->getMessage()]);
    sendJsonResponse(['success' => false, 'error' => 'An error occurred: ' . $e->getMessage()], 500);
}
