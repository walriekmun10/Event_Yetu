<?php
require_once __DIR__ . '/../includes/header.php';
if (!is_logged_in() || !is_admin()) {
  header('Location: /Event-yetu/login.php');
  exit;
}
if (isset($_GET['delete'])) {
  $id = intval($_GET['delete']);
  $pdo->prepare('DELETE FROM users WHERE id = :id')->execute([':id' => $id]);
  header('Location: /Event-yetu/admin/manage_users.php');
  exit;
}
if (isset($_GET['setadmin'])) {
  $id = intval($_GET['setadmin']);
  $pdo->prepare("UPDATE users SET role='admin' WHERE id = :id")->execute([':id' => $id]);
  header('Location: /Event-yetu/admin/manage_users.php');
  exit;
}
$users = $pdo->query('SELECT * FROM users ORDER BY created_at DESC')->fetchAll();
?>
<h2>Manage Users</h2>
<table class="table">
  <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
      <th>Role</th>
      <th>Created</th>
      <th>Action</th>
    </tr>
  </thead>
  <tbody>
    <?php foreach ($users as $u): ?>
      <tr>
        <td><?= htmlspecialchars($u['name']) ?></td>
        <td><?= htmlspecialchars($u['email']) ?></td>
        <td><?= htmlspecialchars($u['role']) ?></td>
        <td><?= htmlspecialchars($u['created_at']) ?></td>
        <td>
          <?php if ($u['role'] !== 'admin'): ?>
            <a class="btn btn-sm btn-warning" href="?setadmin=<?= $u['id'] ?>">Make Admin</a>
          <?php endif; ?>
          <a class="btn btn-sm btn-danger" href="?delete=<?= $u['id'] ?>" onclick="return confirm('Delete user?')">Delete</a>
        </td>
      </tr>
    <?php endforeach; ?>
  </tbody>
</table>
<?php require_once __DIR__ . '/../includes/footer.php'; ?>