<?php

/**
 * Get Payment Status Endpoint
 * Check the status of a payment
 * 
 * GET /api/payments/payment_status.php?paymentId=5
 * GET /api/payments/payment_status.php?bookingId=10
 * GET /api/payments/payment_status.php?checkoutRequestId=ws_CO_xxxxx
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../helpers/mpesa_helpers.php';

try {
    // Get parameters and filter out empty strings
    $paymentId = isset($_GET['paymentId']) && $_GET['paymentId'] !== '' ? $_GET['paymentId'] : null;
    $bookingId = isset($_GET['bookingId']) && $_GET['bookingId'] !== '' ? $_GET['bookingId'] : null;
    $checkoutRequestId = isset($_GET['checkoutRequestId']) && $_GET['checkoutRequestId'] !== '' ? $_GET['checkoutRequestId'] : null;

    if (!$paymentId && !$bookingId && !$checkoutRequestId) {
        sendJsonResponse(['success' => false, 'error' => 'Please provide paymentId, bookingId, or checkoutRequestId'], 400);
    }

    // Build query based on provided parameter
    if ($paymentId) {
        $stmt = $pdo->prepare('SELECT * FROM payments WHERE payment_id = :id');
        $stmt->execute([':id' => $paymentId]);
    } elseif ($bookingId) {
        $stmt = $pdo->prepare('SELECT * FROM payments WHERE payment_booking_id = :bid ORDER BY payment_created_at DESC LIMIT 1');
        $stmt->execute([':bid' => $bookingId]);
    } else {
        $stmt = $pdo->prepare('SELECT * FROM payments WHERE payment_checkout_request_id = :crid');
        $stmt->execute([':crid' => $checkoutRequestId]);
    }

    $payment = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$payment) {
        sendJsonResponse(['success' => false, 'error' => 'Payment not found'], 404);
    }

    // If payment is still pending, optionally query M-Pesa API for status
    if ($payment['payment_status'] === 'Pending' && $payment['payment_checkout_request_id']) {
        // Skip M-Pesa query in test mode (test payments are immediately completed)
        if (!defined('MPESA_TEST_MODE') || MPESA_TEST_MODE !== true) {
            $queryResult = querySTKPushStatus($payment['payment_checkout_request_id']);

            if (!isset($queryResult['error'])) {
                // Update local record if M-Pesa has different status
                if (isset($queryResult['ResultCode'])) {
                    $resultCode = $queryResult['ResultCode'];
                    $newStatus = ($resultCode == 0) ? 'Completed' : (($resultCode == 1032) ? 'Cancelled' : 'Failed');

                    if ($newStatus !== 'Pending') {
                        $stmt = $pdo->prepare('UPDATE payments SET 
                            payment_status = :status,
                            payment_result_code = :code,
                            payment_result_desc = :desc,
                            payment_updated_at = NOW()
                            WHERE payment_id = :id');

                        $stmt->execute([
                            ':status' => $newStatus,
                            ':code' => $resultCode,
                            ':desc' => $queryResult['ResultDesc'] ?? '',
                            ':id' => $payment['payment_id']
                        ]);

                        $payment['payment_status'] = $newStatus;
                        $payment['payment_result_code'] = $resultCode;
                        $payment['payment_result_desc'] = $queryResult['ResultDesc'] ?? '';
                    }
                }
            }
        }
    }

    sendJsonResponse([
        'success' => true,
        'payment' => [
            'id' => $payment['payment_id'],
            'bookingId' => $payment['payment_booking_id'],
            'amount' => floatval($payment['payment_amount']),
            'phone' => $payment['payment_phone'],
            'status' => $payment['payment_status'],
            'mpesaReceipt' => $payment['payment_mpesa_receipt'],
            'transactionDate' => $payment['payment_transaction_date'],
            'resultCode' => $payment['payment_result_code'],
            'resultDesc' => $payment['payment_result_desc'],
            'createdAt' => $payment['payment_created_at'],
            'updatedAt' => $payment['payment_updated_at']
        ]
    ], 200);
} catch (PDOException $e) {
    sendJsonResponse(['success' => false, 'error' => 'Database error'], 500);
} catch (Exception $e) {
    sendJsonResponse(['success' => false, 'error' => 'An error occurred'], 500);
}
