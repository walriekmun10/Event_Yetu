<?php
// Simple migration runner: php run_sql.php <sql-file>
// Usage: from this directory run: php run_sql.php 20251129_add_payments_receipt_columns.sql

if (php_sapi_name() !== 'cli') {
    echo "This script must be run from the command line." . PHP_EOL;
    exit(1);
}

$file = $argv[1] ?? null;
if (!$file) {
    echo "Usage: php run_sql.php <sql-file>\n";
    exit(1);
}

$path = __DIR__ . '/' . $file;
if (!file_exists($path)) {
    echo "SQL file not found: $path\n";
    exit(1);
}

require_once __DIR__ . '/../config/db.php';

$sql = file_get_contents($path);
if ($sql === false) {
    echo "Failed to read file: $path\n";
    exit(1);
}

try {
    // Split on semicolon followed by newline to avoid simple multi-statement failure
    $statements = array_filter(array_map('trim', preg_split('/;\s*\n/', $sql)));
    $pdo->beginTransaction();
    foreach ($statements as $stmt) {
        if ($stmt === '') continue;
        $pdo->exec($stmt);
    }
    $pdo->commit();
    echo "Migration executed successfully: $file\n";
} catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    echo "Migration failed: " . $e->getMessage() . PHP_EOL;
    exit(1);
}
