<?php
// backend/api/bookings.php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? intval($_GET['id']) : null;

// Helper function to map database columns to frontend format
function mapBooking($b) {
    return [
        'id' => $b['booking_id'],
        'client_id' => $b['booking_client_id'],
        'service_id' => $b['booking_service_id'],
        'package_id' => $b['booking_package_id'] ?? null,
        'date' => $b['booking_date'],
        'status' => $b['booking_status'],
        'created_at' => $b['booking_created_at'],
        'service_name' => $b['service_name'] ?? null,
        'service_price' => $b['service_price'] ?? null,
        'provider_name' => $b['provider_name'] ?? null,
        'client_name' => $b['client_name'] ?? null
    ];
}

// GET /bookings.php -> admin: list all bookings; provider: bookings for own services; client: own bookings
if ($method === 'GET') {
    $token = get_bearer_token();
    if (!$token && isset($_GET['token'])) $token = $_GET['token'];
    $payload = $token ? jwt_validate($token) : false;
    if (!$payload) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
    if ($payload['role'] === 'admin') {
        $q = $pdo->query('SELECT b.*, s.service_name, s.service_price, u.user_name as provider_name, c.user_name as client_name FROM bookings b JOIN services s ON b.booking_service_id = s.service_id JOIN users u ON s.service_provider_id = u.user_id JOIN users c ON b.booking_client_id = c.user_id ORDER BY b.booking_created_at DESC');
        echo json_encode(array_map('mapBooking', $q->fetchAll()));
        exit;
    }
    if ($payload['role'] === 'provider') {
        $q = $pdo->prepare('SELECT b.*, s.service_name, s.service_price, u.user_name as provider_name, c.user_name as client_name FROM bookings b JOIN services s ON b.booking_service_id = s.service_id JOIN users u ON s.service_provider_id = u.user_id JOIN users c ON b.booking_client_id = c.user_id WHERE s.service_provider_id = :pid OR u.user_role = "admin" ORDER BY b.booking_created_at DESC');
        $q->execute([':pid' => $payload['sub']]);
        echo json_encode(array_map('mapBooking', $q->fetchAll()));
        exit;
    }
    // client
    $q = $pdo->prepare('SELECT b.*, s.service_name, s.service_price, u.user_name as provider_name, c.user_name as client_name FROM bookings b JOIN services s ON b.booking_service_id = s.service_id JOIN users u ON s.service_provider_id = u.user_id JOIN users c ON b.booking_client_id = c.user_id WHERE b.booking_client_id = :cid ORDER BY b.booking_created_at DESC');
    $q->execute([':cid' => $payload['sub']]);
    echo json_encode(array_map('mapBooking', $q->fetchAll()));
    exit;
}

// POST /bookings.php -> create booking (client)
if ($method === 'POST') {
    $token = get_bearer_token();
    $payload = $token ? jwt_validate($token) : false;
    if (!$payload || $payload['role'] !== 'client') {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $service_id = intval($input['service_id'] ?? 0);
    $date = $input['date'] ?? '';
    if (!$service_id || !$date) {
        http_response_code(422);
        echo json_encode(['error' => 'Validation']);
        exit;
    }
    $stmt = $pdo->prepare('INSERT INTO bookings (booking_client_id,booking_service_id,booking_date,booking_status,booking_created_at) VALUES (:cid,:sid,:date,"booked",NOW())');
    $stmt->execute([':cid' => $payload['sub'], ':sid' => $service_id, ':date' => $date]);
    echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
    exit;
}

// PUT /bookings.php?id= -> update status or date (admin, provider, or client for their own bookings)
if ($method === 'PUT' && $id) {
    $token = get_bearer_token();
    if (!$token && isset($_GET['token'])) $token = $_GET['token'];
    $payload = $token ? jwt_validate($token) : false;
    if (!$payload) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
    $input = json_decode(file_get_contents('php://input'), true) ?? [];

    // Get booking details
    $stmt = $pdo->prepare('SELECT b.*, s.service_provider_id, u.user_role as provider_role FROM bookings b JOIN services s ON b.booking_service_id = s.service_id JOIN users u ON s.service_provider_id = u.user_id WHERE b.booking_id = :id');
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();
    if (!$row) {
        http_response_code(404);
        echo json_encode(['error' => 'Not found']);
        exit;
    }

    // Admin can update anything
    if ($payload['role'] === 'admin') {
        $updates = [];
        $params = [':id' => $id];
        
        if (isset($input['status'])) {
            $updates[] = 'booking_status = :status';
            $params[':status'] = $input['status'];
        }
        if (isset($input['date'])) {
            $updates[] = 'booking_date = :date';
            $params[':date'] = $input['date'];
        }
        
        if (count($updates) > 0) {
            $sql = 'UPDATE bookings SET ' . implode(', ', $updates) . ' WHERE booking_id = :id';
            $pdo->prepare($sql)->execute($params);
        }
        echo json_encode(['success' => true]);
        exit;
    }

    // Provider can update status for their services and admin services
    if ($payload['role'] === 'provider' && ($row['service_provider_id'] == $payload['sub'] || $row['provider_role'] === 'admin')) {
        if (isset($input['status'])) {
            $pdo->prepare('UPDATE bookings SET booking_status = :status WHERE booking_id = :id')
                ->execute([':status' => $input['status'], ':id' => $id]);
            echo json_encode(['success' => true]);
            exit;
        }
    }

    // Client can update date only for their own pending/booked bookings
    if ($payload['role'] === 'client' && $row['booking_client_id'] == $payload['sub']) {
        if (isset($input['date']) && in_array($row['booking_status'], ['pending', 'booked'])) {
            $pdo->prepare('UPDATE bookings SET booking_date = :date WHERE booking_id = :id')
                ->execute([':date' => $input['date'], ':id' => $id]);
            echo json_encode(['success' => true]);
            exit;
        }
    }

    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit;
}

// DELETE /bookings.php?id= -> admin can delete, client can cancel own, provider can delete bookings for their services
if ($method === 'DELETE' && $id) {
    $token = get_bearer_token();
    if (!$token && isset($_GET['token'])) $token = $_GET['token'];
    $payload = $token ? jwt_validate($token) : false;
    if (!$payload) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
    if ($payload['role'] === 'admin') {
        $pdo->prepare('DELETE FROM bookings WHERE booking_id = :id')->execute([':id' => $id]);
        echo json_encode(['success' => true]);
        exit;
    }
    if ($payload['role'] === 'provider') {
        // Provider can delete bookings for their services or admin services
        $stmt = $pdo->prepare('DELETE FROM bookings b WHERE b.booking_id = :id AND EXISTS (SELECT 1 FROM services s JOIN users u ON s.service_provider_id = u.user_id WHERE s.service_id = b.booking_service_id AND (s.service_provider_id = :pid OR u.user_role = "admin"))');
        $stmt->execute([':id' => $id, ':pid' => $payload['sub']]);
        echo json_encode(['success' => true]);
        exit;
    }
    // client
    $stmt = $pdo->prepare('DELETE FROM bookings WHERE booking_id = :id AND booking_client_id = :cid');
    $stmt->execute([':id' => $id, ':cid' => $payload['sub']]);
    echo json_encode(['success' => true]);
    exit;
}

http_response_code(400);
echo json_encode(['error' => 'Bad request']);
