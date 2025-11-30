<?php
require_once __DIR__ . '/../includes/header.php';
if (!is_logged_in()) {
	header('Location: /Event-yetu/login.php');
	exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
	header('Location: /Event-yetu/client/my_bookings.php');
	exit;
}
// CSRF check
if (!isset($_POST['csrf_token']) || !validate_csrf_token($_POST['csrf_token'])) {
	// invalid token, redirect back
	header('Location: /Event-yetu/client/my_bookings.php');
	exit;
}
$id = intval($_POST['id'] ?? 0);
$uid = $_SESSION['user_id'];
$stmt = $pdo->prepare('UPDATE bookings SET status = "cancelled" WHERE id = :id AND client_id = :cid');
$stmt->execute([':id' => $id, ':cid' => $uid]);
header('Location: /Event-yetu/client/my_bookings.php');
exit;
