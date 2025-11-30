<?php

/**
 * M-Pesa Helper Functions
 * Reusable functions for M-Pesa API integration
 */

require_once __DIR__ . '/../config/mpesa.php';

/**
 * Generate M-Pesa Access Token
 * 
 * @return array ['access_token' => string, 'expires_in' => int] or ['error' => string]
 */
function getMpesaAccessToken()
{
    $credentials = base64_encode(MPESA_CONSUMER_KEY . ':' . MPESA_CONSUMER_SECRET);

    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL => MPESA_AUTH_URL,
        CURLOPT_HTTPHEADER => ['Authorization: Basic ' . $credentials],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => false, // Set to true in production
        CURLOPT_SSL_VERIFYHOST => false  // Set to true in production
    ]);

    $response = curl_exec($curl);
    $error = curl_error($curl);
    $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);

    if ($error) {
        return ['error' => 'cURL Error: ' . $error];
    }

    $result = json_decode($response, true);

    if ($httpCode !== 200 || !isset($result['access_token'])) {
        return ['error' => 'Failed to get access token: ' . ($result['errorMessage'] ?? 'Unknown error')];
    }

    return [
        'access_token' => $result['access_token'],
        'expires_in' => $result['expires_in']
    ];
}

/**
 * Generate M-Pesa Password
 * Password = Base64(Shortcode + Passkey + Timestamp)
 * 
 * @param string $timestamp Format: YYYYMMDDHHmmss
 * @return string Base64 encoded password
 */
function generateMpesaPassword($timestamp)
{
    return base64_encode(MPESA_SHORTCODE . MPESA_PASSKEY . $timestamp);
}

/**
 * Format phone number to M-Pesa format (254XXXXXXXXX)
 * 
 * @param string $phone Input phone number
 * @return string|false Formatted phone or false if invalid
 */
function formatPhoneNumber($phone)
{
    // Remove spaces, dashes, plus signs
    $phone = preg_replace('/[\s\-\+]/', '', $phone);

    // Remove leading zeros
    $phone = ltrim($phone, '0');

    // Add country code if not present
    if (!preg_match('/^254/', $phone)) {
        $phone = '254' . $phone;
    }

    // Validate format (254 followed by 9 digits)
    if (!preg_match('/^254[0-9]{9}$/', $phone)) {
        return false;
    }

    return $phone;
}

/**
 * Validate amount
 * 
 * @param mixed $amount Amount to validate
 * @return float|false Valid amount or false
 */
function validateAmount($amount)
{
    $amount = floatval($amount);

    // Minimum amount is 1 KES
    if ($amount < 1) {
        return false;
    }

    // Maximum amount (adjust as needed)
    if ($amount > 150000) {
        return false;
    }

    return round($amount, 2);
}

/**
 * Sanitize string input
 * 
 * @param string $input Input string
 * @param int $maxLength Maximum length
 * @return string Sanitized string
 */
function sanitizeInput($input, $maxLength = 255)
{
    $input = trim($input);
    $input = strip_tags($input);
    $input = substr($input, 0, $maxLength);
    return $input;
}

/**
 * Log M-Pesa transaction
 * 
 * @param string $type Log type (request, response, error)
 * @param mixed $data Data to log
 * @return void
 */
function logMpesaTransaction($type, $data)
{
    $logDir = __DIR__ . '/../logs';
    if (!file_exists($logDir)) {
        mkdir($logDir, 0755, true);
    }

    $logFile = $logDir . '/mpesa_' . date('Y-m-d') . '.log';
    $timestamp = date('Y-m-d H:i:s');
    $logData = is_array($data) ? json_encode($data, JSON_PRETTY_PRINT) : $data;

    $logMessage = "\n[{$timestamp}] [{$type}]\n{$logData}\n" . str_repeat('-', 80) . "\n";

    file_put_contents($logFile, $logMessage, FILE_APPEND);
}

/**
 * Send JSON response
 * 
 * @param array $data Response data
 * @param int $httpCode HTTP status code
 * @return void
 */
function sendJsonResponse($data, $httpCode = 200)
{
    http_response_code($httpCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

/**
 * Query STK Push transaction status
 * 
 * @param string $checkoutRequestId Checkout Request ID from initial STK Push
 * @return array API response
 */
function querySTKPushStatus($checkoutRequestId)
{
    $tokenData = getMpesaAccessToken();
    if (isset($tokenData['error'])) {
        return ['error' => $tokenData['error']];
    }

    $timestamp = date('YmdHis');
    $password = generateMpesaPassword($timestamp);

    $requestData = [
        'BusinessShortCode' => MPESA_SHORTCODE,
        'Password' => $password,
        'Timestamp' => $timestamp,
        'CheckoutRequestID' => $checkoutRequestId
    ];

    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL => MPESA_STK_QUERY_URL,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $tokenData['access_token'],
            'Content-Type: application/json'
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($requestData),
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false
    ]);

    $response = curl_exec($curl);
    $error = curl_error($curl);
    curl_close($curl);

    if ($error) {
        return ['error' => 'cURL Error: ' . $error];
    }

    return json_decode($response, true);
}
