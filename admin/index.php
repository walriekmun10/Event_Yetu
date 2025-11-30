<?php
require_once __DIR__ . '/../includes/header.php';
if (!is_logged_in() || !is_admin()) {
  header('Location: /Event-yetu/login.php');
  exit;
}
// quick stats
$totalUsers = $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
$totalProviders = $pdo->query("SELECT COUNT(*) FROM users WHERE role='provider'")->fetchColumn();
$totalBookings = $pdo->query('SELECT COUNT(*) FROM bookings')->fetchColumn();
$totalServices = $pdo->query('SELECT COUNT(*) FROM services')->fetchColumn();
?>
<h2>Admin Dashboard</h2>
<div class="row">
  <div class="col-md-3">
    <div class="card p-3">
      <h4><?= intval($totalUsers) ?></h4>
      <p>Users</p>
    </div>
  </div>
  <div class="col-md-3">
    <div class="card p-3">
      <h4><?= intval($totalProviders) ?></h4>
      <p>Providers</p>
    </div>
  </div>
  <div class="col-md-3">
    <div class="card p-3">
      <h4><?= intval($totalServices) ?></h4>
      <p>Services</p>
    </div>
  </div>
  <div class="col-md-3">
    <div class="card p-3">
      <h4><?= intval($totalBookings) ?></h4>
      <p>Bookings</p>
    </div>
  </div>
</div>

<div class="mt-3">
  <a class="btn btn-primary" href="/Event-yetu/admin/manage_users.php">Manage Users</a>
  <a class="btn btn-primary" href="/Event-yetu/admin/manage_services.php">Manage Services</a>
  <a class="btn btn-primary" href="/Event-yetu/admin/bookings.php">View Bookings</a>
  <a class="btn btn-success" href="/Event-yetu/admin/reports.php">Generate PDF Report</a>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>