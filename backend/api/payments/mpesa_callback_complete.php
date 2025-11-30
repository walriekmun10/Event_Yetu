<?php
// backend/api/payments/mpesa_callback_complete.php
// M-Pesa Callback Handler - Receives payment confirmations from Safaricom
require_once __DIR__ . '/../../config/db.php';

header('Content-Type: application/json');

// Log all callback requests for debugging
$logFile = __DIR__ . '/../../logs/mpesa_callbacks.log';
$logDir = dirname($logFile);
if (!is_dir($logDir)) {
    mkdir($logDir, 0755, true);
}

$callbackData = file_get_contents('php://input');
$timestamp = date('Y-m-d H:i:s');
file_put_contents($logFile, "\n\n=== CALLBACK RECEIVED at $timestamp ===\n" . $callbackData . "\n", FILE_APPEND);

// Parse callback data
$response = json_decode($callbackData, true);

if (!$response) {
    file_put_contents($logFile, "ERROR: Invalid JSON received\n", FILE_APPEND);
    echo json_encode(['ResultCode' => 1, 'ResultDesc' => 'Invalid JSON']);
    exit;
}

try {
    // Extract callback data
    $body = $response['Body'] ?? [];
    $stkCallback = $body['stkCallback'] ?? [];
    
    $merchantRequestID = $stkCallback['MerchantRequestID'] ?? null;
    $checkoutRequestID = $stkCallback['CheckoutRequestID'] ?? null;
    $resultCode = $stkCallback['ResultCode'] ?? null;
    $resultDesc = $stkCallback['ResultDesc'] ?? '';
    
    if (!$checkoutRequestID) {
        throw new Exception("Missing CheckoutRequestID in callback");
    }
    
    file_put_contents($logFile, "Processing payment for CheckoutRequestID: $checkoutRequestID\n", FILE_APPEND);
    
    // Find payment record
    $stmt = $pdo->prepare("SELECT * FROM payments WHERE mpesa_checkout_id = ?");
    $stmt->execute([$checkoutRequestID]);
    $payment = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$payment) {
        file_put_contents($logFile, "WARNING: Payment not found for CheckoutRequestID: $checkoutRequestID\n", FILE_APPEND);
        echo json_encode(['ResultCode' => 0, 'ResultDesc' => 'Accepted']);
        exit;
    }
    
    file_put_contents($logFile, "Found payment ID: " . $payment['id'] . " for booking ID: " . $payment['booking_id'] . "\n", FILE_APPEND);
    
    // Check result code
    if ($resultCode == 0) {
        // Payment successful
        $callbackMetadata = $stkCallback['CallbackMetadata'] ?? [];
        $items = $callbackMetadata['Item'] ?? [];
        
        $mpesaReceiptNumber = null;
        $amountPaid = null;
        $transactionDate = null;
        $phoneNumber = null;
        
        // Extract metadata
        foreach ($items as $item) {
            $name = $item['Name'] ?? '';
            $value = $item['Value'] ?? null;
            
            switch ($name) {
                case 'MpesaReceiptNumber':
                    $mpesaReceiptNumber = $value;
                    break;
                case 'Amount':
                    $amountPaid = $value;
                    break;
                case 'TransactionDate':
                    $transactionDate = $value; // Format: 20241118123456
                    break;
                case 'PhoneNumber':
                    $phoneNumber = $value;
                    break;
            }
        }
        
        // Format transaction date
        $paidAt = null;
        if ($transactionDate) {
            $paidAt = date('Y-m-d H:i:s', strtotime($transactionDate));
        }
        
        file_put_contents($logFile, "Payment SUCCESS - Receipt: $mpesaReceiptNumber, Amount: $amountPaid\n", FILE_APPEND);
        
        // Update payment record
        $updateStmt = $pdo->prepare("
            UPDATE payments 
            SET status = 'completed',
                mpesa_reference = ?,
                result_code = ?,
                result_description = ?,
                paid_at = ?
            WHERE id = ?
        ");
        $updateStmt->execute([
            $mpesaReceiptNumber,
            $resultCode,
            $resultDesc,
            $paidAt ?: date('Y-m-d H:i:s'),
            $payment['id']
        ]);
        
        // Update booking status to confirmed
        $bookingStmt = $pdo->prepare("UPDATE bookings SET status = 'confirmed' WHERE id = ?");
        $bookingStmt->execute([$payment['booking_id']]);
        
        file_put_contents($logFile, "Booking " . $payment['booking_id'] . " confirmed\n", FILE_APPEND);
        
    } else {
        // Payment failed or cancelled
        file_put_contents($logFile, "Payment FAILED - Code: $resultCode, Desc: $resultDesc\n", FILE_APPEND);
        
        $updateStmt = $pdo->prepare("
            UPDATE payments 
            SET status = 'failed',
                result_code = ?,
                result_description = ?
            WHERE id = ?
        ");
        $updateStmt->execute([
            $resultCode,
            $resultDesc,
            $payment['id']
        ]);
        
        // Update booking status
        $bookingStmt = $pdo->prepare("UPDATE bookings SET status = 'payment_failed' WHERE id = ?");
        $bookingStmt->execute([$payment['booking_id']]);
    }
    
    // Send success response to M-Pesa
    echo json_encode([
        'ResultCode' => 0,
        'ResultDesc' => 'Accepted'
    ]);
    
} catch (Exception $e) {
    file_put_contents($logFile, "ERROR: " . $e->getMessage() . "\n", FILE_APPEND);
    file_put_contents($logFile, "Stack trace: " . $e->getTraceAsString() . "\n", FILE_APPEND);
    
    echo json_encode([
        'ResultCode' => 1,
        'ResultDesc' => 'Internal error'
    ]);
}
