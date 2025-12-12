# M-Pesa Sandbox STK Push - Complete Guide

## 🎯 Current Status

Your system is currently in **TEST MODE** which simulates M-Pesa payments without calling the actual API. This is perfect for development without needing ngrok or real credentials.

## 🔧 Two Ways to Use M-Pesa

### Option 1: TEST MODE (Current - Easiest) ✅

**Perfect for:**
- Local development
- Testing without internet
- No need for ngrok
- No real M-Pesa credentials needed

**How it works:**
```php
// In backend/config/mpesa.php
define('MPESA_TEST_MODE', true); // Currently enabled
```

When enabled, payments are simulated instantly:
- Creates payment record in database
- Updates booking to "confirmed"
- Returns fake M-Pesa receipt number
- No phone prompt needed

**Test it:**
```bash
curl -X POST http://localhost/Event-yetu/backend/api/payments/mpesa_stk_push.php \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "254712345678",
    "amount": 1000,
    "bookingId": 1
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "TEST MODE: Payment simulated successfully",
  "testMode": true,
  "paymentId": 1,
  "mpesaReceipt": "TEST1A2B3C4D5E"
}
```

---

### Option 2: Real Sandbox Mode (Actual M-Pesa API)

**Perfect for:**
- Testing real STK Push flow
- Simulating production behavior
- Testing callback webhooks

#### Step 1: Get Sandbox Credentials

1. Visit https://developer.safaricom.co.ke/
2. Create account and login
3. Click "My Apps" → "Create New App"
4. Select "Lipa Na M-Pesa Sandbox"
5. Copy these credentials:
   - **Consumer Key**: (looks like: `ihauZiiBcGw9v3psXzneygkAqOWoULPg...`)
   - **Consumer Secret**: (looks like: `B3LZmnTLsAAHZUIDGxOs...`)
   - **Test Credentials** → Copy **Passkey**

#### Step 2: Update Configuration

Edit `backend/config/mpesa.php`:

```php
// DISABLE TEST MODE
define('MPESA_TEST_MODE', false); // Change to false

// ADD YOUR CREDENTIALS
define('MPESA_CONSUMER_KEY', 'paste_your_consumer_key');
define('MPESA_CONSUMER_SECRET', 'paste_your_consumer_secret');
define('MPESA_PASSKEY', 'paste_your_passkey');

// Sandbox shortcode (keep as is)
define('MPESA_SHORTCODE', '174379');
```

#### Step 3: Setup Public Callback URL (ngrok)

M-Pesa needs a public HTTPS URL to send payment results.

**Install ngrok:**
```bash
# Download from https://ngrok.com/download
# Or use Homebrew:
brew install ngrok

# Authenticate (sign up for free account first)
ngrok config add-authtoken YOUR_NGROK_TOKEN
```

**Start ngrok tunnel:**
```bash
cd /Applications/XAMPP/xamppfiles/htdocs/Event-yetu
ngrok http 80
```

**Copy the HTTPS URL:**
```
Forwarding: https://abc123.ngrok-free.app -> http://localhost:80
            ^^^^^^^^^^^^^^^^^^^^^^^^^^^ Copy this
```

**Update callback URL:**
```php
// In backend/config/mpesa.php
define('MPESA_CALLBACK_URL', 'https://abc123.ngrok-free.app/Event-yetu/backend/api/payments/mpesa_callback.php');
```

#### Step 4: Test Real STK Push

**Initiate payment:**
```bash
curl -X POST http://localhost/Event-yetu/backend/api/payments/mpesa_stk_push.php \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "254708374149",
    "amount": 10,
    "bookingId": 1
  }'
```

**Sandbox Test Phone Numbers:**
- `254708374149`
- `254708374150`
- `254708374151`

**Default PIN:** `1234`

**Expected Flow:**
1. API sends STK Push request to M-Pesa
2. You receive M-Pesa prompt on phone (in sandbox, it's simulated)
3. Enter PIN `1234`
4. M-Pesa sends result to your callback URL
5. Payment status updates in database
6. Booking status changes to "confirmed"

#### Step 5: Monitor Callbacks

Watch the callback log:
```bash
tail -f backend/logs/mpesa_callback_*.log
```

---

## 🧪 Testing Comparison

| Feature | TEST MODE | SANDBOX MODE |
|---------|-----------|--------------|
| Requires credentials | ❌ No | ✅ Yes |
| Requires ngrok | ❌ No | ✅ Yes |
| Internet needed | ❌ No | ✅ Yes |
| STK Push prompt | ❌ No | ✅ Yes (simulated) |
| Response time | ⚡ Instant | ⏱️ 5-30 seconds |
| Tests callback flow | ❌ No | ✅ Yes |
| Good for | Quick dev | Pre-production |

---

## 📱 Frontend Integration

### React Component Example

```javascript
import { useState } from 'react';
import axios from 'axios';

const PaymentButton = ({ booking }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handlePayment = async () => {
    setLoading(true);
    setMessage('Processing...');

    try {
      const response = await axios.post(
        'http://localhost/Event-yetu/backend/api/payments/mpesa_stk_push.php',
        {
          phoneNumber: '254712345678', // Get from user input
          amount: booking.price,
          bookingId: booking.id,
          description: booking.service_name
        }
      );

      if (response.data.success) {
        const { testMode, paymentId } = response.data;
        
        if (testMode) {
          // Test mode - payment instant
          setMessage('✅ Payment completed (Test Mode)');
        } else {
          // Real mode - wait for callback
          setMessage('📱 Check your phone for M-Pesa prompt...');
          pollPaymentStatus(paymentId);
        }
      }
    } catch (error) {
      setMessage('❌ Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const pollPaymentStatus = (paymentId) => {
    let attempts = 0;
    const maxAttempts = 40; // 2 minutes (40 * 3 seconds)

    const interval = setInterval(async () => {
      attempts++;

      try {
        const res = await axios.get(
          `http://localhost/Event-yetu/backend/api/payments/payment_status.php?paymentId=${paymentId}`
        );

        const status = res.data.payment?.status;

        if (status === 'Completed') {
          clearInterval(interval);
          setMessage('✅ Payment successful!');
        } else if (status === 'Failed') {
          clearInterval(interval);
          setMessage('❌ Payment failed');
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          setMessage('⏱️ Payment timeout - check status later');
        } else {
          setMessage(`⏳ Waiting for payment confirmation... (${attempts}/${maxAttempts})`);
        }
      } catch (error) {
        console.error('Status check failed:', error);
      }
    }, 3000); // Check every 3 seconds
  };

  return (
    <div>
      <button 
        onClick={handlePayment} 
        disabled={loading}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        {loading ? 'Processing...' : 'Pay with M-Pesa'}
      </button>
      {message && <p className="mt-2">{message}</p>}
    </div>
  );
};

export default PaymentButton;
```

---

## 🐛 Troubleshooting

### Common Issues

**1. "Failed to authenticate with M-Pesa"**
- Check consumer key and secret are correct
- Verify you're using sandbox credentials for sandbox environment
- Check internet connection

**2. "Callback URL not reachable"**
- Ensure ngrok is running
- Verify callback URL in config matches ngrok URL exactly
- Check firewall settings

**3. "Invalid phone number"**
- Must start with 254 (Kenya country code)
- Format: `254712345678` (12 digits)
- Remove spaces, dashes, or plus sign

**4. Payment stuck in "Pending"**
- Check callback logs: `backend/logs/mpesa_callback_*.log`
- Verify ngrok is running and public
- Check M-Pesa API status: https://developer.safaricom.co.ke/status

**5. Test mode not working**
- Verify `MPESA_TEST_MODE = true` in config
- Clear any cached config files
- Check database for payment record

---

## 🚀 Moving to Production

When ready for production:

1. **Get Production Credentials:**
   - Apply for Daraja production access
   - Get production consumer key, secret, shortcode
   - Use real till/paybill number

2. **Update Config:**
   ```php
   define('MPESA_TEST_MODE', false);
   define('MPESA_ENV', 'production');
   define('MPESA_CONSUMER_KEY', 'prod_key');
   define('MPESA_CONSUMER_SECRET', 'prod_secret');
   define('MPESA_SHORTCODE', 'your_paybill');
   define('MPESA_PASSKEY', 'prod_passkey');
   ```

3. **Setup Production Callback:**
   ```php
   define('MPESA_CALLBACK_URL', 'https://yourdomain.com/backend/api/payments/mpesa_callback.php');
   ```

4. **Enable SSL:**
   - Install SSL certificate (Let's Encrypt recommended)
   - Ensure entire site is HTTPS
   - M-Pesa requires HTTPS for callbacks

5. **Test thoroughly:**
   - Use small amounts first (KES 1-10)
   - Verify callbacks are received
   - Check payment reconciliation

---

## 📊 Payment Flow Diagram

```
┌─────────┐       ┌──────────┐       ┌────────────┐       ┌─────────┐
│ Client  │       │ Backend  │       │   M-Pesa   │       │Database │
└────┬────┘       └────┬─────┘       └─────┬──────┘       └────┬────┘
     │                 │                    │                   │
     │ 1. Pay Request  │                    │                   │
     │────────────────>│                    │                   │
     │                 │ 2. STK Push        │                   │
     │                 │───────────────────>│                   │
     │                 │                    │ 3. Phone Prompt   │
     │                 │                    │──────────>📱      │
     │                 │                    │                   │
     │                 │                    │ 4. User Enters PIN│
     │                 │                    │<──────────📱      │
     │                 │ 5. Callback Result │                   │
     │                 │<───────────────────│                   │
     │                 │                    │                   │
     │                 │ 6. Update Status   │                   │
     │                 │────────────────────────────────────────>│
     │ 7. Confirmation │                    │                   │
     │<────────────────│                    │                   │
```

---

## 📝 API Reference

### Initiate Payment
**POST** `/backend/api/payments/mpesa_stk_push.php`

**Request:**
```json
{
  "phoneNumber": "254712345678",
  "amount": 1000,
  "bookingId": 1,
  "accountReference": "Event123",  // Optional
  "description": "Event Services"   // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "STK Push sent successfully",
  "paymentId": 1,
  "merchantRequestId": "29115-34620561-1",
  "checkoutRequestId": "ws_CO_191220191020363925"
}
```

### Check Status
**GET** `/backend/api/payments/payment_status.php?paymentId=1`

**Response:**
```json
{
  "payment": {
    "id": 1,
    "booking_id": 1,
    "amount": 1000,
    "phone": "254712345678",
    "status": "Completed",
    "mpesa_receipt": "PKR3N4M8LQ",
    "transaction_date": "2025-12-12 10:30:00"
  }
}
```

---

## 🔐 Security Notes

- ✅ Never commit real credentials to Git
- ✅ Use environment variables in production
- ✅ Validate all callback requests
- ✅ Log all transactions for audit
- ✅ Implement rate limiting
- ✅ Use HTTPS in production
- ✅ Verify callback IP (production only)

---

**Need Help?** Check the logs in `backend/logs/` for detailed error messages!
