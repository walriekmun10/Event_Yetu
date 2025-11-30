<?php

/**
 * M-Pesa Configuration Check Endpoint
 * Verifies M-Pesa configuration and credentials
 * 
 * GET /api/payments/check_config.php
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../config/mpesa.php';
require_once __DIR__ . '/../../helpers/mpesa_helpers.php';

$checks = [];

// Check 1: Credentials configured
$checks['credentials_set'] = [
    'status' => MPESA_CONSUMER_KEY !== 'YOUR_CONSUMER_KEY_HERE' &&
        MPESA_CONSUMER_SECRET !== 'YOUR_CONSUMER_SECRET_HERE',
    'message' => MPESA_CONSUMER_KEY !== 'YOUR_CONSUMER_KEY_HERE' ?
        'Credentials are configured' :
        'Please set MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET'
];

// Check 2: Environment
$checks['environment'] = [
    'status' => true,
    'value' => MPESA_ENV,
    'message' => 'Using ' . MPESA_ENV . ' environment'
];

// Check 3: Shortcode
$checks['shortcode'] = [
    'status' => !empty(MPESA_SHORTCODE),
    'value' => MPESA_SHORTCODE,
    'message' => 'Shortcode: ' . MPESA_SHORTCODE
];

// Check 4: Callback URL
$checks['callback_url'] = [
    'status' => MPESA_CALLBACK_URL !== 'https://your-domain.com/Event-yetu/backend/api/payments/mpesa_callback.php',
    'value' => MPESA_CALLBACK_URL,
    'message' => MPESA_CALLBACK_URL !== 'https://your-domain.com/Event-yetu/backend/api/payments/mpesa_callback.php' ?
        'Callback URL configured' :
        'Please configure MPESA_CALLBACK_URL with ngrok or public URL'
];

// Check 5: Access Token Test (only if credentials are set)
if ($checks['credentials_set']['status']) {
    $tokenResult = getMpesaAccessToken();
    $checks['access_token'] = [
        'status' => !isset($tokenResult['error']),
        'message' => isset($tokenResult['error']) ?
            'Failed: ' . $tokenResult['error'] :
            'Successfully obtained access token',
        'expires_in' => $tokenResult['expires_in'] ?? null
    ];
} else {
    $checks['access_token'] = [
        'status' => false,
        'message' => 'Skipped - credentials not configured'
    ];
}

// Check 6: Database connection
try {
    require_once __DIR__ . '/../../config/db.php';
    $stmt = $pdo->query("SHOW TABLES LIKE 'payments'");
    $tableExists = $stmt->fetch() !== false;

    $checks['database'] = [
        'status' => $tableExists,
        'message' => $tableExists ? 'Payments table exists' : 'Payments table not found'
    ];
} catch (Exception $e) {
    $checks['database'] = [
        'status' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ];
}

// Overall status
$allPassed = true;
foreach ($checks as $check) {
    if (!$check['status']) {
        $allPassed = false;
        break;
    }
}

$response = [
    'success' => true,
    'all_checks_passed' => $allPassed,
    'checks' => $checks,
    'recommendations' => []
];

// Add recommendations
if (!$checks['credentials_set']['status']) {
    $response['recommendations'][] = 'Get credentials from https://developer.safaricom.co.ke/';
}

if (!$checks['callback_url']['status']) {
    $response['recommendations'][] = 'Setup ngrok for local testing: ngrok http 80';
}

if (!$checks['access_token']['status'] && $checks['credentials_set']['status']) {
    $response['recommendations'][] = 'Verify your M-Pesa credentials are correct';
}

if (!$checks['database']['status']) {
    $response['recommendations'][] = 'Import database schema: mysql -u root event_yetu < backend/db.sql';
}

echo json_encode($response, JSON_PRETTY_PRINT);
