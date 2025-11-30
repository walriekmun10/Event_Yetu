<?php

/**
 * M-Pesa Daraja API Configuration
 * 
 * IMPORTANT: In production, store these values in environment variables or a secure config file
 * Never commit real credentials to version control
 */

// TEST MODE - Set to true to simulate payments without calling M-Pesa API
// Useful for local development without ngrok
define('MPESA_TEST_MODE', false); // Set to false in production

// M-Pesa API Credentials (Safaricom Sandbox)
define('MPESA_ENV', 'sandbox'); // 'sandbox' or 'production'

// Consumer Key and Secret from Daraja Portal
define('MPESA_CONSUMER_KEY', 'ihauZiiBcGw9v3psXzneygkAqOWoULPgUd0ZS6h2endKfA5P');
define('MPESA_CONSUMER_SECRET', 'B3LZmnTLsAAHZUIDGxOsmkrujreHvmK0T4KrTPlPRYsCdj5p4Q4JroGqPVy788mp');

// Business Short Code (Paybill or Till Number)
define('MPESA_SHORTCODE', '174379'); // Sandbox shortcode

// Lipa Na M-Pesa Online Passkey
define('MPESA_PASSKEY', 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919'); // Sandbox passkey

// Callback URL (where M-Pesa will send payment confirmation)
// IMPORTANT: Must be a publicly accessible HTTPS URL
// For local testing, use ngrok or similar tunneling service
define('MPESA_CALLBACK_URL', 'https://unquailing-unsucceeded-mitzi.ngrok-free.dev/Event-yetu/backend/api/payments/mpesa_callback.php');

// API URLs
if (MPESA_ENV === 'sandbox') {
    define('MPESA_BASE_URL', 'https://sandbox.safaricom.co.ke');
} else {
    define('MPESA_BASE_URL', 'https://api.safaricom.co.ke');
}

define('MPESA_AUTH_URL', MPESA_BASE_URL . '/oauth/v1/generate?grant_type=client_credentials');
define('MPESA_STK_PUSH_URL', MPESA_BASE_URL . '/mpesa/stkpush/v1/processrequest');
define('MPESA_STK_QUERY_URL', MPESA_BASE_URL . '/mpesa/stkpushquery/v1/query');

// Transaction Types
define('MPESA_TRANSACTION_TYPE', 'CustomerPayBillOnline'); // or 'CustomerBuyGoodsOnline' for Till

// Default Account Reference (can be overridden per transaction)
define('MPESA_ACCOUNT_REFERENCE', 'EventYetu');

// Default Transaction Description
define('MPESA_TRANSACTION_DESC', 'Event Service Payment');
