<?php
// backend/api/bookings_full.php
// Complete booking API: Multi-service, Packages, Single bookings
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

// Public endpoints (no authentication required)
$publicEndpoints = ['get-packages'];

// Get and validate JWT token
$token = get_bearer_token();
$payload = $token ? jwt_validate($token) : false;

// Check authentication for non-public endpoints
if (!in_array($action, $publicEndpoints) && !$payload) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

$userId = $payload['user_id'] ?? null;
$userRole = $payload['role'];

/**
 * Generate unique booking number
 * Format: BK-YYYYMMDD-####
 */
function generateBookingNumber($pdo) {
    $date = date('Ymd');
    $prefix = "BK-$date-";
    
    $stmt = $pdo->prepare("SELECT booking_number FROM bookings WHERE booking_number LIKE ? ORDER BY id DESC LIMIT 1");
    $stmt->execute([$prefix . '%']);
    $last = $stmt->fetchColumn();
    
    if ($last) {
        $num = (int)substr($last, -4) + 1;
    } else {
        $num = 1;
    }
    
    return $prefix . str_pad($num, 4, '0', STR_PAD_LEFT);
}

/**
 * Book multiple services in one booking
 * POST /api/bookings_full.php?action=book-multiple-services
 */
function bookMultipleServices($pdo, $userId, $userRole) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $services = $data['services'] ?? []; // Array of {service_id, quantity}
    $eventDate = $data['event_date'] ?? null;
    $eventTime = $data['event_time'] ?? null;
    $venue = $data['venue'] ?? '';
    $notes = $data['notes'] ?? '';
    
    if (empty($services)) {
        http_response_code(422);
        echo json_encode(['error' => 'At least one service is required']);
        return;
    }
    
    if (!$eventDate) {
        http_response_code(422);
        echo json_encode(['error' => 'Event date is required']);
        return;
    }
    
    try {
        $pdo->beginTransaction();
        
        // Generate booking number
        $bookingNumber = generateBookingNumber($pdo);
        
        // Create main booking
        $stmt = $pdo->prepare("
            INSERT INTO bookings (booking_number, user_id, user_role, event_date, event_time, venue, notes, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
        ");
        $stmt->execute([$bookingNumber, $userId, $userRole, $eventDate, $eventTime, $venue, $notes]);
        $bookingId = $pdo->lastInsertId();
        
        // Add each service to booking_services
        $totalAmount = 0;
        $bookingItems = [];
        
        foreach ($services as $serviceData) {
            $serviceId = $serviceData['service_id'];
            $quantity = $serviceData['quantity'] ?? 1;
            
            // Get service details
            $serviceStmt = $pdo->prepare("SELECT name, price FROM services WHERE id = ? AND status = 'approved'");
            $serviceStmt->execute([$serviceId]);
            $service = $serviceStmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$service) {
                throw new Exception("Service ID $serviceId not found or not available");
            }
            
            $unitPrice = $service['price'];
            $subtotal = $unitPrice * $quantity;
            $totalAmount += $subtotal;
            
            // Insert into booking_services
            $itemStmt = $pdo->prepare("
                INSERT INTO booking_services (booking_id, service_id, quantity, unit_price, subtotal)
                VALUES (?, ?, ?, ?, ?)
            ");
            $itemStmt->execute([$bookingId, $serviceId, $quantity, $unitPrice, $subtotal]);
            
            $bookingItems[] = [
                'service_id' => $serviceId,
                'service_name' => $service['name'],
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'subtotal' => $subtotal
            ];
        }
        
        // Update total amount (triggers will also do this, but set it explicitly)
        $updateStmt = $pdo->prepare("UPDATE bookings SET total_amount = ? WHERE id = ?");
        $updateStmt->execute([$totalAmount, $bookingId]);
        
        $pdo->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Multi-service booking created successfully',
            'booking' => [
                'id' => $bookingId,
                'booking_number' => $bookingNumber,
                'event_date' => $eventDate,
                'event_time' => $eventTime,
                'venue' => $venue,
                'total_amount' => $totalAmount,
                'status' => 'pending',
                'items' => $bookingItems
            ]
        ]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => 'Booking failed: ' . $e->getMessage()]);
    }
}

/**
 * Book a package
 * POST /api/bookings_full.php?action=book-package
 */
function bookPackage($pdo, $userId, $userRole) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $packageId = $data['package_id'] ?? null;
    $eventDate = $data['event_date'] ?? null;
    $eventTime = $data['event_time'] ?? null;
    $venue = $data['venue'] ?? '';
    $notes = $data['notes'] ?? '';
    
    if (!$packageId) {
        http_response_code(422);
        echo json_encode(['error' => 'Package ID is required']);
        return;
    }
    
    if (!$eventDate) {
        http_response_code(422);
        echo json_encode(['error' => 'Event date is required']);
        return;
    }
    
    try {
        $pdo->beginTransaction();
        
        // Get package details
        $packageStmt = $pdo->prepare("SELECT * FROM packages WHERE id = ? AND status = 'active'");
        $packageStmt->execute([$packageId]);
        $package = $packageStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$package) {
            throw new Exception("Package not found or inactive");
        }
        
        // Generate booking number
        $bookingNumber = generateBookingNumber($pdo);
        
        // Create main booking
        $stmt = $pdo->prepare("
            INSERT INTO bookings (booking_number, user_id, user_role, package_id, event_date, event_time, venue, notes, total_amount, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
        ");
        $stmt->execute([$bookingNumber, $userId, $userRole, $packageId, $eventDate, $eventTime, $venue, $notes, $package['price']]);
        $bookingId = $pdo->lastInsertId();
        
        $pdo->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Package booking created successfully',
            'booking' => [
                'id' => $bookingId,
                'booking_number' => $bookingNumber,
                'package_id' => $packageId,
                'package_name' => $package['name'],
                'event_date' => $eventDate,
                'event_time' => $eventTime,
                'venue' => $venue,
                'total_amount' => $package['price'],
                'status' => 'pending',
                'includes' => json_decode($package['includes'], true)
            ]
        ]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => 'Package booking failed: ' . $e->getMessage()]);
    }
}

/**
 * Get all packages
 * GET /api/bookings_full.php?action=get-packages
 */
function getPackages($pdo) {
    try {
        $stmt = $pdo->query("SELECT * FROM packages WHERE status = 'active' ORDER BY price ASC");
        $packages = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Parse includes JSON
        foreach ($packages as &$package) {
            $package['includes'] = json_decode($package['includes'], true);
        }
        
        echo json_encode([
            'success' => true,
            'packages' => $packages
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch packages: ' . $e->getMessage()]);
    }
}

/**
 * Get my bookings (with services/packages details)
 * GET /api/bookings_full.php?action=my-bookings
 */
function getMyBookings($pdo, $userId, $userRole) {
    try {
        if ($userRole === 'admin') {
            // Admin sees all bookings
            $stmt = $pdo->query("
                SELECT b.*, u.name as user_name, u.email as user_email, p.name as package_name
                FROM bookings b
                LEFT JOIN users u ON b.user_id = u.id
                LEFT JOIN packages p ON b.package_id = p.id
                ORDER BY b.created_at DESC
            ");
        } else {
            // Users see their own bookings
            $stmt = $pdo->prepare("
                SELECT b.*, u.name as user_name, u.email as user_email, p.name as package_name
                FROM bookings b
                LEFT JOIN users u ON b.user_id = u.id
                LEFT JOIN packages p ON b.package_id = p.id
                WHERE b.user_id = ?
                ORDER BY b.created_at DESC
            ");
            $stmt->execute([$userId]);
        }
        
        $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get services for each booking
        foreach ($bookings as &$booking) {
            $servicesStmt = $pdo->prepare("
                SELECT bs.*, s.name as service_name, s.category
                FROM booking_services bs
                LEFT JOIN services s ON bs.service_id = s.id
                WHERE bs.booking_id = ?
            ");
            $servicesStmt->execute([$booking['id']]);
            $booking['services'] = $servicesStmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get payment info
            $paymentStmt = $pdo->prepare("SELECT * FROM payments WHERE booking_id = ? ORDER BY created_at DESC LIMIT 1");
            $paymentStmt->execute([$booking['id']]);
            $booking['payment'] = $paymentStmt->fetch(PDO::FETCH_ASSOC);
        }
        
        echo json_encode([
            'success' => true,
            'bookings' => $bookings
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch bookings: ' . $e->getMessage()]);
    }
}

/**
 * Get single booking details
 * GET /api/bookings_full.php?action=booking-details&booking_id=X
 */
function getBookingDetails($pdo, $userId, $userRole) {
    $bookingId = $_GET['booking_id'] ?? null;
    
    if (!$bookingId) {
        http_response_code(422);
        echo json_encode(['error' => 'Booking ID required']);
        return;
    }
    
    try {
        $stmt = $pdo->prepare("
            SELECT b.*, u.name as user_name, u.email as user_email, u.phone, p.name as package_name, p.includes as package_includes
            FROM bookings b
            LEFT JOIN users u ON b.user_id = u.id
            LEFT JOIN packages p ON b.package_id = p.id
            WHERE b.id = ?
        ");
        $stmt->execute([$bookingId]);
        $booking = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$booking) {
            http_response_code(404);
            echo json_encode(['error' => 'Booking not found']);
            return;
        }
        
        // Authorization check
        if ($userRole !== 'admin' && $booking['user_id'] != $userId) {
            http_response_code(403);
            echo json_encode(['error' => 'Access denied']);
            return;
        }
        
        // Get services
        $servicesStmt = $pdo->prepare("
            SELECT bs.*, s.name as service_name, s.category, s.image
            FROM booking_services bs
            LEFT JOIN services s ON bs.service_id = s.id
            WHERE bs.booking_id = ?
        ");
        $servicesStmt->execute([$bookingId]);
        $booking['services'] = $servicesStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get payment
        $paymentStmt = $pdo->prepare("SELECT * FROM payments WHERE booking_id = ? ORDER BY created_at DESC LIMIT 1");
        $paymentStmt->execute([$bookingId]);
        $booking['payment'] = $paymentStmt->fetch(PDO::FETCH_ASSOC);
        
        // Parse package includes
        if ($booking['package_includes']) {
            $booking['package_includes'] = json_decode($booking['package_includes'], true);
        }
        
        echo json_encode([
            'success' => true,
            'booking' => $booking
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch booking: ' . $e->getMessage()]);
    }
}

// Route requests
switch ($action) {
    case 'book-multiple-services':
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
        }
        bookMultipleServices($pdo, $userId, $userRole);
        break;
        
    case 'book-package':
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
        }
        bookPackage($pdo, $userId, $userRole);
        break;
        
    case 'get-packages':
        if ($method !== 'GET') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
        }
        getPackages($pdo);
        break;
        
    case 'my-bookings':
        if ($method !== 'GET') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
        }
        getMyBookings($pdo, $userId, $userRole);
        break;
        
    case 'booking-details':
        if ($method !== 'GET') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
        }
        getBookingDetails($pdo, $userId, $userRole);
        break;
        
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action. Available: book-multiple-services, book-package, get-packages, my-bookings, booking-details']);
}
