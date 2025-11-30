<?php
// backend/api/contact.php
// Contact form API endpoint
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Authorization, Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

/**
 * Submit contact form
 * POST /api/contact.php
 */
if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $name = trim($data['name'] ?? '');
    $email = trim($data['email'] ?? '');
    $subject = trim($data['subject'] ?? '');
    $message = trim($data['message'] ?? '');
    
    // Validation
    if (empty($name) || empty($email) || empty($message)) {
        http_response_code(422);
        echo json_encode([
            'success' => false,
            'error' => 'Name, email, and message are required'
        ]);
        exit;
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(422);
        echo json_encode([
            'success' => false,
            'error' => 'Invalid email address'
        ]);
        exit;
    }
    
    // Check if user is logged in (optional)
    $token = get_bearer_token();
    $payload = $token ? jwt_validate($token) : false;
    $userId = $payload ? $payload['user_id'] : null;
    
    try {
        // Save to database
        $stmt = $pdo->prepare("
            INSERT INTO contact_messages (name, email, subject, message, user_id, status, created_at)
            VALUES (?, ?, ?, ?, ?, 'new', NOW())
        ");
        $stmt->execute([$name, $email, $subject, $message, $userId]);
        
        $messageId = $pdo->lastInsertId();
        
        // Optional: Send email notification to admin
        $adminEmail = 'admin@eventyetu.com'; // Change this
        $emailSubject = 'New Contact Form Submission: ' . $subject;
        $emailBody = "
            New message from Event Yetu contact form:
            
            Name: $name
            Email: $email
            Subject: $subject
            
            Message:
            $message
            
            ---
            Received: " . date('Y-m-d H:i:s') . "
        ";
        
        // Uncomment to enable email sending
        // mail($adminEmail, $emailSubject, $emailBody, "From: noreply@eventyetu.com\r\nReply-To: $email");
        
        echo json_encode([
            'success' => true,
            'message' => 'Thank you for contacting us! We will get back to you soon.',
            'id' => $messageId
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Failed to submit message: ' . $e->getMessage()
        ]);
    }
}

/**
 * Get contact messages (Admin only)
 * GET /api/contact.php
 */
elseif ($method === 'GET') {
    $token = get_bearer_token();
    $payload = $token ? jwt_validate($token) : false;
    
    if (!$payload || $payload['role'] !== 'admin') {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Admin access required']);
        exit;
    }
    
    $status = $_GET['status'] ?? null;
    
    try {
        if ($status) {
            $stmt = $pdo->prepare("SELECT * FROM contact_messages WHERE status = ? ORDER BY created_at DESC");
            $stmt->execute([$status]);
        } else {
            $stmt = $pdo->query("SELECT * FROM contact_messages ORDER BY created_at DESC");
        }
        
        $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'messages' => $messages
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Failed to fetch messages: ' . $e->getMessage()
        ]);
    }
}

else {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
}
