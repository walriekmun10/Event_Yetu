<?php
/**
 * Enhanced Bookings API with Multi-Service Support
 * Handles creating bookings with multiple services and unified receipts
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    switch ($method) {
        case 'POST':
            if ($action === 'create-multi') {
                createMultiServiceBooking($pdo);
            } else {
                // Legacy single service booking (kept for compatibility)
                createBooking($pdo);
            }
            break;
            
        case 'GET':
            if ($action === 'my-bookings') {
                getMyBookings($pdo);
            } elseif ($action === 'booking-details') {
                getBookingDetails($pdo);
            } elseif ($action === 'all') {
                getAllBookings($pdo);
            } else {
                getMyBookings($pdo);
            }
            break;
            
        case 'PUT':
            updateBooking($pdo);
            break;
            
        case 'DELETE':
            cancelBooking($pdo);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'message' => $e->getMessage()]);
}

/**
 * Create a multi-service booking with multiple items
 */
function createMultiServiceBooking($pdo) {
    $token = get_bearer_token();
    $payload = $token ? jwt_validate($token) : null;
    
    if (!$payload) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        return;
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    if (!isset($data['services']) || !is_array($data['services']) || count($data['services']) === 0) {
        http_response_code(400);
        echo json_encode(['error' => 'At least one service is required']);
        return;
    }
    
    if (!isset($data['event_date'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Event date is required']);
        return;
    }
    
    $userId = $payload['sub'];
    $userRole = $payload['role'];
    $eventDate = $data['event_date'];
    $eventTime = $data['event_time'] ?? null;
    $venue = $data['venue'] ?? null;
    $notes = $data['notes'] ?? null;
    $services = $data['services']; // Array of {service_id, quantity}
    
    try {
        $pdo->beginTransaction();
        
        // Generate unique booking number
        $bookingNumber = generateBookingNumber($pdo);
        
        // Create main booking record
        $stmt = $pdo->prepare('
            INSERT INTO bookings (booking_number, user_id, user_role, event_date, event_time, venue, notes, total_amount, status)
            VALUES (:booking_number, :user_id, :user_role, :event_date, :event_time, :venue, :notes, 0, "pending")
        ');
        
        $stmt->execute([
            ':booking_number' => $bookingNumber,
            ':user_id' => $userId,
            ':user_role' => $userRole,
            ':event_date' => $eventDate,
            ':event_time' => $eventTime,
            ':venue' => $venue,
            ':notes' => $notes
        ]);
        
        $bookingId = $pdo->lastInsertId();
        
        // Insert booking items
        $totalAmount = 0;
        $insertedItems = [];
        
        foreach ($services as $serviceItem) {
            $serviceId = $serviceItem['service_id'];
            $quantity = $serviceItem['quantity'] ?? 1;
            
            // Get service details (snapshot for historical accuracy)
            $stmt = $pdo->prepare('
                SELECT s.*, u.name as provider_name 
                FROM services s
                JOIN users u ON s.provider_id = u.id
                WHERE s.id = :service_id
            ');
            $stmt->execute([':service_id' => $serviceId]);
            $service = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$service) {
                throw new Exception("Service with ID $serviceId not found");
            }
            
            $unitPrice = floatval($service['price']);
            $subtotal = $unitPrice * $quantity;
            $totalAmount += $subtotal;
            
            // Insert booking item
            $stmt = $pdo->prepare('
                INSERT INTO booking_items 
                (booking_id, service_id, service_name, service_category, provider_id, provider_name, quantity, unit_price, subtotal)
                VALUES 
                (:booking_id, :service_id, :service_name, :service_category, :provider_id, :provider_name, :quantity, :unit_price, :subtotal)
            ');
            
            $stmt->execute([
                ':booking_id' => $bookingId,
                ':service_id' => $serviceId,
                ':service_name' => $service['name'],
                ':service_category' => $service['category'],
                ':provider_id' => $service['provider_id'],
                ':provider_name' => $service['provider_name'],
                ':quantity' => $quantity,
                ':unit_price' => $unitPrice,
                ':subtotal' => $subtotal
            ]);
            
            $insertedItems[] = [
                'service_name' => $service['name'],
                'category' => $service['category'],
                'provider' => $service['provider_name'],
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'subtotal' => $subtotal
            ];
        }
        
        // Update booking total (trigger should do this, but let's be explicit)
        $stmt = $pdo->prepare('UPDATE bookings SET total_amount = :total WHERE id = :id');
        $stmt->execute([':total' => $totalAmount, ':id' => $bookingId]);
        
        $pdo->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Multi-service booking created successfully',
            'booking' => [
                'id' => $bookingId,
                'booking_number' => $bookingNumber,
                'event_date' => $eventDate,
                'total_amount' => $totalAmount,
                'items' => $insertedItems
            ]
        ]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create booking', 'message' => $e->getMessage()]);
    }
}

/**
 * Generate unique booking number
 */
function generateBookingNumber($pdo) {
    $prefix = 'BK';
    $date = date('Ymd');
    
    // Get count of bookings today
    $stmt = $pdo->query("SELECT COUNT(*) FROM bookings WHERE DATE(created_at) = CURDATE()");
    $count = $stmt->fetchColumn();
    $sequential = str_pad($count + 1, 4, '0', STR_PAD_LEFT);
    
    return "{$prefix}-{$date}-{$sequential}";
}

/**
 * Get my bookings with items
 */
function getMyBookings($pdo) {
    $token = get_bearer_token();
    $payload = $token ? jwt_validate($token) : null;
    
    if (!$payload) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        return;
    }
    
    $userId = $payload['sub'];
    $role = $payload['role'];
    
    try {
        // Get bookings based on role
        if ($role === 'admin') {
            // Admin sees all bookings
            $stmt = $pdo->query('
                SELECT b.*, u.name as user_name, u.email as user_email,
                       (SELECT COUNT(*) FROM booking_items WHERE booking_id = b.id) as items_count
                FROM bookings b
                JOIN users u ON b.user_id = u.id
                ORDER BY b.created_at DESC
            ');
        } elseif ($role === 'provider') {
            // Provider sees bookings that include their services
            $stmt = $pdo->prepare('
                SELECT DISTINCT b.*, u.name as user_name, u.email as user_email,
                       (SELECT COUNT(*) FROM booking_items WHERE booking_id = b.id) as items_count
                FROM bookings b
                JOIN users u ON b.user_id = u.id
                JOIN booking_items bi ON b.id = bi.booking_id
                WHERE bi.provider_id = :provider_id
                ORDER BY b.created_at DESC
            ');
            $stmt->execute([':provider_id' => $userId]);
        } else {
            // Client sees their own bookings
            $stmt = $pdo->prepare('
                SELECT b.*, u.name as user_name, u.email as user_email,
                       (SELECT COUNT(*) FROM booking_items WHERE booking_id = b.id) as items_count
                FROM bookings b
                JOIN users u ON b.user_id = u.id
                WHERE b.user_id = :user_id
                ORDER BY b.created_at DESC
            ');
            $stmt->execute([':user_id' => $userId]);
        }
        
        $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get items for each booking
        foreach ($bookings as &$booking) {
            $stmt = $pdo->prepare('SELECT * FROM booking_items WHERE booking_id = :booking_id');
            $stmt->execute([':booking_id' => $booking['id']]);
            $booking['items'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get payment info
            $stmt = $pdo->prepare('SELECT * FROM payments WHERE booking_id = :booking_id ORDER BY created_at DESC LIMIT 1');
            $stmt->execute([':booking_id' => $booking['id']]);
            $booking['payment'] = $stmt->fetch(PDO::FETCH_ASSOC);
        }
        
        echo json_encode([
            'success' => true,
            'bookings' => $bookings
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch bookings', 'message' => $e->getMessage()]);
    }
}

/**
 * Get detailed booking info for receipt generation
 */
function getBookingDetails($pdo) {
    $bookingId = $_GET['booking_id'] ?? null;
    
    if (!$bookingId) {
        http_response_code(400);
        echo json_encode(['error' => 'Booking ID required']);
        return;
    }
    
    $token = get_bearer_token();
    $payload = $token ? jwt_validate($token) : null;
    
    if (!$payload) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        return;
    }
    
    try {
        // Get booking with user info
        $stmt = $pdo->prepare('
            SELECT b.*, u.name as user_name, u.email as user_email, u.role as user_role
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            WHERE b.id = :booking_id
        ');
        $stmt->execute([':booking_id' => $bookingId]);
        $booking = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$booking) {
            http_response_code(404);
            echo json_encode(['error' => 'Booking not found']);
            return;
        }
        
        // Get booking items
        $stmt = $pdo->prepare('SELECT * FROM booking_items WHERE booking_id = :booking_id');
        $stmt->execute([':booking_id' => $bookingId]);
        $booking['items'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get payment info
        $stmt = $pdo->prepare('SELECT * FROM payments WHERE booking_id = :booking_id ORDER BY created_at DESC LIMIT 1');
        $stmt->execute([':booking_id' => $bookingId]);
        $booking['payment'] = $stmt->fetch(PDO::FETCH_ASSOC);

        // Attach receipt URL if a receipt file exists for this booking (use public uploads path)
        $receiptFilename = 'Receipt_' . ($booking['booking_number'] ?? $booking['id']) . '.pdf';
        $receiptFilePath = __DIR__ . '/../../uploads/receipts/' . $receiptFilename;
        if (file_exists($receiptFilePath)) {
            $booking['receipt_url'] = '/Event-yetu/uploads/receipts/' . $receiptFilename;
            // If payment contains stored metadata, prefer that
            if (isset($booking['payment']['receipt_path']) && $booking['payment']['receipt_path']) {
                $booking['receipt_url'] = $booking['payment']['receipt_path'];
            }
            // Include email_sent flag if available
            if (isset($booking['payment']['email_sent'])) {
                $booking['email_sent'] = (int)$booking['payment']['email_sent'];
            }
        } else {
            // If payment has metadata but file missing, still expose path if provided
            if (isset($booking['payment']['receipt_path']) && $booking['payment']['receipt_path']) {
                $booking['receipt_url'] = $booking['payment']['receipt_path'];
                if (isset($booking['payment']['email_sent'])) {
                    $booking['email_sent'] = (int)$booking['payment']['email_sent'];
                }
            }
        }
        
        echo json_encode([
            'success' => true,
            'booking' => $booking
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch booking details', 'message' => $e->getMessage()]);
    }
}

/**
 * Legacy: Create single-service booking (for backward compatibility)
 */
function createBooking($pdo) {
    $token = get_bearer_token();
    $payload = $token ? jwt_validate($token) : null;
    
    if (!$payload) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        return;
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    $serviceId = $data['service_id'] ?? null;
    $date = $data['date'] ?? null;
    
    if (!$serviceId || !$date) {
        http_response_code(400);
        echo json_encode(['error' => 'Service ID and date are required']);
        return;
    }
    
    // Convert to multi-service format and call createMultiServiceBooking
    $_POST = json_encode([
        'services' => [['service_id' => $serviceId, 'quantity' => 1]],
        'event_date' => $date
    ]);
    
    createMultiServiceBooking($pdo);
}

/**
 * Update booking status
 */
function updateBooking($pdo) {
    $token = get_bearer_token();
    $payload = $token ? jwt_validate($token) : null;
    
    if (!$payload) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        return;
    }
    
    $bookingId = $_GET['id'] ?? null;
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$bookingId) {
        http_response_code(400);
        echo json_encode(['error' => 'Booking ID required']);
        return;
    }
    
    $status = $data['status'] ?? null;
    
    if ($status) {
        $stmt = $pdo->prepare('UPDATE bookings SET status = :status WHERE id = :id');
        $stmt->execute([':status' => $status, ':id' => $bookingId]);
    }
    
    echo json_encode(['success' => true, 'message' => 'Booking updated']);
}

/**
 * Cancel booking
 */
function cancelBooking($pdo) {
    $token = get_bearer_token();
    $payload = $token ? jwt_validate($token) : null;
    
    if (!$payload) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        return;
    }
    
    $bookingId = $_GET['id'] ?? null;
    
    if (!$bookingId) {
        http_response_code(400);
        echo json_encode(['error' => 'Booking ID required']);
        return;
    }
    
    $stmt = $pdo->prepare('UPDATE bookings SET status = "cancelled" WHERE id = :id');
    $stmt->execute([':id' => $bookingId]);
    
    echo json_encode(['success' => true, 'message' => 'Booking cancelled']);
}

function getAllBookings($pdo) {
    $token = get_bearer_token();
    $payload = $token ? jwt_validate($token) : null;
    
    if (!$payload || $payload['role'] !== 'admin') {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        return;
    }
    
    $stmt = $pdo->query('
        SELECT b.*, u.name as user_name, u.email as user_email,
               (SELECT COUNT(*) FROM booking_items WHERE booking_id = b.id) as items_count
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        ORDER BY b.created_at DESC
    ');
    
    $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($bookings as &$booking) {
        $stmt = $pdo->prepare('SELECT * FROM booking_items WHERE booking_id = :booking_id');
        $stmt->execute([':booking_id' => $booking['id']]);
        $booking['items'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    echo json_encode(['success' => true, 'bookings' => $bookings]);
}
