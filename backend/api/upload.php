<?php
// backend/api/upload.php
// Image upload endpoint for services and profile pictures
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Authorization, Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Get token from Authorization header or query string
$token = get_bearer_token();
if (!$token && isset($_GET['token'])) {
    $token = $_GET['token'];
}
$payload = $token ? jwt_validate($token) : false;

// Get upload type (service or profile)
$type = $_GET['type'] ?? 'service';

// Authorization check based on type
// Allow either JWT-based auth or PHP session auth for service uploads
if ($type === 'service') {
    $authorized = false;
    if ($payload && in_array($payload['role'] ?? '', ['provider', 'admin'])) $authorized = true;
    // Try PHP session fallback (useful for web forms that rely on session cookie)
    if (!$authorized) {
        if (session_status() === PHP_SESSION_NONE) session_start();
        if (!empty($_SESSION['user_id'])) {
            // check role from database
            $uid = intval($_SESSION['user_id']);
            $stmt = $pdo->prepare('SELECT user_role FROM users WHERE user_id = ?');
            $stmt->execute([$uid]);
            $r = $stmt->fetchColumn();
            if (in_array($r, ['provider', 'admin'])) $authorized = true;
        }
    }
    if (!$authorized) {
        http_response_code(401);
        echo json_encode(['error' => 'Only providers and admins can upload service images']);
        exit;
    }
}

if ($type === 'profile') {
    // profile upload: allow JWT or session user
    $authorized = false;
    if ($payload) $authorized = true;
    if (!$authorized) {
        if (session_status() === PHP_SESSION_NONE) session_start();
        if (!empty($_SESSION['user_id'])) $authorized = true;
    }
    if (!$authorized) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required for profile picture upload']);
        exit;
    }
}

if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(422);
    echo json_encode(['error' => 'No image uploaded']);
    exit;
}

$file = $_FILES['image'];
$allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
$maxSize = 5 * 1024 * 1024; // 5MB

if ($file['size'] > $maxSize) {
    http_response_code(422);
    echo json_encode(['error' => 'Image too large (max 5MB)']);
    exit;
}

$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

if (!in_array($mime, $allowed)) {
    http_response_code(422);
    echo json_encode(['error' => 'Invalid image type. Allowed: jpg, jpeg, png, gif, webp']);
    exit;
}

    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $prefix = $type === 'profile' ? 'profile_' : 'service_';
    $filename = uniqid($prefix) . '.' . $ext;
    $uploadBase = __DIR__ . '/../../uploads/';
    $uploadDir = $uploadBase;
    if ($type === 'service') {
        $uploadDir = $uploadBase . 'services/';
    } else {
        $uploadDir = $uploadBase;
    }
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
    $target = $uploadDir . $filename;

if (!move_uploaded_file($file['tmp_name'], $target)) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save image']);
    exit;
}

    if ($type === 'profile') {
        $userId = $payload['user_id'] ?? ($_SESSION['user_id'] ?? null);
        $relativeUrl = "uploads/$filename";
        try {
            if ($userId) {
                $stmt = $pdo->prepare("SELECT user_profile_image FROM users WHERE user_id = ?");
                $stmt->execute([$userId]);
                $oldImage = $stmt->fetchColumn();

                $update = $pdo->prepare("UPDATE users SET user_profile_image = ? WHERE user_id = ?");
                $update->execute([$relativeUrl, $userId]);

                if ($oldImage && $oldImage !== $relativeUrl && file_exists(__DIR__ . '/../../' . $oldImage)) {
                    @unlink(__DIR__ . '/../../' . $oldImage);
                }
            }

            echo json_encode([
                'success' => true,
                'filename' => $filename,
                'url' => "/Event-yetu/uploads/$filename",
                'message' => 'Profile picture updated successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update profile: ' . $e->getMessage()]);
        }
    } else {
        // service or generic upload - return service-specific path when applicable
        $relative = ($type === 'service') ? "uploads/services/$filename" : "uploads/$filename";
        echo json_encode([
            'success' => true,
            'filename' => $filename,
            'url' => "/Event-yetu/{$relative}"
        ]);
    }
// end
