<?php
require_once __DIR__ . '/../includes/header.php';
if (!is_logged_in() || !is_provider()) {
  header('Location: /Event-yetu/login.php');
  exit;
}
$uid = $_SESSION['user_id'];
$stmt = $pdo->prepare('SELECT * FROM services WHERE provider_id = :pid');
$stmt->execute([':pid' => $uid]);
$services = $stmt->fetchAll();
?>
<h2>My Services</h2>
<a class="btn btn-success mb-3" href="/Event-yetu/provider/add_service.php">Add Service</a>
<table class="table table-striped">
  <thead>
    <tr>
      <th>Image</th>
      <th>Name</th>
      <th>Category</th>
      <th>Price</th>
      <th>Status</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    <?php foreach ($services as $s): ?>
      <tr>
        <td>
          <?php if ($s['image']): ?>
            <img src="/Event-yetu/uploads/services/<?= htmlspecialchars($s['image']) ?>" alt="" style="width:64px;height:64px;object-fit:cover;border-radius:6px;" />
          <?php endif; ?>
        </td>
        <td><?= htmlspecialchars($s['name']) ?></td>
        <td><?= htmlspecialchars($s['category']) ?></td>
        <td><?= number_format($s['price'], 2) ?></td>
        <td><?= htmlspecialchars($s['status']) ?></td>
        <td>
          <a class="btn btn-sm btn-primary" href="/Event-yetu/provider/edit_service.php?id=<?= $s['id'] ?>">Edit</a>
          <a class="btn btn-sm btn-danger" href="/Event-yetu/provider/delete_service.php?id=<?= $s['id'] ?>" onclick="return confirm('Delete service?')">Delete</a>
        </td>
      </tr>
    <?php endforeach; ?>
  </tbody>
</table>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>