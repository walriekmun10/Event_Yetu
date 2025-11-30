<?php
/**
 * Receipt Generator API
 * Generates professional PDF receipts for multi-service bookings
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';
require_once __DIR__ . '/../lib/ReceiptPDF.php';

$action = $_GET['action'] ?? 'generate';
$bookingId = $_GET['booking_id'] ?? null;

if (!$bookingId) {
    http_response_code(400);
    echo json_encode(['error' => 'Booking ID required']);
    exit;
}

$token = get_bearer_token();
$payload = $token ? jwt_validate($token) : null;

if (!$payload) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

try {
    // Get booking details
    $stmt = $pdo->prepare('
        SELECT b.*, u.user_name, u.user_email, u.user_role as user_actual_role
        FROM bookings b
        JOIN users u ON b.booking_client_id = u.user_id
        WHERE b.booking_id = :booking_id
    ');
    $stmt->execute([':booking_id' => $bookingId]);
    $booking = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$booking) {
        http_response_code(404);
        echo json_encode(['error' => 'Booking not found']);
        exit;
    }
    
    // Get booking items
    $stmt = $pdo->prepare('SELECT * FROM booking_items WHERE booking_id = :booking_id ORDER BY booking_id');
    $stmt->execute([':booking_id' => $bookingId]);
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get payment info
    $stmt = $pdo->prepare('SELECT * FROM payments WHERE payment_booking_id = :booking_id ORDER BY payment_created_at DESC LIMIT 1');
    $stmt->execute([':booking_id' => $bookingId]);
    $payment = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Generate PDF using shared ReceiptPDF class
    $pdf = new ReceiptPDF();
    $pdf->SetCreator('Event Yetu');
    $pdf->SetAuthor('Event Yetu');
    $pdf->SetTitle('Booking Receipt - ' . ($booking['booking_number'] ?? $booking['booking_id']));

    $pdf->AddPage();
    $pdf->generateReceipt($booking, $items, $payment);

    // Output PDF
    $filename = 'Receipt_' . ($booking['booking_number'] ?? $booking['booking_id']) . '.pdf';
    $pdf->Output('D', $filename);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to generate receipt', 'message' => $e->getMessage()]);
}

/**
 * Custom FPDF class for receipt generation
 */
class ReceiptPDF extends FPDF {
    
    function Header() {
        // Logo/Brand area
        $this->SetFillColor(79, 70, 229); // Indigo
        $this->Rect(0, 0, 210, 40, 'F');
        
        // Company name
        $this->SetTextColor(255, 255, 255);
        $this->SetFont('Arial', 'B', 24);
        $this->SetY(10);
        $this->Cell(0, 10, 'Event Yetu', 0, 1, 'C');
        
        $this->SetFont('Arial', '', 11);
        $this->Cell(0, 6, 'Professional Event Management Services', 0, 1, 'C');
        
        $this->SetFont('Arial', '', 9);
        $this->Cell(0, 5, 'Email: info@eventyetu.com | Phone: +254 712 345 678', 0, 1, 'C');
        
        $this->Ln(10);
    }
    
    function Footer() {
        $this->SetY(-30);
        $this->SetDrawColor(200, 200, 200);
        $this->Line(10, $this->GetY(), 200, $this->GetY());
        
        $this->Ln(3);
        $this->SetFont('Arial', 'I', 8);
        $this->SetTextColor(100, 100, 100);
        $this->Cell(0, 4, 'Thank you for choosing Event Yetu!', 0, 1, 'C');
        $this->Cell(0, 4, 'For support: support@eventyetu.com | Visit: www.eventyetu.com', 0, 1, 'C');
        
        $this->SetY(-15);
        $this->SetFont('Arial', 'I', 8);
        $this->Cell(0, 10, 'Page ' . $this->PageNo(), 0, 0, 'C');
    }
    
    function generateReceipt($booking, $items, $payment) {
        // Reset text color
        $this->SetTextColor(0, 0, 0);
        
        // Receipt title
        $this->SetFont('Arial', 'B', 18);
        $this->SetTextColor(79, 70, 229);
        $this->Cell(0, 10, 'BOOKING RECEIPT', 0, 1, 'C');
        $this->Ln(5);
        
        // Booking details section
        $this->SetFont('Arial', 'B', 11);
        $this->SetTextColor(0, 0, 0);
        $this->Cell(0, 8, 'Booking Information', 0, 1, 'L');
        
        $this->SetFillColor(245, 245, 250);
        $this->Rect(10, $this->GetY(), 190, 35, 'F');
        
        $this->SetFont('Arial', '', 10);
        $y = $this->GetY() + 5;
        $this->SetY($y);
        
        // Left column
        $this->SetX(15);
        $this->Cell(90, 6, 'Booking Number: ' . $booking['booking_number'], 0, 0, 'L');
        
        // Right column
        $this->SetX(105);
        $this->Cell(90, 6, 'Date Issued: ' . date('d M Y', strtotime($booking['created_at'])), 0, 1, 'L');
        
        $this->SetX(15);
        $this->Cell(90, 6, 'Event Date: ' . date('d M Y', strtotime($booking['event_date'])), 0, 0, 'L');
        
        $this->SetX(105);
        $this->Cell(90, 6, 'Status: ' . strtoupper($booking['status']), 0, 1, 'L');
        
        if ($booking['event_time']) {
            $this->SetX(15);
            $this->Cell(90, 6, 'Event Time: ' . date('h:i A', strtotime($booking['event_time'])), 0, 1, 'L');
        }
        
        if ($booking['venue']) {
            $this->SetX(15);
            $this->Cell(180, 6, 'Venue: ' . $booking['venue'], 0, 1, 'L');
        }
        
        $this->Ln(5);
        
        // Client information
        $this->SetFont('Arial', 'B', 11);
        $this->Cell(0, 8, 'Client Information', 0, 1, 'L');
        
        $this->SetFillColor(245, 245, 250);
        $this->Rect(10, $this->GetY(), 190, 18, 'F');
        
        $this->SetFont('Arial', '', 10);
        $y = $this->GetY() + 5;
        $this->SetY($y);
        
        $this->SetX(15);
        $this->Cell(90, 6, 'Name: ' . $booking['user_name'], 0, 0, 'L');
        
        $this->SetX(105);
        $this->Cell(90, 6, 'Email: ' . $booking['user_email'], 0, 1, 'L');
        
        $this->SetX(15);
        $this->Cell(90, 6, 'Role: ' . ucfirst($booking['user_role']), 0, 1, 'L');
        
        $this->Ln(8);
        
        // Services table
        $this->SetFont('Arial', 'B', 11);
        $this->Cell(0, 8, 'Booked Services', 0, 1, 'L');
        
        // Table header
        $this->SetFillColor(79, 70, 229);
        $this->SetTextColor(255, 255, 255);
        $this->SetFont('Arial', 'B', 9);
        
        $this->Cell(60, 8, 'Service Name', 1, 0, 'L', true);
        $this->Cell(35, 8, 'Category', 1, 0, 'L', true);
        $this->Cell(35, 8, 'Provider', 1, 0, 'L', true);
        $this->Cell(20, 8, 'Qty', 1, 0, 'C', true);
        $this->Cell(40, 8, 'Amount (KSh)', 1, 1, 'R', true);
        
        // Table rows
        $this->SetTextColor(0, 0, 0);
        $this->SetFont('Arial', '', 9);
        
        $fill = false;
        foreach ($items as $item) {
            $this->SetFillColor(250, 250, 250);
            
            $this->Cell(60, 7, substr($item['service_name'], 0, 30), 1, 0, 'L', $fill);
            $this->Cell(35, 7, $item['service_category'], 1, 0, 'L', $fill);
            $this->Cell(35, 7, substr($item['provider_name'], 0, 15), 1, 0, 'L', $fill);
            $this->Cell(20, 7, $item['quantity'], 1, 0, 'C', $fill);
            $this->Cell(40, 7, number_format($item['subtotal'], 2), 1, 1, 'R', $fill);
            
            $fill = !$fill;
        }
        
        // Totals section
        $this->Ln(3);
        
        $this->SetFont('Arial', 'B', 10);
        $this->Cell(150, 7, 'Subtotal:', 0, 0, 'R');
        $this->Cell(40, 7, 'KSh ' . number_format($booking['total_amount'], 2), 0, 1, 'R');
        
        $this->SetFont('Arial', 'B', 12);
        $this->SetTextColor(79, 70, 229);
        $this->Cell(150, 8, 'TOTAL AMOUNT:', 0, 0, 'R');
        $this->Cell(40, 8, 'KSh ' . number_format($booking['total_amount'], 2), 0, 1, 'R');
        
        $this->SetTextColor(0, 0, 0);
        $this->Ln(5);
        
        // Payment information
        if ($payment) {
            $this->SetFont('Arial', 'B', 11);
            $this->Cell(0, 8, 'Payment Information', 0, 1, 'L');
            
            $this->SetFillColor(240, 253, 244);
            $this->Rect(10, $this->GetY(), 190, 25, 'F');
            
            $this->SetFont('Arial', '', 10);
            $y = $this->GetY() + 5;
            $this->SetY($y);
            
            $this->SetX(15);
            $this->Cell(90, 6, 'Receipt Number: ' . $payment['receipt_number'], 0, 0, 'L');
            
            $this->SetX(105);
            $this->Cell(90, 6, 'Payment Status: ' . strtoupper($payment['status']), 0, 1, 'L');
            
            $this->SetX(15);
            $this->Cell(90, 6, 'Payment Method: ' . strtoupper($payment['payment_method']), 0, 0, 'L');
            
            if ($payment['mpesa_reference']) {
                $this->SetX(105);
                $this->Cell(90, 6, 'M-Pesa Ref: ' . $payment['mpesa_reference'], 0, 1, 'L');
            } else {
                $this->Ln(6);
            }
            
            if ($payment['paid_at']) {
                $this->SetX(15);
                $this->Cell(90, 6, 'Paid On: ' . date('d M Y H:i', strtotime($payment['paid_at'])), 0, 1, 'L');
            }
        } else {
            $this->SetFont('Arial', 'B', 11);
            $this->SetTextColor(220, 38, 38);
            $this->Cell(0, 8, 'Payment Status: PENDING', 0, 1, 'L');
            $this->SetTextColor(0, 0, 0);
            $this->SetFont('Arial', '', 9);
            $this->Cell(0, 6, 'Please complete payment to confirm your booking.', 0, 1, 'L');
        }
        
        $this->Ln(5);
        
        // Notes
        if ($booking['notes']) {
            $this->SetFont('Arial', 'B', 10);
            $this->Cell(0, 6, 'Additional Notes:', 0, 1, 'L');
            $this->SetFont('Arial', '', 9);
            $this->MultiCell(0, 5, $booking['notes'], 0, 'L');
        }
        
        // Terms and conditions
        $this->Ln(5);
        $this->SetFont('Arial', 'I', 8);
        $this->SetTextColor(100, 100, 100);
        $this->MultiCell(0, 4, 'Terms & Conditions: This receipt is valid for the services listed above. Cancellations must be made 48 hours before the event date. For any queries, please contact our support team.', 0, 'L');
    }
}
