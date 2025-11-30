<?php
// config.php - database connection
session_start();

$host = '127.0.0.1';
$db   = 'event_yetu';
$user = 'root';
$pass = '';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (PDOException $e) {
    // In production, don't echo details
    echo "Database connection failed: " . htmlspecialchars($e->getMessage());
    exit;
}

function is_logged_in()
{
    return isset($_SESSION['user_id']);
}

function is_admin()
{
    return (isset($_SESSION['role']) && $_SESSION['role'] === 'admin');
}

function is_provider()
{
    return (isset($_SESSION['role']) && $_SESSION['role'] === 'provider');
}

// CSRF helpers
function generate_csrf_token()
{
    if (empty($_SESSION['csrf_token'])) {
        try {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        } catch (Exception $e) {
            // fallback
            $_SESSION['csrf_token'] = bin2hex(openssl_random_pseudo_bytes(32));
        }
    }
    return $_SESSION['csrf_token'];
}

function validate_csrf_token($token)
{
    if (empty($token) || empty($_SESSION['csrf_token'])) return false;
    return hash_equals($_SESSION['csrf_token'], $token);
}

function csrf_input_field()
{
    $t = htmlspecialchars(generate_csrf_token());
    return "<input type=\"hidden\" name=\"csrf_token\" value=\"$t\">";
}
