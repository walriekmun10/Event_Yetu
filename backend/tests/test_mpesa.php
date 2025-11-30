<?php

/**
 * M-Pesa Integration Test Script
 * Run this file to test your M-Pesa STK Push integration
 * 
 * Usage: 
 * 1. Make sure XAMPP/Apache is running
 * 2. Open browser: http://localhost/Event-yetu/backend/tests/test_mpesa.php
 * OR
 * 3. Run from terminal: php test_mpesa.php
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

// Include required files
require_once __DIR__ . '/../config/mpesa.php';
require_once __DIR__ . '/../helpers/mpesa_helpers.php';

?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>M-Pesa Integration Test</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }

        .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
        }

        .header p {
            opacity: 0.9;
        }

        .content {
            padding: 30px;
        }

        .test-section {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            border-left: 4px solid #667eea;
        }

        .test-section h2 {
            color: #333;
            margin-bottom: 15px;
            font-size: 20px;
        }

        .test-result {
            padding: 15px;
            border-radius: 6px;
            margin-top: 10px;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            white-space: pre-wrap;
            word-wrap: break-word;
        }

        .success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }

        .error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }

        .info {
            background: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
        }

        .warning {
            background: #fff3cd;
            color: #856404;
            border: 1px solid #ffeeba;
        }

        .config-item {
            display: flex;
            justify-content: space-between;
            padding: 10px;
            border-bottom: 1px solid #e0e0e0;
        }

        .config-item:last-child {
            border-bottom: none;
        }

        .config-label {
            font-weight: 600;
            color: #555;
        }

        .config-value {
            color: #333;
            font-family: 'Courier New', monospace;
        }

        .btn {
            display: inline-block;
            padding: 12px 24px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            text-decoration: none;
            transition: transform 0.2s;
        }

        .btn:hover {
            transform: translateY(-2px);
        }

        .form-group {
            margin-bottom: 15px;
        }

        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
            color: #555;
        }

        .form-group input {
            width: 100%;
            padding: 10px;
            border: 2px solid #e0e0e0;
            border-radius: 6px;
            font-size: 14px;
        }

        .form-group input:focus {
            outline: none;
            border-color: #667eea;
        }

        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
        }

        .badge-success {
            background: #28a745;
            color: white;
        }

        .badge-danger {
            background: #dc3545;
            color: white;
        }

        .badge-warning {
            background: #ffc107;
            color: #333;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="header">
            <h1>🚀 M-Pesa Integration Test Suite</h1>
            <p>Event Yetu - Payment Gateway Testing</p>
        </div>

        <div class="content">
            <!-- Configuration Check -->
            <div class="test-section">
                <h2>📋 1. Configuration Check</h2>
                <?php
                $configOk = true;
                $configIssues = [];

                if (MPESA_CONSUMER_KEY === 'YOUR_CONSUMER_KEY_HERE') {
                    $configOk = false;
                    $configIssues[] = 'MPESA_CONSUMER_KEY not configured';
                }
                if (MPESA_CONSUMER_SECRET === 'YOUR_CONSUMER_SECRET_HERE') {
                    $configOk = false;
                    $configIssues[] = 'MPESA_CONSUMER_SECRET not configured';
                }
                ?>

                <div class="config-item">
                    <span class="config-label">Environment:</span>
                    <span class="config-value">
                        <?php echo MPESA_ENV; ?>
                        <span class="badge badge-<?php echo MPESA_ENV === 'sandbox' ? 'warning' : 'success'; ?>">
                            <?php echo strtoupper(MPESA_ENV); ?>
                        </span>
                    </span>
                </div>
                <div class="config-item">
                    <span class="config-label">Business Shortcode:</span>
                    <span class="config-value"><?php echo MPESA_SHORTCODE; ?></span>
                </div>
                <div class="config-item">
                    <span class="config-label">Consumer Key:</span>
                    <span class="config-value">
                        <?php echo MPESA_CONSUMER_KEY === 'YOUR_CONSUMER_KEY_HERE'
                            ? '<span class="badge badge-danger">NOT SET</span>'
                            : substr(MPESA_CONSUMER_KEY, 0, 10) . '...'; ?>
                    </span>
                </div>
                <div class="config-item">
                    <span class="config-label">Callback URL:</span>
                    <span class="config-value"><?php echo MPESA_CALLBACK_URL; ?></span>
                </div>

                <?php if ($configOk): ?>
                    <div class="test-result success">✅ Configuration looks good!</div>
                <?php else: ?>
                    <div class="test-result error">
                        ❌ Configuration issues found:
                        <?php foreach ($configIssues as $issue): ?>
                            - <?php echo $issue . "\n"; ?>
                        <?php endforeach; ?>

                        Please update backend/config/mpesa.php with your credentials.
                    </div>
                <?php endif; ?>
            </div>

            <!-- Access Token Test -->
            <div class="test-section">
                <h2>🔐 2. Access Token Test</h2>
                <?php
                if ($configOk) {
                    $tokenResult = getMpesaAccessToken();
                    if (isset($tokenResult['error'])): ?>
                        <div class="test-result error">
                            ❌ Failed to get access token
                            Error: <?php echo $tokenResult['error']; ?>
                        </div>
                    <?php else: ?>
                        <div class="test-result success">
                            ✅ Access token retrieved successfully!
                            Token: <?php echo substr($tokenResult['access_token'], 0, 20); ?>...
                            Expires in: <?php echo $tokenResult['expires_in']; ?> seconds
                        </div>
                    <?php endif;
                } else { ?>
                    <div class="test-result warning">⚠️ Skipped - Fix configuration first</div>
                <?php } ?>
            </div>

            <!-- Helper Functions Test -->
            <div class="test-section">
                <h2>🔧 3. Helper Functions Test</h2>
                <?php
                $testPhone1 = formatPhoneNumber('0712345678');
                $testPhone2 = formatPhoneNumber('+254712345678');
                $testPhone3 = formatPhoneNumber('712345678');
                $testAmount = validateAmount(1000);
                ?>
                <div class="test-result info">
                    <strong>Phone Number Formatting:</strong>
                    ✓ 0712345678 → <?php echo $testPhone1; ?>
                    ✓ +254712345678 → <?php echo $testPhone2; ?>
                    ✓ 712345678 → <?php echo $testPhone3; ?>

                    <strong>Amount Validation:</strong>
                    ✓ 1000 → <?php echo $testAmount; ?> KES

                    <strong>Password Generation:</strong>
                    ✓ Generated: <?php echo substr(generateMpesaPassword(date('YmdHis')), 0, 30); ?>...
                </div>
            </div>

            <!-- STK Push Test Form -->
            <div class="test-section">
                <h2>📱 4. STK Push Test</h2>
                <p style="margin-bottom: 15px; color: #666;">
                    <strong>Note:</strong> Use Safaricom sandbox test numbers (254708374149, PIN: 1234)
                </p>

                <form id="stkForm" style="margin-bottom: 15px;">
                    <div class="form-group">
                        <label>Phone Number:</label>
                        <input type="text" id="phoneNumber" placeholder="254708374149" value="254708374149">
                    </div>
                    <div class="form-group">
                        <label>Amount (KES):</label>
                        <input type="number" id="amount" placeholder="10" value="10">
                    </div>
                    <div class="form-group">
                        <label>Booking ID:</label>
                        <input type="number" id="bookingId" placeholder="1" value="1">
                    </div>
                    <div class="form-group">
                        <label>Description:</label>
                        <input type="text" id="description" placeholder="Test Payment" value="Test Payment">
                    </div>
                    <button type="submit" class="btn">Send STK Push</button>
                </form>

                <div id="stkResult"></div>
            </div>

            <!-- Payment Status Check -->
            <div class="test-section">
                <h2>🔍 5. Check Payment Status</h2>
                <form id="statusForm" style="margin-bottom: 15px;">
                    <div class="form-group">
                        <label>Payment ID:</label>
                        <input type="number" id="paymentId" placeholder="1">
                    </div>
                    <button type="submit" class="btn">Check Status</button>
                </form>

                <div id="statusResult"></div>
            </div>

            <!-- Quick Links -->
            <div class="test-section">
                <h2>📚 Resources</h2>
                <div style="display: grid; gap: 10px;">
                    <a href="https://developer.safaricom.co.ke/" target="_blank" class="btn" style="text-align: center;">
                        Safaricom Daraja Portal
                    </a>
                    <a href="../logs/" target="_blank" class="btn" style="text-align: center; background: #6c757d;">
                        View Logs
                    </a>
                    <a href="../MPESA_SETUP.md" target="_blank" class="btn" style="text-align: center; background: #28a745;">
                        Setup Documentation
                    </a>
                </div>
            </div>
        </div>
    </div>

    <script>
        // STK Push Test
        document.getElementById('stkForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const resultDiv = document.getElementById('stkResult');
            resultDiv.innerHTML = '<div class="test-result info">⏳ Sending STK Push...</div>';

            try {
                const response = await fetch('/Event-yetu/backend/api/payments/mpesa_stk_push.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        phoneNumber: document.getElementById('phoneNumber').value,
                        amount: parseFloat(document.getElementById('amount').value),
                        bookingId: parseInt(document.getElementById('bookingId').value),
                        description: document.getElementById('description').value
                    })
                });

                const data = await response.json();

                if (data.success) {
                    resultDiv.innerHTML = `
                        <div class="test-result success">
                            ✅ STK Push sent successfully!
                            
                            Payment ID: ${data.paymentId}
                            Merchant Request: ${data.merchantRequestId}
                            Checkout Request: ${data.checkoutRequestId}
                            Message: ${data.customerMessage}
                            
                            📱 Check your phone and enter PIN!
                            
                            (Auto-checking status in 5 seconds...)
                        </div>
                    `;

                    // Auto-check status after 5 seconds
                    setTimeout(() => {
                        document.getElementById('paymentId').value = data.paymentId;
                        checkPaymentStatus(data.paymentId);
                    }, 5000);
                } else {
                    resultDiv.innerHTML = `
                        <div class="test-result error">
                            ❌ STK Push failed
                            Error: ${data.error}
                        </div>
                    `;
                }
            } catch (error) {
                resultDiv.innerHTML = `
                    <div class="test-result error">
                        ❌ Request failed: ${error.message}
                    </div>
                `;
            }
        });

        // Payment Status Check
        document.getElementById('statusForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const paymentId = document.getElementById('paymentId').value;
            checkPaymentStatus(paymentId);
        });

        async function checkPaymentStatus(paymentId) {
            const resultDiv = document.getElementById('statusResult');
            resultDiv.innerHTML = '<div class="test-result info">⏳ Checking payment status...</div>';

            try {
                const response = await fetch(`/Event-yetu/backend/api/payments/payment_status.php?paymentId=${paymentId}`);
                const data = await response.json();

                if (data.success) {
                    const payment = data.payment;
                    const statusClass = payment.status === 'Completed' ? 'success' :
                        payment.status === 'Failed' ? 'error' :
                        payment.status === 'Cancelled' ? 'warning' : 'info';

                    resultDiv.innerHTML = `
                        <div class="test-result ${statusClass}">
                            Payment ID: ${payment.id}
                            Status: ${payment.status}
                            Amount: KES ${payment.amount}
                            Phone: ${payment.phone}
                            ${payment.mpesaReceipt ? `M-Pesa Receipt: ${payment.mpesaReceipt}` : ''}
                            ${payment.resultDesc ? `Result: ${payment.resultDesc}` : ''}
                            Created: ${payment.createdAt}
                            Updated: ${payment.updatedAt}
                        </div>
                    `;
                } else {
                    resultDiv.innerHTML = `
                        <div class="test-result error">
                            ❌ ${data.error}
                        </div>
                    `;
                }
            } catch (error) {
                resultDiv.innerHTML = `
                    <div class="test-result error">
                        ❌ Request failed: ${error.message}
                    </div>
                `;
            }
        }
    </script>
</body>

</html>