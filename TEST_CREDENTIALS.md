# Test User Credentials

**ALL PASSWORDS HAVE BEEN SET TO**: `password123`

Use these credentials to test the application:

## Test Accounts (Newly Created)

### Client Account
- **Email**: testclient@test.com
- **Password**: password123
- **Role**: Client

### Provider Account
- **Email**: testprovider@test.com
- **Password**: password123
- **Role**: Service Provider

## Existing Accounts (Passwords Reset)

### Admin Accounts
- **Email**: admin@example.com
- **Password**: password123
- **Role**: Administrator

- **Email**: admin1@gmail.com
- **Password**: password123
- **Role**: Administrator

### Provider Account
- **Email**: provider1@gmail.com
- **Password**: password123
- **Role**: Service Provider

### Client Account
- **Email**: client1@gmail.com
- **Password**: password123
- **Role**: Client

---

## Quick Login Guide

1. Go to http://localhost:5175/login
2. Use any email from above with password: `password123`
3. You'll be redirected based on your role:
   - **Admin** → /admin
   - **Provider** → /provider
   - **Client** → /client

---

## How to Register New Users

1. Go to http://localhost:5175/register
2. Fill in the form:
   - Full Name
   - Email
   - Password (min 6 characters)
   - Role (Client or Provider)
3. Click "Register"

---

## Troubleshooting Login Issues

If you get 401 Unauthorized:
- ✅ Make sure you're using the correct email/password
- ✅ Check that CORS is working (browser console)
- ✅ Verify backend is running (http://localhost/Event-yetu/backend/api/)
- ✅ Test credentials exist in database

**Frontend**: http://localhost:5175/
**Backend API**: http://localhost/Event-yetu/backend/api/
