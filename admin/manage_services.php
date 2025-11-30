<?php
require_once __DIR__ . '/../includes/header.php';
if (!is_logged_in() || !is_admin()) {
  header('Location: /Event-yetu/login.php');
  exit;
}
if (isset($_GET['approve'])) {
  $id = intval($_GET['approve']);
  $pdo->prepare("UPDATE services SET status='approved' WHERE id = :id")->execute([':id' => $id]);
  header('Location: /Event-yetu/admin/manage_services.php');
  exit;
}
if (isset($_GET['delete'])) {
  $id = intval($_GET['delete']);
  // delete image
  $s = $pdo->prepare('SELECT image FROM services WHERE id = :id');
  $s->execute([':id' => $id]);
  $row = $s->fetch();
  if ($row && $row['image'] && file_exists(__DIR__ . '/../uploads/services/' . $row['image'])) @unlink(__DIR__ . '/../uploads/services/' . $row['image']);
  $pdo->prepare('DELETE FROM services WHERE id = :id')->execute([':id' => $id]);
  header('Location: /Event-yetu/admin/manage_services.php');
  exit;
}
$services = $pdo->query('SELECT s.*, u.name as provider_name FROM services s JOIN users u ON s.provider_id = u.id ORDER BY s.created_at DESC')->fetchAll();
?>
<h2>Manage Services</h2>
<table class="table">
  <thead>
    <tr>
      <th>Image</th>
      <th>Name</th>
      <th>Provider</th>
      <th>Category</th>
      <th>Status</th>
      <th>Action</th>
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
        <td><?= htmlspecialchars($s['provider_name']) ?></td>
        <td><?= htmlspecialchars($s['category']) ?></td>
        <td><?= htmlspecialchars($s['status']) ?></td>
        <td>
          <?php if ($s['status'] !== 'approved'): ?><a class="btn btn-sm btn-success" href="?approve=<?= $s['id'] ?>">Approve</a><?php endif; ?>
          <a class="btn btn-sm btn-danger" href="?delete=<?= $s['id'] ?>" onclick="return confirm('Delete service?')">Delete</a>
        </td>
      </tr>
    <?php endforeach; ?>
  </tbody>
</table>
<?php require_once __DIR__ . '/../includes/footer.php'; ?>