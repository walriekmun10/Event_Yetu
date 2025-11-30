<?php
// create_admin.php
// Usage (CLI): php create_admin.php --email=admin@example.com --password=Secret123 --name="Admin User"
// Or visit in browser to create via simple form.
require_once __DIR__ . '/config.php';

function cli_get_arg($name)
{
    global $argv;
    foreach ($argv as $a) {
        if (strpos($a, "--$name=") === 0) {
            return substr($a, strlen("--$name="));
        }
    }
    return null;
}

if (php_sapi_name() === 'cli') {
    $email = cli_get_arg('email');
    $password = cli_get_arg('password');
    $name = cli_get_arg('name') ?? 'Administrator';
    if (!$email || !$password) {
        echo "Usage: php create_admin.php --email=admin@example.com --password=Secret123 --name=\"Admin\"\n";
        exit(1);
    }
    // check existing
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = :email');
    $stmt->execute([':email' => $email]);
    if ($stmt->fetch()) {
        echo "User with that email already exists.\n";
        exit(1);
    }
    $hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare('INSERT INTO users (name,email,password,role,created_at) VALUES (:name,:email,:password,:role,NOW())');
    $stmt->execute([':name' => $name, ':email' => $email, ':password' => $hash, ':role' => 'admin']);
    echo "Admin user created with email: $email\n";
    exit(0);
}

$errors = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_POST['csrf_token']) || !validate_csrf_token($_POST['csrf_token'])) {
        $errors[] = 'Invalid CSRF token';
    }
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $name = trim($_POST['name'] ?? 'Administrator');
    if (!$email || !$password) {
        $errors[] = 'Email and password required';
    }
    if (empty($errors)) {
        $stmt = $pdo->prepare('SELECT id FROM users WHERE email = :email');
        $stmt->execute([':email' => $email]);
        if ($stmt->fetch()) {
            $errors[] = 'Email already exists';
        } else {
            $hash = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare('INSERT INTO users (name,email,password,role,created_at) VALUES (:name,:email,:password,:role,NOW())');
            $stmt->execute([':name' => $name, ':email' => $email, ':password' => $hash, ':role' => 'admin']);
            echo "<div class=\"alert alert-success\">Admin user created.</div>";
        }
    }
}

require_once __DIR__ . '/includes/header.php';
?>
<div class="row justify-content-center">
    <div class="col-md-6">
        <h2>Create Admin User</h2>
        <?php if ($errors): ?>
            <div class="alert alert-danger"><?php echo implode('<br>', $errors); ?></div>
        <?php endif; ?>
        <form method="post">
            <?= csrf_input_field() ?>
            <div class="mb-3"><label class="form-label">Name</label><input name="name" class="form-control" required></div>
            <div class="mb-3"><label class="form-label">Email</label><input name="email" type="email" class="form-control" required></div>
            <div class="mb-3"><label class="form-label">Password</label><input name="password" type="password" class="form-control" required></div>
            <button class="btn btn-primary">Create Admin</button>
        </form>
    </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php';
