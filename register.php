<?php
require_once __DIR__ . '/includes/header.php';

$errors = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  // CSRF check
  if (!isset($_POST['csrf_token']) || !validate_csrf_token($_POST['csrf_token'])) {
    $errors[] = 'Invalid CSRF token';
  }
  $name = trim($_POST['name']);
  $email = trim($_POST['email']);
  $password = $_POST['password'];
  $role = $_POST['role'] === 'provider' ? 'provider' : 'client';

  if (!$name) $errors[] = 'Name is required';
  if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'Valid email is required';
  if (strlen($password) < 6) $errors[] = 'Password must be at least 6 characters';

  if (empty($errors)) {
    // check existing
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = :email');
    $stmt->execute([':email' => $email]);
    if ($stmt->fetch()) {
      $errors[] = 'Email already registered';
    } else {
      $hash = password_hash($password, PASSWORD_DEFAULT);
      $stmt = $pdo->prepare('INSERT INTO users (name,email,password,role,created_at) VALUES (:name,:email,:password,:role,NOW())');
      $stmt->execute([':name' => $name, ':email' => $email, ':password' => $hash, ':role' => $role]);
      $_SESSION['user_id'] = $pdo->lastInsertId();
      $_SESSION['role'] = $role;
      header('Location: /Event-yetu/index.php');
      exit;
    }
  }
}
?>
<div class="row justify-content-center">
  <div class="col-md-6">
    <h2>Register</h2>
    <?php if ($errors): ?>
      <div class="alert alert-danger"><?php echo implode('<br>', $errors); ?></div>
    <?php endif; ?>
    <form method="post" action="/Event-yetu/register.php">
      <?= csrf_input_field() ?>
      <div class="mb-3">
        <label class="form-label">Name</label>
        <input type="text" name="name" class="form-control" required>
      </div>
      <div class="mb-3">
        <label class="form-label">Email</label>
        <input type="email" name="email" class="form-control" required>
      </div>
      <div class="mb-3">
        <label class="form-label">Password</label>
        <input type="password" name="password" class="form-control" required>
      </div>
      <div class="mb-3">
        <label class="form-label">Role</label>
        <select name="role" class="form-select">
          <option value="client">Client</option>
          <option value="provider">Service Provider</option>
        </select>
      </div>
      <button class="btn btn-primary">Register</button>
    </form>
  </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>