<?php

/**
 * M-Pesa Callback Endpoint
 * Receives payment confirmation from M-Pesa after STK Push completion
 * 
 * POST /api/payments/mpesa_callback.php
 * 
 * This endpoint is called by M-Pesa servers, not by your frontend
 * 
 * M-Pesa sends JSON payload with payment result
 * Updates the payment record in database with final status
 */

header('Content-Type: application/json');

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../helpers/mpesa_helpers.php';
require_once __DIR__ . '/../../lib/ReceiptPDF.php';
// Optional mail config (define SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD, SMTP_PORT, SMTP_SECURE)
@include_once __DIR__ . '/../../config/mail.php';

// Log all incoming requests for debugging
$callbackData = file_get_contents('php://input');
logMpesaTransaction('CALLBACK_RAW', $callbackData);

try {
    // Parse callback data
    $callback = json_decode($callbackData, true);

    if (!$callback) {
        logMpesaTransaction('CALLBACK_ERROR', 'Invalid JSON received');
        echo json_encode(['ResultCode' => 1, 'ResultDesc' => 'Invalid JSON']);
        exit;
    }

    logMpesaTransaction('CALLBACK_PARSED', $callback);

    // Extract data from callback
    // M-Pesa sends data in Body->stkCallback structure
    if (!isset($callback['Body']['stkCallback'])) {
        logMpesaTransaction('CALLBACK_ERROR', 'Missing stkCallback in payload');
        echo json_encode(['ResultCode' => 1, 'ResultDesc' => 'Invalid callback structure']);
        exit;
    }

    $stkCallback = $callback['Body']['stkCallback'];

    $merchantRequestId = $stkCallback['MerchantRequestID'] ?? null;
    $checkoutRequestId = $stkCallback['CheckoutRequestID'] ?? null;
    $resultCode = $stkCallback['ResultCode'] ?? null;
    $resultDesc = $stkCallback['ResultDesc'] ?? 'Unknown result';

    if (!$merchantRequestId || !$checkoutRequestId) {
        logMpesaTransaction('CALLBACK_ERROR', 'Missing required IDs in callback');
        echo json_encode(['ResultCode' => 1, 'ResultDesc' => 'Missing required fields']);
        exit;
    }

    // Find payment record
    $stmt = $pdo->prepare('SELECT * FROM payments WHERE payment_checkout_request_id = :crid LIMIT 1');
    $stmt->execute([':crid' => $checkoutRequestId]);
    $payment = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$payment) {
        logMpesaTransaction('CALLBACK_ERROR', [
            'message' => 'Payment record not found',
            'checkout_request_id' => $checkoutRequestId
        ]);
        echo json_encode(['ResultCode' => 1, 'ResultDesc' => 'Payment record not found']);
        exit;
    }

    // Check if already processed
    if ($payment['payment_status'] !== 'Pending') {
        logMpesaTransaction('CALLBACK_WARNING', [
            'message' => 'Payment already processed',
            'payment_id' => $payment['payment_id'],
            'current_status' => $payment['payment_status']
        ]);
        echo json_encode(['ResultCode' => 0, 'ResultDesc' => 'Already processed']);
        exit;
    }

    // Determine payment status based on result code
    // ResultCode 0 = Success, anything else = Failed
    $paymentStatus = ($resultCode == 0) ? 'Completed' : 'Failed';

    // Extract additional data from CallbackMetadata (only present on success)
    $mpesaReceipt = null;
    $transactionDate = null;
    $phoneNumber = $payment['payment_phone']; // Use existing phone

    if ($resultCode == 0 && isset($stkCallback['CallbackMetadata']['Item'])) {
        $items = $stkCallback['CallbackMetadata']['Item'];

        foreach ($items as $item) {
            switch ($item['Name']) {
                case 'MpesaReceiptNumber':
                    $mpesaReceipt = $item['Value'];
                    break;
                case 'TransactionDate':
                    // Convert YYYYMMDDHHmmss to MySQL timestamp
                    $transactionDate = date('Y-m-d H:i:s', strtotime($item['Value']));
                    break;
                case 'PhoneNumber':
                    $phoneNumber = $item['Value'];
                    break;
            }
        }
    }

    // Update payment record
    $stmt = $pdo->prepare('UPDATE payments SET 
        payment_status = :status,
        payment_mpesa_receipt = :receipt,
        payment_result_code = :code,
        payment_result_desc = :desc,
        payment_transaction_date = :txn_date,
        payment_phone = :phone,
        payment_updated_at = NOW()
        WHERE payment_id = :id');

    $stmt->execute([
        ':status' => $paymentStatus,
        ':receipt' => $mpesaReceipt,
        ':code' => $resultCode,
        ':desc' => $resultDesc,
        ':txn_date' => $transactionDate,
        ':phone' => $phoneNumber,
        ':id' => $payment['payment_id']
    ]);

    // If payment successful, update booking status to confirmed
    if ($paymentStatus === 'Completed') {
        $stmt = $pdo->prepare('UPDATE bookings SET booking_status = :status WHERE booking_id = :id');
        $stmt->execute([
            ':status' => 'confirmed',
            ':id' => $payment['payment_booking_id']
        ]);

        logMpesaTransaction('PAYMENT_SUCCESS', [
            'payment_id' => $payment['payment_id'],
            'booking_id' => $payment['payment_booking_id'],
            'amount' => $payment['payment_amount'],
            'receipt' => $mpesaReceipt,
            'phone' => $phoneNumber
        ]);

        // Generate PDF receipt and email to user
        try {
            // Fetch booking and items (support booking_services table)
            $bstmt = $pdo->prepare('SELECT b.*, u.user_name, u.user_email FROM bookings b JOIN users u ON b.booking_client_id = u.user_id WHERE b.booking_id = :id');
            $bstmt->execute([':id' => $payment['payment_booking_id']]);
            $booking = $bstmt->fetch(PDO::FETCH_ASSOC);

            // Try to fetch items from booking_services or booking_items
            $itStmt = $pdo->prepare('SELECT bs.*, s.service_name FROM booking_services bs LEFT JOIN services s ON bs.booking_service_service_id = s.service_id WHERE bs.booking_service_booking_id = :id');
            $itStmt->execute([':id' => $payment['payment_booking_id']]);
            $items = $itStmt->fetchAll(PDO::FETCH_ASSOC);

            if (!$items) {
                $itStmt2 = $pdo->prepare('SELECT bi.* FROM booking_items bi WHERE bi.booking_id = :id');
                $itStmt2->execute([':id' => $payment['payment_booking_id']]);
                $items = $itStmt2->fetchAll(PDO::FETCH_ASSOC);
            }

            // Create receipts directory
            $receiptDir = __DIR__ . '/../../uploads/receipts';
            if (!file_exists($receiptDir)) mkdir($receiptDir, 0755, true);

            $pdf = new ReceiptPDF();
            $pdf->AddPage();
            $pdf->generateReceipt($booking, $items, $payment);
            $receiptFilename = 'Receipt_' . ($booking['booking_number'] ?? $booking['booking_id']) . '.pdf';
            $receiptPath = $receiptDir . '/' . $receiptFilename;
            $pdf->Output('F', $receiptPath);

            // Send email with attachment using PHPMailer when available, fallback to mail()
            $emailSent = false;
            $receiptPublicPath = '/Event-yetu/uploads/receipts/' . basename($receiptPath);

            if (!empty($booking['user_email'])) {
                $to = $booking['user_email'];
                $subject = 'Your Event Yetu Booking Receipt - ' . ($booking['booking_number'] ?? $booking['booking_id']);
                $message = "Hello " . ($booking['user_name'] ?? '') . ",\n\nThank you for your payment. Please find your receipt attached.\n\nBooking: " . ($booking['booking_number'] ?? $booking['booking_id']) . "\nAmount: KSh " . number_format($payment['payment_amount'],2) . "\n\nRegards,\nEvent Yetu";

                // Use PHPMailer if available (recommended). To install: run `composer require phpmailer/phpmailer` in the project root.
                if (class_exists('PHPMailer\\PHPMailer\\PHPMailer')) {
                    try {
                        $mail = new \PHPMailer\PHPMailer\PHPMailer(true);
                        // Use SMTP if configured in config.php or env; minimal example uses mail() transport
                        // Configure your SMTP settings here or in a central config
                        if (defined('SMTP_HOST') && SMTP_HOST) {
                            $mail->isSMTP();
                            $mail->Host = SMTP_HOST;
                            $mail->SMTPAuth = defined('SMTP_AUTH') ? SMTP_AUTH : false;
                            if (defined('SMTP_USERNAME')) $mail->Username = SMTP_USERNAME;
                            if (defined('SMTP_PASSWORD')) $mail->Password = SMTP_PASSWORD;
                            if (defined('SMTP_SECURE') && SMTP_SECURE) $mail->SMTPSecure = SMTP_SECURE;
                            if (defined('SMTP_PORT') && SMTP_PORT) $mail->Port = SMTP_PORT;
                        }

                        $mail->setFrom('no-reply@eventyetu.com', 'Event Yetu');
                        $mail->addAddress($to, $booking['user_name'] ?? '');
                        $mail->Subject = $subject;
                        $mail->Body = $message;
                        $mail->addAttachment($receiptPath);
                        $mail->send();
                        $emailSent = true;
                    } catch (Exception $e) {
                        logMpesaTransaction('PHPMailer_ERROR', ['error' => $e->getMessage()]);
                        $emailSent = false;
                    }
                } else {
                    // Fallback to legacy mail()
                    try {
                        $separator = md5(time());
                        $eol = PHP_EOL;
                        $filename = basename($receiptPath);
                        $attachment = chunk_split(base64_encode(file_get_contents($receiptPath)));

                        $headers = "From: Event Yetu <no-reply@eventyetu.com>" . $eol;
                        $headers .= "MIME-Version: 1.0" . $eol;
                        $headers .= "Content-Type: multipart/mixed; boundary=\"{$separator}\"" . $eol . $eol;

                        $body = "--{$separator}" . $eol;
                        $body .= "Content-Type: text/plain; charset=ISO-8859-1" . $eol;
                        $body .= "Content-Transfer-Encoding: 7bit" . $eol . $eol;
                        $body .= $message . $eol . $eol;
                        $body .= "--{$separator}" . $eol;
                        $body .= "Content-Type: application/pdf; name=\"{$filename}\"" . $eol;
                        $body .= "Content-Transfer-Encoding: base64" . $eol;
                        $body .= "Content-Disposition: attachment; filename=\"{$filename}\"" . $eol . $eol;
                        $body .= $attachment . $eol;
                        $body .= "--{$separator}--";

                        $sent = @mail($to, $subject, $body, $headers);
                        $emailSent = (bool)$sent;
                    } catch (Exception $e) {
                        logMpesaTransaction('MAIL_FALLBACK_ERROR', ['error' => $e->getMessage()]);
                        $emailSent = false;
                    }
                }

                // Attempt to persist receipt path and email status to payments table if columns exist
                try {
                    $uStmt = $pdo->prepare('UPDATE payments SET payment_receipt_path = :rpath, payment_email_sent = :esent WHERE payment_id = :id');
                    $uStmt->execute([':rpath' => $receiptPublicPath, ':esent' => ($emailSent ? 1 : 0), ':id' => $payment['payment_id']]);
                } catch (Exception $e) {
                    // Column might not exist - log and continue
                    logMpesaTransaction('PAYMENT_META_UPDATE_FAILED', ['error' => $e->getMessage()]);
                }
            }
        } catch (Exception $e) {
            logMpesaTransaction('RECEIPT_ERROR', ['error' => $e->getMessage()]);
        }
        
    } else {
        logMpesaTransaction('PAYMENT_FAILED', [
            'payment_id' => $payment['payment_id'],
            'booking_id' => $payment['payment_booking_id'],
            'result_code' => $resultCode,
            'result_desc' => $resultDesc
        ]);
    }

    // Respond to M-Pesa
    echo json_encode([
        'ResultCode' => 0,
        'ResultDesc' => 'Callback processed successfully'
    ]);
} catch (PDOException $e) {
    logMpesaTransaction('CALLBACK_DB_ERROR', ['error' => $e->getMessage()]);
    echo json_encode(['ResultCode' => 1, 'ResultDesc' => 'Database error']);
} catch (Exception $e) {
    logMpesaTransaction('CALLBACK_ERROR', ['error' => $e->getMessage()]);
    echo json_encode(['ResultCode' => 1, 'ResultDesc' => 'Processing error']);
}
