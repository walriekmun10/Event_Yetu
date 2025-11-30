# M-Pesa Integration - Quick Start

## 🚀 5-Minute Setup

### 1. Get Sandbox Credentials

Visit: https://developer.safaricom.co.ke/

- Login/Register
- Create a new app
- Note down:
  - Consumer Key
  - Consumer Secret
  - Passkey

### 2. Update Config

Edit `backend/config/mpesa.php`:

```php
define('MPESA_CONSUMER_KEY', 'PASTE_YOUR_KEY_HERE');
define('MPESA_CONSUMER_SECRET', 'PASTE_YOUR_SECRET_HERE');
define('MPESA_PASSKEY', 'PASTE_YOUR_PASSKEY_HERE');
```

### 3. Setup Callback (Local Testing)

```bash
# Install ngrok: https://ngrok.com/download
ngrok http 80
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`) and update in `backend/config/mpesa.php`:

```php
define('MPESA_CALLBACK_URL', 'https://abc123.ngrok.io/Event-yetu/backend/api/payments/mpesa_callback.php');
```

### 4. Test Payment

```bash
curl -X POST http://localhost/Event-yetu/backend/api/payments/mpesa_stk_push.php \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "254708374149",
    "amount": 10,
    "bookingId": 1,
    "description": "Test Payment"
  }'
```

**Sandbox Test Numbers:**

- 254708374149
- 254708374150
- Default PIN: 1234

### 5. Check Status

```bash
curl http://localhost/Event-yetu/backend/api/payments/payment_status.php?paymentId=1
```

## 📱 Frontend Integration

```javascript
const handleMpesaPayment = async (bookingId, amount, phone) => {
  try {
    const res = await axios.post(
      "http://localhost/Event-yetu/backend/api/payments/mpesa_stk_push.php",
      { phoneNumber: phone, amount, bookingId }
    );

    if (res.data.success) {
      alert("Check your phone for M-Pesa prompt");
      // Poll payment status
      pollPaymentStatus(res.data.paymentId);
    }
  } catch (err) {
    alert("Payment failed: " + err.response?.data?.error);
  }
};

const pollPaymentStatus = (paymentId) => {
  const interval = setInterval(async () => {
    const res = await axios.get(
      `http://localhost/Event-yetu/backend/api/payments/payment_status.php?paymentId=${paymentId}`
    );

    if (res.data.payment.status === "Completed") {
      clearInterval(interval);
      alert("Payment successful!");
    } else if (res.data.payment.status === "Failed") {
      clearInterval(interval);
      alert("Payment failed");
    }
  }, 3000);

  setTimeout(() => clearInterval(interval), 120000); // Stop after 2 min
};
```

## ✅ Done!

Your M-Pesa integration is ready. Check `MPESA_SETUP.md` for detailed documentation.
