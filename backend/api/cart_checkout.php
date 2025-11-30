<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

// Require authenticated client
$input = json_decode(file_get_contents('php://input'), true);
if (!$input || !isset($input['cart'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid payload']);
    exit;
}

$cart = $input['cart'];
if (!is_array($cart) || count($cart) === 0) {
    echo json_encode(['success' => false, 'message' => 'Cart is empty']);
    exit;
}

$token = get_bearer_token();
$payload = $token ? jwt_validate($token) : false;
if (!$payload || !isset($payload['sub']) || ($payload['role'] ?? '') !== 'client') {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Authentication required: client only']);
    exit;
}

$userId = $payload['sub'];

try {
    $pdo->beginTransaction();

    // Validate each service server-side and compute total
    $total = 0;
    $serviceStmt = $pdo->prepare('SELECT service_id, service_price, service_provider_id FROM services WHERE service_id = :id LIMIT 1');
    $insertSvc = $pdo->prepare('INSERT INTO booking_services (booking_id, service_id, price, provider_id, event_date, created_at) VALUES (:bid, :sid, :price, :pid, :edate, NOW())');

    foreach ($cart as $c) {
        $sid = intval($c['id'] ?? 0);
        if ($sid <= 0) {
            throw new Exception('Invalid service id in cart');
        }
        $serviceStmt->execute([':id' => $sid]);
        $svc = $serviceStmt->fetch(PDO::FETCH_ASSOC);
        if (!$svc) {
            throw new Exception('Service not found: ' . $sid);
        }
        $price = floatval($svc['service_price']);
        // If client supplied price mismatches, ignore client price and use server price
        if (isset($c['price']) && floatval($c['price']) !== $price) {
            // log mismatch
            // (logging function not required here, but could be added)
        }
        $total += $price;
    }

    // Create booking header (multi-service booking). Use booking_number for traceability
    $bookingNumber = 'BK-' . date('Ymd') . '-' . substr(uniqid(), -6);
    $stmt = $pdo->prepare('INSERT INTO bookings (booking_number, user_id, user_role, total_amount, status, created_at) VALUES (:bn, :uid, :urole, :total, :status, NOW())');
    $status = 'pending';
    $stmt->execute([':bn' => $bookingNumber, ':uid' => $userId, ':urole' => 'client', ':total' => $total, ':status' => $status]);
    $bookingId = $pdo->lastInsertId();

    // Insert booking_services with authoritative prices
    foreach ($cart as $c) {
        $sid = intval($c['id']);
        $serviceStmt->execute([':id' => $sid]);
        $svc = $serviceStmt->fetch(PDO::FETCH_ASSOC);
        $edate = isset($c['event_date']) ? $c['event_date'] : null;
        $insertSvc->execute([
            ':bid' => $bookingId,
            ':sid' => $sid,
            ':price' => floatval($svc['service_price']),
            ':pid' => $svc['service_provider_id'],
            ':edate' => $edate
        ]);
    }

    // Create a pending payment record (amount to be paid)
    $pay = $pdo->prepare('INSERT INTO payments (booking_id, amount, status, created_at) VALUES (:bid, :amt, :status, NOW())');
    $pay->execute([':bid' => $bookingId, ':amt' => $total, ':status' => 'Pending']);
    $paymentId = $pdo->lastInsertId();

    $pdo->commit();

    echo json_encode(['success' => true, 'booking_id' => $bookingId, 'payment_id' => $paymentId, 'amount' => $total]);
    exit;
} catch (Exception $e) {
    if ($pdo && $pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    exit;
}

?>
