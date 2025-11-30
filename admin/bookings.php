<?php
require_once __DIR__ . '/../includes/header.php';
if (!is_logged_in() || !is_admin()) {
  header('Location: /Event-yetu/login.php');
  exit;
}
$bookings = $pdo->query('SELECT b.*, s.name as service_name, u.name as provider_name, c.name as client_name FROM bookings b JOIN services s ON b.service_id = s.id JOIN users u ON s.provider_id = u.id JOIN users c ON b.client_id = c.id ORDER BY b.created_at DESC')->fetchAll();
?>
<h2>All Bookings</h2>
<table class="table">
  <thead>
    <tr>
      <th>Service</th>
      <th>Client</th>
      <th>Provider</th>
      <th>Date</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    <?php foreach ($bookings as $b): ?>
      <tr>
        <td><?= htmlspecialchars($b['service_name']) ?></td>
        <td><?= htmlspecialchars($b['client_name']) ?></td>
        <td><?= htmlspecialchars($b['provider_name']) ?></td>
        <td><?= htmlspecialchars($b['date']) ?></td>
        <td><?= htmlspecialchars($b['status']) ?></td>
      </tr>
    <?php endforeach; ?>
  </tbody>
</table>
<?php require_once __DIR__ . '/../includes/footer.php'; ?>