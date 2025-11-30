<?php
require_once __DIR__ . '/includes/header.php';

$errors = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  // CSRF check
  if (!isset($_POST['csrf_token']) || !validate_csrf_token($_POST['csrf_token'])) {
    $errors[] = 'Invalid CSRF token';
  }
  $email = trim($_POST['email']);
  $password = $_POST['password'];
  if (!$email || !$password) {
    $errors[] = 'Email and password required';
  } else {
    $stmt = $pdo->prepare('SELECT id,name,password,role FROM users WHERE email = :email');
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch();
    if ($user && password_verify($password, $user['password'])) {
      $_SESSION['user_id'] = $user['id'];
      $_SESSION['role'] = $user['role'];
      $_SESSION['name'] = $user['name'];
      header('Location: /Event-yetu/index.php');
      exit;
    } else {
      $errors[] = 'Invalid credentials';
    }
  }
}
?>
<div class="row justify-content-center">
  <div class="col-md-6">
    <h2>Login</h2>
    <?php if ($errors): ?>
      <div class="alert alert-danger"><?php echo implode('<br>', $errors); ?></div>
    <?php endif; ?>
    <form method="post" action="/Event-yetu/login.php">
      <?= csrf_input_field() ?>
      <div class="mb-3">
        <label class="form-label">Email</label>
        <input type="email" name="email" class="form-control" required>
      </div>
      <div class="mb-3">
        <label class="form-label">Password</label>
        <input type="password" name="password" class="form-control" required>
      </div>
      <button class="btn btn-primary">Login</button>
    </form>
  </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>