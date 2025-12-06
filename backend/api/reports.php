<?php
// backend/api/reports.php
// Generates simple analytics and optional PDF download
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

// Get token from header or URL parameter (for PDF downloads)
$token = get_bearer_token();
if (!$token && isset($_GET['token'])) {
    $token = $_GET['token'];
}

error_log('Reports: Token received: ' . ($token ? 'YES' : 'NO'));
$payload = $token ? jwt_validate($token) : false;
error_log('Reports: Payload validated: ' . ($payload ? 'YES (role=' . ($payload['role'] ?? 'none') . ')' : 'NO'));

if (!$payload || $payload['role'] !== 'admin') {
    error_log('Reports: Unauthorized - payload=' . json_encode($payload));
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// Basic analytics
$totalUsers = $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
$totalProviders = $pdo->query("SELECT COUNT(*) FROM users WHERE user_role='provider'")->fetchColumn();
$totalServices = $pdo->query('SELECT COUNT(*) FROM services')->fetchColumn();
$totalBookings = $pdo->query('SELECT COUNT(*) FROM bookings')->fetchColumn();
$popularRaw = $pdo->query('SELECT s.service_name, COUNT(*) as cnt FROM bookings b JOIN services s ON b.booking_service_id = s.service_id GROUP BY s.service_name ORDER BY cnt DESC LIMIT 5')->fetchAll(PDO::FETCH_ASSOC);

// Map popular services to frontend format
$popular = array_map(function($p) {
    return [
        'name' => $p['service_name'],
        'cnt' => $p['cnt']
    ];
}, $popularRaw);

// Detailed booking information with dates, services, users, and payment status
$detailedBookings = $pdo->query('
    SELECT 
        b.booking_id,
        b.booking_date,
        b.booking_status,
        s.service_name,
        s.service_price,
        u.user_name as client_name,
        u.user_email as client_email,
        p.user_name as provider_name,
        pay.payment_status,
        pay.payment_amount
    FROM bookings b
    JOIN services s ON b.booking_service_id = s.service_id
    JOIN users u ON b.booking_client_id = u.user_id
    LEFT JOIN users p ON s.service_provider_id = p.user_id
    LEFT JOIN payments pay ON b.booking_id = pay.payment_booking_id
    ORDER BY b.booking_date DESC
    LIMIT 100
')->fetchAll(PDO::FETCH_ASSOC);

// Map database columns to frontend-expected format
$mappedBookings = array_map(function($b) {
    return [
        'id' => $b['booking_id'],
        'date' => $b['booking_date'],
        'status' => $b['booking_status'],
        'service_name' => $b['service_name'],
        'price' => $b['service_price'],
        'client_name' => $b['client_name'],
        'client_email' => $b['client_email'],
        'provider_name' => $b['provider_name'],
        'payment_status' => $b['payment_status'],
        'payment_amount' => $b['payment_amount']
    ];
}, $detailedBookings);

$data = [
    'users' => intval($totalUsers),
    'providers' => intval($totalProviders),
    'services' => intval($totalServices),
    'bookings' => intval($totalBookings),
    'popular' => $popular,
    'detailedBookings' => $mappedBookings
];

// If ?format=pdf then attempt to stream a PDF using FPDF (composer or vendor/fpdf.php)
if (isset($_GET['format']) && $_GET['format'] === 'pdf') {
    $autoload = __DIR__ . '/../vendor/autoload.php';
    if (file_exists($autoload)) require_once $autoload;
    $fpdfPath = __DIR__ . '/../vendor/fpdf.php';
    if (class_exists('FPDF') || file_exists($fpdfPath)) {
        if (!class_exists('FPDF') && file_exists($fpdfPath)) require_once $fpdfPath;
        $pdf = new FPDF();
        $pdf->AddPage();
        $pdf->SetFont('Arial', 'B', 16);
        $pdf->Cell(0, 10, 'Event Yetu Report', 0, 1, 'C');
        $pdf->Ln(5);
        
        // Summary Section
        $pdf->SetFont('Arial', 'B', 14);
        $pdf->Cell(0, 8, 'Summary', 0, 1);
        $pdf->SetFont('Arial', '', 12);
        $pdf->Cell(0, 6, 'Users: ' . $data['users'], 0, 1);
        $pdf->Cell(0, 6, 'Providers: ' . $data['providers'], 0, 1);
        $pdf->Cell(0, 6, 'Services: ' . $data['services'], 0, 1);
        $pdf->Cell(0, 6, 'Bookings: ' . $data['bookings'], 0, 1);
        $pdf->Ln(5);
        
        // Top Services Section
        $pdf->SetFont('Arial', 'B', 14);
        $pdf->Cell(0, 8, 'Top Services', 0, 1);
        $pdf->SetFont('Arial', '', 11);
        foreach ($data['popular'] as $p) {
            $pdf->Cell(0, 5, '- ' . $p['service_name'] . ' (' . $p['cnt'] . ' bookings)', 0, 1);
        }
        $pdf->Ln(5);
        
        // Detailed Bookings Section
        $pdf->SetFont('Arial', 'B', 14);
        $pdf->Cell(0, 8, 'Detailed Bookings', 0, 1);
        
        // Table Header
        $pdf->SetFont('Arial', 'B', 9);
        $pdf->SetFillColor(59, 130, 246);
        $pdf->SetTextColor(255, 255, 255);
        $pdf->Cell(25, 7, 'Date', 1, 0, 'C', true);
        $pdf->Cell(50, 7, 'Service', 1, 0, 'C', true);
        $pdf->Cell(45, 7, 'Client', 1, 0, 'C', true);
        $pdf->Cell(40, 7, 'Provider', 1, 0, 'C', true);
        $pdf->Cell(25, 7, 'Price (Ksh)', 1, 1, 'C', true);
        
        // Table Rows
        $pdf->SetFont('Arial', '', 8);
        $pdf->SetTextColor(0, 0, 0);
        $pdf->SetFillColor(240, 240, 240);
        $fill = false;
        $count = 0;
        foreach ($data['detailedBookings'] as $booking) {
            if ($count >= 30) break; // Limit to 30 bookings in PDF
            
            $date = date('M d, Y', strtotime($booking['booking_date']));
            $service = substr($booking['service_name'], 0, 30);
            $client = substr($booking['client_name'], 0, 28);
            $provider = substr($booking['provider_name'] ?? 'N/A', 0, 25);
            $price = number_format($booking['service_price'], 0);
            
            $pdf->Cell(25, 6, $date, 1, 0, 'L', $fill);
            $pdf->Cell(50, 6, $service, 1, 0, 'L', $fill);
            $pdf->Cell(45, 6, $client, 1, 0, 'L', $fill);
            $pdf->Cell(40, 6, $provider, 1, 0, 'L', $fill);
            $pdf->Cell(25, 6, $price, 1, 1, 'R', $fill);
            
            $fill = !$fill;
            $count++;
        }
        
        $pdf->Output('D', 'report.pdf');
        exit;
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'PDF library not installed']);
        exit;
    }
}

echo json_encode($data);
