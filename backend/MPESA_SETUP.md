# M-Pesa Payment Integration - Setup Guide

## 📋 Overview

Complete M-Pesa STK Push integration for Event Yetu Event Management System.

## 🔧 Files Created

### Configuration

- `backend/config/mpesa.php` - M-Pesa credentials and API URLs
- `backend/helpers/mpesa_helpers.php` - Reusable helper functions

### API Endpoints

- `backend/api/payments/mpesa_stk_push.php` - Initiate STK Push
- `backend/api/payments/mpesa_callback.php` - Receive M-Pesa callbacks
- `backend/api/payments/payment_status.php` - Check payment status
- `backend/api/payments/payments.php` - List all payments (role-based)

### Database

- `payments` table created with complete schema

## 🚀 Setup Instructions

### 1. Get M-Pesa Credentials (Sandbox)

1. Go to https://developer.safaricom.co.ke/
2. Sign up/Login
3. Create a new app
4. Get your credentials:
   - Consumer Key
   - Consumer Secret
   - Passkey (for Lipa Na M-Pesa Online)

### 2. Configure Credentials

Edit `backend/config/mpesa.php`:

```php
define('MPESA_CONSUMER_KEY', 'your_consumer_key_here');
define('MPESA_CONSUMER_SECRET', 'your_consumer_secret_here');
define('MPESA_SHORTCODE', '174379'); // Sandbox shortcode
define('MPESA_PASSKEY', 'your_passkey_here');
```

### 3. Setup Callback URL

**For Local Testing:**
Use a tunneling service like ngrok:

```bash
ngrok http 80
```

This gives you a public HTTPS URL like: `https://abc123.ngrok.io`

Update callback URL in `backend/config/mpesa.php`:

```php
define('MPESA_CALLBACK_URL', 'https://abc123.ngrok.io/Event-yetu/backend/api/payments/mpesa_callback.php');
```

**For Production:**
Use your actual domain with HTTPS:

```php
define('MPESA_CALLBACK_URL', 'https://yourdomain.com/Event-yetu/backend/api/payments/mpesa_callback.php');
```

### 4. Database Setup

The `payments` table has already been created. Verify with:

```sql
DESCRIBE payments;
```

## 📱 Testing with Sandbox

### Test Credentials (Safaricom Sandbox)

**Test Phone Numbers:**

- 254708374149
- 254708374150
- 254708374151

**Test Amount:** Any amount (e.g., 1, 10, 100)

**PIN for Sandbox:** `1234` (default test PIN)

### Test Flow

1. **Initiate Payment:**

```bash
curl -X POST http://localhost/Event-yetu/backend/api/payments/mpesa_stk_push.php \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "254708374149",
    "amount": 1000,
    "bookingId": 1,
    "accountReference": "Event123",
    "description": "DJ Services Payment"
  }'
```

2. **Expected Response:**

```json
{
  "success": true,
  "message": "STK Push sent successfully",
  "merchantRequestId": "29115-34620561-1",
  "checkoutRequestId": "ws_CO_191220191020363925",
  "responseCode": "0",
  "responseDescription": "Success. Request accepted for processing",
  "customerMessage": "Success. Request accepted for processing",
  "paymentId": 1
}
```

3. **Check Payment Status:**

```bash
curl http://localhost/Event-yetu/backend/api/payments/payment_status.php?paymentId=1
```

4. **M-Pesa Callback** (automatic):
   - In sandbox, callback is simulated
   - In production, real callback from M-Pesa servers
   - Updates payment status to 'Completed' or 'Failed'

## 🎨 Frontend Integration Example

```javascript
// React component example
import axios from "axios";

const PaymentButton = ({ bookingId, amount, phoneNumber }) => {
  const handlePayment = async () => {
    try {
      const response = await axios.post(
        "http://localhost/Event-yetu/backend/api/payments/mpesa_stk_push.php",
        {
          phoneNumber: phoneNumber,
          amount: amount,
          bookingId: bookingId,
          accountReference: `Booking${bookingId}`,
          description: "Event Service Payment",
        }
      );

      if (response.data.success) {
        alert("Please check your phone and enter M-Pesa PIN");

        // Poll for payment status
        const paymentId = response.data.paymentId;
        const checkStatus = setInterval(async () => {
          const statusRes = await axios.get(
            `http://localhost/Event-yetu/backend/api/payments/payment_status.php?paymentId=${paymentId}`
          );

          const status = statusRes.data.payment.status;

          if (status === "Completed") {
            clearInterval(checkStatus);
            alert("Payment successful!");
            // Refresh booking details
          } else if (status === "Failed" || status === "Cancelled") {
            clearInterval(checkStatus);
            alert("Payment failed: " + statusRes.data.payment.resultDesc);
          }
        }, 3000); // Check every 3 seconds

        // Stop checking after 2 minutes
        setTimeout(() => clearInterval(checkStatus), 120000);
      }
    } catch (error) {
      alert("Payment initiation failed: " + error.response?.data?.error);
    }
  };

  return (
    <button onClick={handlePayment} className="btn-primary">
      Pay Ksh {amount} with M-Pesa
    </button>
  );
};
```

## 🔒 Security Best Practices

1. **Environment Variables:**

   - Never commit credentials to Git
   - Use `.env` file in production
   - Use environment variables: `$_ENV['MPESA_CONSUMER_KEY']`

2. **HTTPS Only:**

   - M-Pesa requires HTTPS for callbacks
   - Use SSL certificates in production

3. **Validate Callbacks:**

   - Verify callback source (IP whitelisting)
   - Validate callback signature

4. **Input Validation:**

   - All inputs are sanitized
   - Phone numbers validated
   - Amount range checked

5. **Database Security:**
   - Use prepared statements (already implemented)
   - Encrypt sensitive data

## 📊 Payment Statuses

- `Pending` - Payment initiated, waiting for user
- `Completed` - Payment successful
- `Failed` - Payment failed
- `Cancelled` - User cancelled payment

## 🐛 Debugging

Check logs in `backend/logs/mpesa_YYYY-MM-DD.log`:

```bash
tail -f backend/logs/mpesa_2025-11-12.log
```

Logs include:

- STK Push requests
- STK Push responses
- Callback data
- Errors

## 📞 M-Pesa Result Codes

Common result codes:

- `0` - Success
- `1032` - User cancelled transaction
- `1037` - Timeout (user didn't enter PIN)
- `2001` - Wrong PIN
- `1` - Insufficient balance

## 🌐 Production Deployment

1. Update `MPESA_ENV` to `'production'`
2. Use production credentials
3. Enable SSL verification:
   ```php
   CURLOPT_SSL_VERIFYPEER => true,
   CURLOPT_SSL_VERIFYHOST => 2
   ```
4. Update callback URL to production domain
5. Test with small amounts first

## 📚 API Documentation

### POST /api/payments/mpesa_stk_push.php

Initiate M-Pesa payment

**Request:**

```json
{
  "phoneNumber": "254712345678",
  "amount": 1000,
  "bookingId": 1,
  "accountReference": "Event123",
  "description": "Service Payment"
}
```

### GET /api/payments/payment_status.php

Check payment status

**Query Parameters:**

- `paymentId` - Payment ID
- `bookingId` - Booking ID
- `checkoutRequestId` - M-Pesa Checkout Request ID

### GET /api/payments/payments.php

List all payments (requires JWT token)

**Query Parameters:**

- `token` - JWT authentication token

## ✅ Testing Checklist

- [ ] M-Pesa credentials configured
- [ ] Database table created
- [ ] ngrok/tunnel running for callbacks
- [ ] Test STK Push with sandbox number
- [ ] Verify callback updates database
- [ ] Check payment status endpoint
- [ ] Test error scenarios
- [ ] Review logs for issues

## 🆘 Support

For M-Pesa API issues:

- Safaricom Daraja Support: https://developer.safaricom.co.ke/support
- API Documentation: https://developer.safaricom.co.ke/Documentation

---

**Ready to use!** The M-Pesa integration is production-ready and follows best practices.
