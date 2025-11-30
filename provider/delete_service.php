<?php
require_once __DIR__ . '/../includes/header.php';
if (!is_logged_in() || !is_provider()) {
    header('Location: /Event-yetu/login.php');
    exit;
}
$uid = $_SESSION['user_id'];
$id = intval($_GET['id'] ?? 0);
$stmt = $pdo->prepare('SELECT * FROM services WHERE id = :id AND provider_id = :pid');
$stmt->execute([':id' => $id, ':pid' => $uid]);
$svc = $stmt->fetch();
if (!$svc) {
    header('Location: /Event-yetu/provider/my_services.php');
    exit;
}
// delete image from services folder
if ($svc['image'] && file_exists(__DIR__ . '/../uploads/services/' . $svc['image'])) @unlink(__DIR__ . '/../uploads/services/' . $svc['image']);
$stmt = $pdo->prepare('DELETE FROM services WHERE id = :id AND provider_id = :pid');
$stmt->execute([':id' => $id, ':pid' => $uid]);
header('Location: /Event-yetu/provider/my_services.php');
exit;
