<?php
require_once __DIR__ . '/../includes/header.php';
$id = intval($_GET['id'] ?? 0);
$stmt = $pdo->prepare('SELECT s.*, u.name as provider_name FROM services s JOIN users u ON s.provider_id = u.id WHERE s.id = :id AND s.status = "approved"');
$stmt->execute([':id' => $id]);
$s = $stmt->fetch();
if (!$s) {
  echo '<div class="alert alert-danger">Service not found or not approved.</div>';
  require_once __DIR__ . '/../includes/footer.php';
  exit;
}
$errors = [];
$success = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  if (!is_logged_in()) {
    header('Location: /Event-yetu/login.php');
    exit;
  }
  // CSRF check
  if (!isset($_POST['csrf_token']) || !validate_csrf_token($_POST['csrf_token'])) {
    $errors[] = 'Invalid CSRF token';
  }
  $date = $_POST['date'];
  if (!$date) $errors[] = 'Date required';
  if (empty($errors)) {
    $stmt = $pdo->prepare('INSERT INTO bookings (client_id,service_id,date,status,created_at) VALUES (:cid,:sid,:date,"booked",NOW())');
    $stmt->execute([':cid' => $_SESSION['user_id'], ':sid' => $s['id'], ':date' => $date]);
    $success = 'Booking successful. You will receive a confirmation.';
  }
}
?>
<div class="row">
  <div class="col-md-8">
    <?php if ($s['image'] && file_exists(__DIR__ . '/../uploads/services/' . $s['image'])): ?>
      <img src="/Event-yetu/uploads/services/<?= htmlspecialchars($s['image']) ?>" class="img-fluid mb-3">
    <?php endif; ?>
    <h3><?= htmlspecialchars($s['name']) ?></h3>
    <p><strong>Provider:</strong> <?= htmlspecialchars($s['provider_name']) ?></p>
    <p><?= nl2br(htmlspecialchars($s['description'])) ?></p>
    <p><strong>Price:</strong> Ksh <?= number_format($s['price'], 2) ?></p>
  </div>
  <div class="col-md-4">
    <h4>Book this service</h4>
    <?php if ($errors): ?><div class="alert alert-danger"><?php echo implode('<br>', $errors); ?></div><?php endif; ?>
    <?php if ($success): ?><div class="alert alert-success"><?= $success ?></div><?php endif; ?>
    <form method="post">
      <?= csrf_input_field() ?>
      <div class="mb-3"><label class="form-label">Date</label><input type="date" name="date" class="form-control" required></div>
      <button class="btn btn-primary">Book</button>
    </form>
  </div>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>