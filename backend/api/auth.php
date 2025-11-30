<?php
// backend/api/auth.php
// POST /backend/api/auth.php?action=register/login
// GET /backend/api/auth.php?action=list (admin only)
// DELETE /backend/api/auth.php?id= (admin only)
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Authorization, Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$id = isset($_GET['id']) ? intval($_GET['id']) : null;

// GET /auth.php?action=list -> admin list users
if ($method === 'GET' && $action === 'list') {
    $token = get_bearer_token();
    if (!$token && isset($_GET['token'])) $token = $_GET['token'];
    $payload = $token ? jwt_validate($token) : false;
    if (!$payload || $payload['role'] !== 'admin') {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
    $stmt = $pdo->query('SELECT user_id,user_name,user_email,user_role,user_created_at FROM users ORDER BY user_created_at DESC');
    $users = $stmt->fetchAll();
    $mapped = array_map(function($u) {
        return [
            'id' => $u['user_id'],
            'name' => $u['user_name'],
            'email' => $u['user_email'],
            'role' => $u['user_role'],
            'created_at' => $u['user_created_at']
        ];
    }, $users);
    echo json_encode($mapped);
    exit;
}

// GET /auth.php?action=me -> current user profile
if ($method === 'GET' && $action === 'me') {
    $token = get_bearer_token();
    if (!$token && isset($_GET['token'])) $token = $_GET['token'];
    $payload = $token ? jwt_validate($token) : false;
    if (!$payload) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
    $uid = $payload['sub'] ?? null;
    $stmt = $pdo->prepare('SELECT user_id,user_name,user_email,user_role,user_profile_image,user_phone,user_created_at FROM users WHERE user_id = ?');
    $stmt->execute([$uid]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit;
    }
    echo json_encode(['user' => [
        'id' => $user['user_id'],
        'name' => $user['user_name'],
        'email' => $user['user_email'],
        'role' => $user['user_role'],
        'profile_image' => $user['user_profile_image'],
        'phone' => $user['user_phone'],
        'created_at' => $user['user_created_at']
    ]]);
    exit;
}

// PUT /auth.php?action=me -> update current user profile (phone, name)
if ($method === 'PUT' && $action === 'me') {
    $token = get_bearer_token();
    if (!$token) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
    $payload = jwt_validate($token);
    if (!$payload) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
    $uid = $payload['sub'];
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $name = trim($input['name'] ?? '');
    $phone = trim($input['phone'] ?? '');

    if ($phone !== '') {
        require_once __DIR__ . '/../helpers/mpesa_helpers.php';
        $fmt = formatPhoneNumber($phone);
        if (!$fmt) {
            http_response_code(422);
            echo json_encode(['error' => 'Invalid phone format']);
            exit;
        }
        $phone = $fmt;
    }

    $params = [':id' => $uid];
    $sets = [];
    if ($name !== '') { $sets[] = 'user_name = :name'; $params[':name'] = $name; }
    if ($phone !== '') { $sets[] = 'user_phone = :phone'; $params[':phone'] = $phone; }

    if (count($sets) === 0) {
        http_response_code(422);
        echo json_encode(['error' => 'Nothing to update']);
        exit;
    }

    $sql = 'UPDATE users SET ' . implode(', ', $sets) . ' WHERE user_id = :id';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    echo json_encode(['success' => true]);
    exit;
}

// PUT /auth.php?id= -> admin update user
if ($method === 'PUT' && $id) {
    $token = get_bearer_token();
    if (!$token && isset($_GET['token'])) $token = $_GET['token'];
    $payload = $token ? jwt_validate($token) : false;
    if (!$payload || $payload['role'] !== 'admin') {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
    $input = json_decode(file_get_contents('php://input'), true) ?? [];

    $name = trim($input['name'] ?? '');
    $email = trim($input['email'] ?? '');
    $role = $input['role'] ?? 'client';
    $password = $input['password'] ?? '';

    if (!$name || !$email) {
        http_response_code(422);
        echo json_encode(['error' => 'Missing fields']);
        exit;
    }

    // Check if email exists for another user
    $stmt = $pdo->prepare('SELECT user_id FROM users WHERE user_email = :email AND user_id != :id');
    $stmt->execute([':email' => $email, ':id' => $id]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['error' => 'Email already exists']);
        exit;
    }

    // Update with or without password
    if ($password) {
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare('UPDATE users SET user_name=:name, user_email=:email, user_password=:password, user_role=:role WHERE user_id=:id');
        $stmt->execute([':name' => $name, ':email' => $email, ':password' => $hash, ':role' => $role, ':id' => $id]);
    } else {
        $stmt = $pdo->prepare('UPDATE users SET user_name=:name, user_email=:email, user_role=:role WHERE user_id=:id');
        $stmt->execute([':name' => $name, ':email' => $email, ':role' => $role, ':id' => $id]);
    }

    echo json_encode(['success' => true]);
    exit;
}

// DELETE /auth.php?id= -> admin delete user
if ($method === 'DELETE' && $id) {
    $token = get_bearer_token();
    if (!$token && isset($_GET['token'])) $token = $_GET['token'];
    $payload = $token ? jwt_validate($token) : false;
    if (!$payload || $payload['role'] !== 'admin') {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
    $pdo->prepare('DELETE FROM users WHERE user_id = :id')->execute([':id' => $id]);
    echo json_encode(['success' => true]);
    exit;
}

// Read JSON body for POST
$input = json_decode(file_get_contents('php://input'), true) ?? [];

if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

if ($action === 'register') {
    $name = trim($input['name'] ?? '');
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';
    $role = ($input['role'] ?? 'client');
    if (!$name || !$email || !$password) {
        http_response_code(422);
        echo json_encode(['error' => 'Missing fields']);
        exit;
    }

    // check existing
    $stmt = $pdo->prepare('SELECT user_id FROM users WHERE user_email = :email');
    $stmt->execute([':email' => $email]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['error' => 'Email already exists']);
        exit;
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare('INSERT INTO users (user_name,user_email,user_password,user_role,user_created_at) VALUES (:name,:email,:password,:role,NOW())');
    $stmt->execute([':name' => $name, ':email' => $email, ':password' => $hash, ':role' => $role]);
    $uid = $pdo->lastInsertId();
    $token = jwt_create(['sub' => $uid, 'role' => $role, 'email' => $email]);
    echo json_encode(['token' => $token, 'user' => ['id' => $uid, 'name' => $name, 'email' => $email, 'role' => $role]]);
    exit;
}

if ($action === 'login') {
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';
    if (!$email || !$password) {
        http_response_code(422);
        echo json_encode(['error' => 'Missing fields']);
        exit;
    }
    $stmt = $pdo->prepare('SELECT user_id,user_name,user_password,user_role FROM users WHERE user_email = :email');
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch();
    if (!$user || !password_verify($password, $user['user_password'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid credentials']);
        exit;
    }
    $token = jwt_create(['sub' => $user['user_id'], 'role' => $user['user_role'], 'email' => $email]);
    echo json_encode(['token' => $token, 'user' => ['id' => $user['user_id'], 'name' => $user['user_name'], 'email' => $email, 'role' => $user['user_role']]]);
    exit;
}

http_response_code(400);
echo json_encode(['error' => 'Invalid action']);
