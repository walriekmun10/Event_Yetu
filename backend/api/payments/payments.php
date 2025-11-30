<?php

/**
 * Get All Payments Endpoint
 * Retrieve payment history (admin/provider/client based on role)
 * 
 * GET /api/payments/payments.php?token=xxx
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
require_once __DIR__ . '/../../config/jwt.php';
require_once __DIR__ . '/../../helpers/mpesa_helpers.php';

try {
    // Get token
    $token = get_bearer_token();
    if (!$token && isset($_GET['token'])) {
        $token = $_GET['token'];
    }

    $payload = $token ? jwt_validate($token) : false;
    if (!$payload) {
        sendJsonResponse(['success' => false, 'error' => 'Unauthorized'], 401);
    }

    $userId = $payload['sub'];
    $userRole = $payload['role'];

    // Build query based on user role
    if ($userRole === 'admin') {
        // Admin sees all payments
        $stmt = $pdo->prepare('SELECT p.*, b.booking_client_id, b.booking_service_id, s.service_name, 
                               u.user_name as client_name
                               FROM payments p
                               JOIN bookings b ON p.payment_booking_id = b.booking_id
                               JOIN services s ON b.booking_service_id = s.service_id
                               JOIN users u ON b.booking_client_id = u.user_id
                               ORDER BY p.payment_created_at DESC');
        $stmt->execute();
    } elseif ($userRole === 'provider') {
        // Provider sees payments for their services
        $stmt = $pdo->prepare('SELECT p.*, b.booking_client_id, b.booking_service_id, s.service_name,
                               u.user_name as client_name
                               FROM payments p
                               JOIN bookings b ON p.payment_booking_id = b.booking_id
                               JOIN services s ON b.booking_service_id = s.service_id
                               JOIN users u ON b.booking_client_id = u.user_id
                               WHERE s.service_provider_id = :uid
                               ORDER BY p.payment_created_at DESC');
        $stmt->execute([':uid' => $userId]);
    } else {
        // Client sees their own payments
        $stmt = $pdo->prepare('SELECT p.*, b.booking_client_id, b.booking_service_id, s.service_name
                               FROM payments p
                               JOIN bookings b ON p.payment_booking_id = b.booking_id
                               JOIN services s ON b.booking_service_id = s.service_id
                               WHERE b.booking_client_id = :uid
                               ORDER BY p.payment_created_at DESC');
        $stmt->execute([':uid' => $userId]);
    }

    $payments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format response
    $formattedPayments = array_map(function ($p) {
        return [
            'id' => $p['payment_id'],
            'bookingId' => $p['payment_booking_id'],
            'serviceName' => $p['service_name'],
            'clientName' => $p['client_name'] ?? null,
            'amount' => floatval($p['payment_amount']),
            'phone' => $p['payment_phone'],
            'status' => $p['payment_status'],
            'mpesaReceipt' => $p['payment_mpesa_receipt'],
            'transactionDate' => $p['payment_transaction_date'],
            'resultDesc' => $p['payment_result_desc'],
            'createdAt' => $p['payment_created_at']
        ];
    }, $payments);

    sendJsonResponse([
        'success' => true,
        'payments' => $formattedPayments,
        'count' => count($formattedPayments)
    ], 200);
} catch (PDOException $e) {
    sendJsonResponse(['success' => false, 'error' => 'Database error'], 500);
} catch (Exception $e) {
    sendJsonResponse(['success' => false, 'error' => 'An error occurred'], 500);
}
