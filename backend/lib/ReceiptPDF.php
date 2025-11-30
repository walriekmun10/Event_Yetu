<?php
require_once __DIR__ . '/../vendor/setasign/fpdf/fpdf.php';

class ReceiptPDF extends FPDF {
    function Header() {
        $this->SetFillColor(79, 70, 229);
        $this->Rect(0, 0, 210, 40, 'F');
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

    // generate minimal receipt content
    function generateReceipt($booking, $items, $payment) {
        $this->SetTextColor(0,0,0);
        $this->SetFont('Arial','B',18);
        $this->SetTextColor(79,70,229);
        $this->Cell(0,10,'BOOKING RECEIPT',0,1,'C');
        $this->Ln(5);

        $this->SetFont('Arial','',10);
        $this->Cell(0,6,'Booking Number: ' . ($booking['booking_number'] ?? $booking['id']), 0, 1);
        $this->Cell(0,6,'Client: ' . ($booking['user_name'] ?? 'Client'), 0, 1);
        $this->Cell(0,6,'Email: ' . ($booking['user_email'] ?? ''), 0, 1);
        $this->Cell(0,6,'Date: ' . date('d M Y', strtotime($booking['created_at'] ?? date('Y-m-d H:i:s'))), 0, 1);
        $this->Ln(6);

        // items
        $this->SetFont('Arial','B',11);
        $this->Cell(120,7,'Service',1,0,'L');
        $this->Cell(40,7,'Amount (KSh)',1,1,'R');
        $this->SetFont('Arial','',10);
        foreach ($items as $it) {
            $name = $it['service_name'] ?? ($it['name'] ?? 'Service');
            $amt = number_format(floatval($it['price'] ?? $it['subtotal'] ?? 0),2);
            $this->Cell(120,7,substr($name,0,50),1,0,'L');
            $this->Cell(40,7,$amt,1,1,'R');
        }

        $this->Ln(4);
        $total = number_format(floatval($booking['total_amount'] ?? $payment['amount'] ?? 0),2);
        $this->SetFont('Arial','B',12);
        $this->Cell(120,8,'TOTAL',1,0,'R');
        $this->Cell(40,8,$total,1,1,'R');

        // payment
        if ($payment) {
            $this->Ln(6);
            $this->SetFont('Arial','',10);
            $this->Cell(0,6,'Payment Status: ' . strtoupper($payment['status']), 0, 1);
            if (!empty($payment['mpesa_receipt'])) $this->Cell(0,6,'M-Pesa Receipt: ' . $payment['mpesa_receipt'], 0,1);
        }
    }
}

?>
