# M-Pesa Test Mode Guide

## Overview

Test Mode allows you to develop and test the payment system locally without requiring M-Pesa API connectivity, ngrok tunnels, or internet access.

## How It Works

When `MPESA_TEST_MODE` is enabled:
1. **No M-Pesa API calls** are made
2. **Payments are simulated** instantly in the database
3. **Test receipts** are generated (e.g., `TEST1A2B3C4D5E`)
4. **Bookings are confirmed** automatically
5. **Payment history** shows test transactions

## Configuration

### Enable Test Mode (Default for Development)

**File:** `/backend/config/mpesa.php`

```php
// Enable test mode for local development (no M-Pesa API calls)
define('MPESA_TEST_MODE', true);
```

### Disable Test Mode (Production)

```php
// Disable for production to use real M-Pesa
define('MPESA_TEST_MODE', false);
```

## Testing Workflow

### 1. Login as Test Client
- Email: `client@test.com`
- Password: `password123`

### 2. Create a Booking
- Browse "Services" tab
- Click on any service
- Create a booking (will be "pending" initially)

### 3. Make Test Payment
- Go to "My Bookings" tab
- Find a confirmed booking
- Click "Pay Now"
- Enter any phone number (e.g., `254712345678`)
- Click "Initiate Payment"
- Payment completes instantly!

### 4. Verify Payment
- Check "Payments" tab
- You'll see the test transaction with:
  - Status: "Completed" (green badge)
  - Receipt: `TEST` + random hash
  - Amount: Booking price
  - Phone: Your test number

### 5. Verify Booking Confirmation
- Go back to "My Bookings"
- Booking status is now "confirmed"

## Test Mode vs Production

| Feature | Test Mode | Production |
|---------|-----------|------------|
| M-Pesa API calls | ❌ Skipped | ✅ Real |
| Internet required | ❌ No | ✅ Yes |
| ngrok required | ❌ No | ✅ Yes |
| Phone STK push | ❌ No | ✅ Yes |
| Payment speed | ⚡ Instant | ⏱️ 5-30 seconds |
| Receipt format | `TEST1A2B3C4D5E` | `QGH7K3M9PL` |
| Booking confirmation | ✅ Auto | ✅ Auto |
| Database records | ✅ Created | ✅ Created |

## Simulated Data Format

### Test Receipt Number
```
TEST1A2B3C4D5E
```
- Prefix: `TEST`
- Hash: 10 uppercase alphanumeric characters

### Test Request IDs
```
Merchant Request ID: TEST-67890abcdef
Checkout Request ID: TEST-CO-1234567890
```

### Payment Record
```sql
{
  "status": "Completed",
  "result_code": "0",
  "result_desc": "TEST MODE: Payment simulated successfully",
  "mpesa_receipt": "TEST1A2B3C4D5E",
  "merchant_request_id": "TEST-67890abcdef",
  "checkout_request_id": "TEST-CO-1234567890"
}
```

## API Behavior

### STK Push Endpoint
**File:** `/backend/api/payments/mpesa_stk_push.php`

**Test Mode Response:**
```json
{
  "success": true,
  "message": "TEST MODE: Payment simulated successfully",
  "merchantRequestId": "TEST-67890abcdef",
  "checkoutRequestId": "TEST-CO-1234567890",
  "responseCode": "0",
  "responseDescription": "Test payment accepted",
  "customerMessage": "Payment simulated in TEST MODE",
  "paymentId": 42,
  "testMode": true
}
```

### Payment Status Endpoint
**File:** `/backend/api/payments/payment_status.php`

**Test Mode Behavior:**
- Returns test payment immediately (no M-Pesa query)
- Status is always "Completed" for test payments
- No polling required

## Debugging

### Check Test Mode Status
```bash
# View test mode setting
cat /Applications/XAMPP/xamppfiles/htdocs/Event-yetu/backend/config/mpesa.php | grep MPESA_TEST_MODE
```

### View Test Payment Logs
```bash
# Check logs for test mode operations
tail -f /Applications/XAMPP/xamppfiles/htdocs/Event-yetu/backend/logs/*.log
```

Look for entries with:
```
"TEST_MODE": {
  "message": "Simulated payment completed",
  "payment_id": 42,
  "mpesa_receipt": "TEST1A2B3C4D5E"
}
```

### Common Issues

**Issue:** Payment shows "Failed" or "Invalid Access Token"
**Solution:** Verify `MPESA_TEST_MODE = true` in `/backend/config/mpesa.php`

**Issue:** Can't find test payments in history
**Solution:** Check you're logged in as the same user who created the booking

**Issue:** Booking not confirmed after payment
**Solution:** Check browser console for errors; verify payment status endpoint is working

## Production Deployment Checklist

Before deploying to production:

1. ✅ Set `MPESA_TEST_MODE = false`
2. ✅ Configure production M-Pesa credentials
3. ✅ Set up ngrok or public HTTPS callback URL
4. ✅ Update callback URL in M-Pesa config
5. ✅ Test with real M-Pesa sandbox account
6. ✅ Verify callbacks are received
7. ✅ Remove test payment records from database

## Advantages of Test Mode

✅ **No external dependencies** - Work offline  
✅ **Instant feedback** - No waiting for M-Pesa  
✅ **Consistent testing** - Same results every time  
✅ **Full UI testing** - Test all payment flows  
✅ **Safe development** - No risk of real charges  
✅ **Easy debugging** - Controlled environment

## Security Note

⚠️ **Never deploy with `MPESA_TEST_MODE = true` in production!**

Test mode bypasses all M-Pesa validation and creates fake payment records. This is only for local development.
