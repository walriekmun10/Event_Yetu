<?php
// backend/api/payments/mpesa_stk_complete.php
// Complete M-Pesa STK Push Implementation with Error Handling
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/jwt.php';
require_once __DIR__ . '/../../config/mpesa.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Authorization, Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

/**
 * Get M-Pesa Access Token
 */
function getMpesaAccessToken() {
    $url = MPESA_ENV === 'sandbox' 
        ? 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
        : 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
    
    $credentials = base64_encode(MPESA_CONSUMER_KEY . ':' . MPESA_CONSUMER_SECRET);
    
    $curl = curl_init($url);
    curl_setopt($curl, CURLOPT_HTTPHEADER, ['Authorization: Basic ' . $credentials]);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, false);
    
    $response = curl_exec($curl);
    $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);
    
    if ($httpCode !== 200) {
        throw new Exception("Failed to get access token. HTTP Code: $httpCode");
    }
    
    $result = json_decode($response, true);
    
    if (!isset($result['access_token'])) {
        throw new Exception("Access token not found in response");
    }
    
    return $result['access_token'];
}

/**
 * Initiate STK Push
 */
function initiateSTKPush($phoneNumber, $amount, $accountReference, $transactionDesc) {
    // Test mode - simulate successful payment
    if (defined('MPESA_TEST_MODE') && MPESA_TEST_MODE === true) {
        return [
            'success' => true,
            'test_mode' => true,
            'MerchantRequestID' => 'TEST-' . uniqid(),
            'CheckoutRequestID' => 'ws_CO_' . date('dmYHis') . rand(1000, 9999),
            'ResponseCode' => '0',
            'ResponseDescription' => 'Success. Request accepted for processing (TEST MODE)',
            'CustomerMessage' => 'Success. Request accepted for processing (TEST MODE)'
        ];
    }
    
    // Real M-Pesa API call
    try {
        $accessToken = getMpesaAccessToken();
        
        $url = MPESA_ENV === 'sandbox'
            ? 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
            : 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
        
        $timestamp = date('YmdHis');
        $password = base64_encode(MPESA_SHORTCODE . MPESA_PASSKEY . $timestamp);
        
        // Format phone number (254XXXXXXXXX)
        $phoneNumber = preg_replace('/[^0-9]/', '', $phoneNumber);
        if (substr($phoneNumber, 0, 1) === '0') {
            $phoneNumber = '254' . substr($phoneNumber, 1);
        } elseif (substr($phoneNumber, 0, 3) !== '254') {
            $phoneNumber = '254' . $phoneNumber;
        }
        
        $requestData = [
            'BusinessShortCode' => MPESA_SHORTCODE,
            'Password' => $password,
            'Timestamp' => $timestamp,
            'TransactionType' => 'CustomerPayBillOnline',
            'Amount' => (int)$amount,
            'PartyA' => $phoneNumber,
            'PartyB' => MPESA_SHORTCODE,
            'PhoneNumber' => $phoneNumber,
            'CallBackURL' => MPESA_CALLBACK_URL,
            'AccountReference' => $accountReference,
            'TransactionDesc' => $transactionDesc
        ];
        
        $curl = curl_init($url);
        curl_setopt($curl, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $accessToken,
            'Content-Type: application/json'
        ]);
        curl_setopt($curl, CURLOPT_POST, true);
        curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($requestData));
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, false);
        
        $response = curl_exec($curl);
        $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        curl_close($curl);
        
        $result = json_decode($response, true);
        
        if ($httpCode !== 200) {
            throw new Exception("STK Push failed. HTTP Code: $httpCode. Response: " . $response);
        }
        
        if (isset($result['ResponseCode']) && $result['ResponseCode'] == '0') {
            $result['success'] = true;
            return $result;
        } else {
            throw new Exception($result['errorMessage'] ?? 'STK Push failed');
        }
        
    } catch (Exception $e) {
        return [
            'success' => false,
            'error' => $e->getMessage()
        ];
    }
}

// Main request handler
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $bookingId = $data['booking_id'] ?? null;
    $phoneNumber = $data['phone_number'] ?? null;
    $amount = $data['amount'] ?? null;
    
    if (!$bookingId || !$phoneNumber || !$amount) {
        http_response_code(422);
        echo json_encode([
            'success' => false,
            'error' => 'Missing required fields: booking_id, phone_number, amount'
        ]);
        exit;
    }
    
    // Validate phone number format
    if (!preg_match('/^(254|0)?[17]\d{8}$/', preg_replace('/[^0-9]/', '', $phoneNumber))) {
        http_response_code(422);
        echo json_encode([
            'success' => false,
            'error' => 'Invalid phone number format. Use 07XXXXXXXX or 2547XXXXXXXX'
        ]);
        exit;
    }
    
    // Verify token
    $token = get_bearer_token();
    $payload = $token ? jwt_validate($token) : false;
    
    if (!$payload) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Authentication required']);
        exit;
    }
    
    try {
        // Get booking details
        $stmt = $pdo->prepare("SELECT * FROM bookings WHERE id = ?");
        $stmt->execute([$bookingId]);
        $booking = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$booking) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Booking not found']);
            exit;
        }
        
        // Authorization check
        if ($payload['role'] !== 'admin' && $booking['user_id'] != $payload['user_id']) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Access denied']);
            exit;
        }
        
        // Initiate STK Push
        $accountRef = $booking['booking_number'];
        $transDesc = "Payment for booking " . $accountRef;
        
        $stkResult = initiateSTKPush($phoneNumber, $amount, $accountRef, $transDesc);
        
        if ($stkResult['success']) {
            // Save payment record
            $receiptNumber = 'PAY-' . date('Ymd') . '-' . rand(1000, 9999);
            
            $paymentStmt = $pdo->prepare("
                INSERT INTO payments (
                    booking_id, receipt_number, amount, payment_method, 
                    mpesa_reference, mpesa_request_id, mpesa_checkout_id, 
                    phone_number, status, created_at
                ) VALUES (?, ?, ?, 'mpesa', ?, ?, ?, ?, 'pending', NOW())
            ");
            
            $paymentStmt->execute([
                $bookingId,
                $receiptNumber,
                $amount,
                $stkResult['MerchantRequestID'] ?? null,
                $stkResult['MerchantRequestID'] ?? null,
                $stkResult['CheckoutRequestID'] ?? null,
                $phoneNumber
            ]);
            
            $paymentId = $pdo->lastInsertId();
            
            // In test mode, auto-complete payment after 3 seconds
            if (isset($stkResult['test_mode']) && $stkResult['test_mode']) {
                // Simulate payment success
                $updateStmt = $pdo->prepare("
                    UPDATE payments 
                    SET status = 'completed', 
                        mpesa_reference = ?, 
                        result_code = 0,
                        result_description = 'Payment successful (TEST MODE)',
                        paid_at = NOW()
                    WHERE id = ?
                ");
                $updateStmt->execute(['TEST' . rand(100000, 999999), $paymentId]);
                
                // Update booking status
                $bookingStmt = $pdo->prepare("UPDATE bookings SET status = 'confirmed' WHERE id = ?");
                $bookingStmt->execute([$bookingId]);
            }
            
            echo json_encode([
                'success' => true,
                'message' => 'STK Push sent successfully. Please check your phone.',
                'payment_id' => $paymentId,
                'checkout_request_id' => $stkResult['CheckoutRequestID'] ?? null,
                'test_mode' => $stkResult['test_mode'] ?? false,
                'customer_message' => $stkResult['CustomerMessage'] ?? 'Check your phone for M-Pesa prompt'
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $stkResult['error'] ?? 'Payment initiation failed'
            ]);
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Payment processing error: ' . $e->getMessage()
        ]);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
}
