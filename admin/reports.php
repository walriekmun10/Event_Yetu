<?php
require_once __DIR__ . '/../includes/header.php';
if (!is_logged_in() || !is_admin()) {
    header('Location: /Event-yetu/login.php');
    exit;
}

// If FPDF is available, generate PDF. Otherwise show instructions.
// Try Composer autoload first, then fallback to vendor/fpdf.php
$autoload = __DIR__ . '/../vendor/autoload.php';
if (file_exists($autoload)) {
    require_once $autoload;
}
$fpdfPath = __DIR__ . '/../vendor/fpdf.php';
if (class_exists('FPDF') || file_exists($fpdfPath)) {
    if (!class_exists('FPDF') && file_exists($fpdfPath)) {
        require_once $fpdfPath;
    }
    // Gather report data
    $totalBookings = $pdo->query('SELECT COUNT(*) FROM bookings')->fetchColumn();
    $totalRevenue = $pdo->query('SELECT SUM(s.price) FROM bookings b JOIN services s ON b.service_id = s.id WHERE b.status = "booked" OR b.status = "completed"')->fetchColumn();
    $popular = $pdo->query('SELECT s.name, COUNT(*) as cnt FROM bookings b JOIN services s ON b.service_id = s.id GROUP BY s.name ORDER BY cnt DESC LIMIT 5')->fetchAll();

    $pdf = new FPDF();
    $pdf->AddPage();
    $pdf->SetFont('Arial', 'B', 16);
    $pdf->Cell(0, 10, 'Event Yetu - Report', 0, 1);
    $pdf->SetFont('Arial', '', 12);
    $pdf->Cell(0, 8, 'Total bookings: ' . intval($totalBookings), 0, 1);
    $pdf->Cell(0, 8, 'Total revenue (approx): Ksh ' . number_format($totalRevenue, 2), 0, 1);
    $pdf->Ln(6);
    $pdf->Cell(0, 8, 'Top services:', 0, 1);
    foreach ($popular as $p) {
        $pdf->Cell(0, 6, htmlspecialchars($p['name']) . ' - ' . intval($p['cnt']) . ' bookings', 0, 1);
    }
    $pdf->Output('D', 'report.pdf');
    exit;
} else {
    echo '<div class="alert alert-warning">FPDF library not found. To enable PDF reports, download FPDF (http://www.fpdf.org/) and place <code>fpdf.php</code> into <code>/vendor/</code>.</div>';
}

require_once __DIR__ . '/../includes/footer.php';
