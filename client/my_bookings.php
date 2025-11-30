<?php
require_once __DIR__ . '/../includes/header.php';
if (!is_logged_in()) {
  header('Location: /Event-yetu/login.php');
  exit;
}
$uid = $_SESSION['user_id'];
$stmt = $pdo->prepare('SELECT b.*, s.name as service_name, u.name as provider_name FROM bookings b JOIN services s ON b.service_id = s.id JOIN users u ON s.provider_id = u.id WHERE b.client_id = :cid ORDER BY b.created_at DESC');
$stmt->execute([':cid' => $uid]);
$bookings = $stmt->fetchAll();
?>
<h2>My Bookings</h2>
<table class="table">
  <thead>
    <tr>
      <th>Service</th>
      <th>Provider</th>
      <th>Date</th>
      <th>Status</th>
      <th>Action</th>
    </tr>
  </thead>
  <tbody>
    <?php foreach ($bookings as $b): ?>
      <tr>
        <td><?= htmlspecialchars($b['service_name']) ?></td>
        <td><?= htmlspecialchars($b['provider_name']) ?></td>
        <td><?= htmlspecialchars($b['date']) ?></td>
        <td><?= htmlspecialchars($b['status']) ?></td>
        <td>
          <?php if ($b['status'] === 'booked'): ?>
            <form method="post" action="/Event-yetu/client/cancel_booking.php" onsubmit="return confirm('Cancel booking?')" style="display:inline">
              <?= csrf_input_field() ?>
              <input type="hidden" name="id" value="<?= $b['id'] ?>">
              <button class="btn btn-sm btn-danger">Cancel</button>
            </form>
          <?php endif; ?>
        </td>
      </tr>
    <?php endforeach; ?>
  </tbody>
</table>
<?php require_once __DIR__ . '/../includes/footer.php'; ?>