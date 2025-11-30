<?php

/**
 * Debug M-Pesa STK Push
 * Test the full STK Push flow with detailed logging
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/mpesa.php';
require_once __DIR__ . '/../helpers/mpesa_helpers.php';

echo "=== M-Pesa STK Push Debug ===\n\n";

// Test 1: Get Access Token
echo "1. Testing Access Token...\n";
$tokenData = getMpesaAccessToken();
if (isset($tokenData['error'])) {
    echo "❌ ERROR: " . $tokenData['error'] . "\n\n";
    exit;
} else {
    echo "✅ SUCCESS: Got access token\n";
    echo "   Token: " . substr($tokenData['access_token'], 0, 20) . "...\n";
    echo "   Expires in: " . $tokenData['expires_in'] . " seconds\n\n";
}

// Test 2: Generate Password
echo "2. Generating Password...\n";
$timestamp = date('YmdHis');
$password = generateMpesaPassword($timestamp);
echo "✅ Timestamp: " . $timestamp . "\n";
echo "✅ Password: " . substr($password, 0, 30) . "...\n\n";

// Test 3: Format Phone Number
echo "3. Formatting Phone Number...\n";
$testPhone = '0708374149';
$formatted = formatPhoneNumber($testPhone);
echo "✅ Input: " . $testPhone . "\n";
echo "✅ Formatted: " . $formatted . "\n\n";

// Test 4: Prepare STK Push Request
echo "4. Preparing STK Push Request...\n";
$stkPushData = [
    'BusinessShortCode' => MPESA_SHORTCODE,
    'Password' => $password,
    'Timestamp' => $timestamp,
    'TransactionType' => MPESA_TRANSACTION_TYPE,
    'Amount' => '100',
    'PartyA' => $formatted,
    'PartyB' => MPESA_SHORTCODE,
    'PhoneNumber' => $formatted,
    'CallBackURL' => MPESA_CALLBACK_URL,
    'AccountReference' => 'TestBooking123',
    'TransactionDesc' => 'Test Payment'
];

echo "Request Payload:\n";
echo json_encode($stkPushData, JSON_PRETTY_PRINT) . "\n\n";

// Test 5: Send STK Push
echo "5. Sending STK Push Request...\n";
echo "URL: " . MPESA_STK_PUSH_URL . "\n";

$curl = curl_init();
curl_setopt_array($curl, [
    CURLOPT_URL => MPESA_STK_PUSH_URL,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $tokenData['access_token'],
        'Content-Type: application/json'
    ],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($stkPushData),
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSL_VERIFYHOST => false,
    CURLOPT_VERBOSE => true
]);

$response = curl_exec($curl);
$curlError = curl_error($curl);
$httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
curl_close($curl);

echo "\n6. Response:\n";
echo "HTTP Code: " . $httpCode . "\n";

if ($curlError) {
    echo "❌ cURL Error: " . $curlError . "\n";
} else {
    echo "Response Body:\n";
    $result = json_decode($response, true);
    if ($result) {
        echo json_encode($result, JSON_PRETTY_PRINT) . "\n";

        if (isset($result['ResponseCode']) && $result['ResponseCode'] === '0') {
            echo "\n✅ STK Push sent successfully!\n";
            echo "   MerchantRequestID: " . $result['MerchantRequestID'] . "\n";
            echo "   CheckoutRequestID: " . $result['CheckoutRequestID'] . "\n";
        } else {
            echo "\n❌ STK Push failed\n";
            echo "   Error: " . ($result['errorMessage'] ?? $result['ResponseDescription'] ?? 'Unknown error') . "\n";
        }
    } else {
        echo "Raw Response: " . $response . "\n";
    }
}

echo "\n=== Debug Complete ===\n";
