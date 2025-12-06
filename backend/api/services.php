<?php
// backend/api/services.php
// Simple REST-ish endpoint. Use method+query params to perform actions.
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? intval($_GET['id']) : null;
$all = isset($_GET['all']) ? true : false;

// Helper function to map database columns to frontend format
function mapService($s) {
    return [
        'id' => $s['service_id'],
        'provider_id' => $s['service_provider_id'],
        'category' => $s['service_category'],
        'name' => $s['service_name'],
        'description' => $s['service_description'],
        'price' => $s['service_price'],
        'image' => $s['service_image'],
        'status' => $s['service_status'],
        'created_at' => $s['service_created_at'],
        'updated_at' => $s['service_updated_at'] ?? null,
        'provider_name' => $s['provider_name'] ?? null
    ];
}

// GET /services.php -> list approved services (or all if admin, or own if provider)
if ($method === 'GET') {
    $token = get_bearer_token();
    if (!$token && isset($_GET['token'])) $token = $_GET['token'];
    $payload = $token ? jwt_validate($token) : false;

    if ($all && $payload && $payload['role'] === 'admin') {
        // Admin: get all services
        $q = $pdo->prepare('SELECT s.*, u.user_name as provider_name FROM services s JOIN users u ON s.service_provider_id = u.user_id ORDER BY s.service_created_at DESC');
        $q->execute();
        $rows = $q->fetchAll();
        echo json_encode(array_map('mapService', $rows));
        exit;
    }

    // Provider: get their own services + admin-created services (all statuses)
    if ($payload && $payload['role'] === 'provider') {
        $q = $pdo->prepare('SELECT s.*, u.user_name as provider_name FROM services s JOIN users u ON s.service_provider_id = u.user_id WHERE s.service_provider_id = :pid OR u.user_role = "admin" ORDER BY s.service_created_at DESC');
        $q->execute([':pid' => $payload['sub']]);
        $rows = $q->fetchAll();
        echo json_encode(array_map('mapService', $rows));
        exit;
    }

    // Public/Client: get only approved services
    $q = $pdo->prepare('SELECT s.*, u.user_name as provider_name FROM services s JOIN users u ON s.service_provider_id = u.user_id WHERE s.service_status = "approved" ORDER BY s.service_created_at DESC');
    $q->execute();
    $rows = $q->fetchAll();
    echo json_encode(array_map('mapService', $rows));
    exit;
}

// POST /services.php (provider or admin creates) -> requires Authorization: Bearer <token>
if ($method === 'POST') {
    $token = get_bearer_token();
    if (!$token && isset($_GET['token'])) $token = $_GET['token'];
    $payload = $token ? jwt_validate($token) : false;
    if (!$payload || !in_array($payload['role'] ?? '', ['provider', 'admin'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Only providers and admins can create services']);
        exit;
    }
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $name = trim($input['name'] ?? '');
    $category = trim($input['category'] ?? '');
    $description = trim($input['description'] ?? '');
    $price = floatval($input['price'] ?? 0);
    $image = $input['image'] ?? null;
    if (!$name || !$category || $price <= 0) {
        http_response_code(422);
        echo json_encode(['error' => 'Validation: name, category and price > 0 required']);
        exit;
    }
    // Admin creates as approved, provider creates as pending
    $status = $payload['role'] === 'admin' ? 'approved' : 'pending';
    $stmt = $pdo->prepare('INSERT INTO services (service_provider_id,service_category,service_name,service_description,service_price,service_image,service_status,service_created_at) VALUES (:pid,:cat,:name,:desc,:price,:img,:status,NOW())');
    $stmt->execute([':pid' => $payload['sub'], ':cat' => $category, ':name' => $name, ':desc' => $description, ':price' => $price, ':img' => $image, ':status' => $status]);
    echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
    exit;
}

// PUT /services.php?id= -> update (provider or admin for status)
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

    $stmt = $pdo->prepare('SELECT service_provider_id FROM services WHERE service_id = :id');
    $stmt->execute([':id' => $id]);
    $s = $stmt->fetch();
    if (!$s) {
        http_response_code(404);
        echo json_encode(['error' => 'Not found']);
        exit;
    }

    // Admin can update status
    if ($payload['role'] === 'admin' && isset($input['status'])) {
        $pdo->prepare('UPDATE services SET service_status = :status WHERE service_id = :id')->execute([':status' => $input['status'], ':id' => $id]);
        echo json_encode(['success' => true]);
        exit;
    }

    // Provider can update own service
    if ($s['service_provider_id'] != $payload['sub']) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit;
    }

    // Build update query with image if provided
    if (isset($input['image']) && $input['image']) {
        $stmt = $pdo->prepare('UPDATE services SET service_category=:cat,service_name=:name,service_description=:desc,service_price=:price,service_image=:img,service_updated_at=NOW() WHERE service_id=:id');
        $stmt->execute([':cat' => $input['category'], ':name' => $input['name'], ':desc' => $input['description'], ':price' => floatval($input['price']), ':img' => $input['image'], ':id' => $id]);
    } else {
        $stmt = $pdo->prepare('UPDATE services SET service_category=:cat,service_name=:name,service_description=:desc,service_price=:price,service_updated_at=NOW() WHERE service_id=:id');
        $stmt->execute([':cat' => $input['category'], ':name' => $input['name'], ':desc' => $input['description'], ':price' => floatval($input['price']), ':id' => $id]);
    }
    echo json_encode(['success' => true]);
    exit;
}

// DELETE /services.php?id= -> delete (provider or admin)
if ($method === 'DELETE' && $id) {
    $token = get_bearer_token();
    if (!$token && isset($_GET['token'])) $token = $_GET['token'];
    $payload = $token ? jwt_validate($token) : false;
    if (!$payload) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
    $stmt = $pdo->prepare('SELECT service_provider_id FROM services WHERE service_id = :id');
    $stmt->execute([':id' => $id]);
    $s = $stmt->fetch();
    if (!$s) {
        http_response_code(404);
        echo json_encode(['error' => 'Not found']);
        exit;
    }
    if ($payload['role'] !== 'admin' && $s['service_provider_id'] != $payload['sub']) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit;
    }
    $pdo->prepare('DELETE FROM services WHERE service_id = :id')->execute([':id' => $id]);
    echo json_encode(['success' => true]);
    exit;
}

http_response_code(400);
echo json_encode(['error' => 'Bad request']);
