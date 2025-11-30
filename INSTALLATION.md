# Event Yetu - Installation Guide

## 📋 System Requirements

### Required Software

- **XAMPP** (includes Apache, MySQL, PHP 7.4+)
  - Download: https://www.apachefriends.org/
- **Node.js** (v16 or higher) and npm
  - Download: https://nodejs.org/
- **Composer** (PHP package manager)
  - Download: https://getcomposer.org/

### Optional (for M-Pesa)

- **ngrok** (for testing M-Pesa callbacks locally)
  - Download: https://ngrok.com/download

---

## 🚀 Quick Installation

### Option 1: Automatic Installation (Recommended)

Run the installation script:

```bash
cd /Applications/XAMPP/xamppfiles/htdocs/Event-yetu
./install.sh
```

The script will:

- ✅ Check prerequisites
- ✅ Install frontend dependencies (npm)
- ✅ Install backend dependencies (Composer)
- ✅ Create required directories
- ✅ Verify installation

---

### Option 2: Manual Installation

#### Step 1: Install Frontend Dependencies

```bash
cd /Applications/XAMPP/xamppfiles/htdocs/Event-yetu/frontend
npm install
```

**Packages installed:**

- react (18.2.0)
- react-dom (18.2.0)
- react-router-dom (6.16.0)
- axios (1.5.0)
- react-hot-toast (2.4.1)
- chart.js (4.4.0)
- react-chartjs-2 (5.2.0)
- jwt-decode (3.1.2)
- vite (7.2.2)
- tailwindcss (3.4.0)
- @vitejs/plugin-react (4.0.4)

#### Step 2: Install Backend Dependencies

```bash
cd /Applications/XAMPP/xamppfiles/htdocs/Event-yetu/backend

# Install Composer (if not installed)
# Visit: https://getcomposer.org/download/

# Install PHP dependencies
composer install
```

**Packages installed:**

- setasign/fpdf (1.8) - For PDF generation

#### Step 3: Setup Database

```bash
# Start XAMPP MySQL
# Then run:

cd /Applications/XAMPP/xamppfiles/htdocs/Event-yetu
mysql -u root < backend/db.sql
```

Or use phpMyAdmin:

1. Open http://localhost/phpmyadmin
2. Create database `event_yetu`
3. Import `backend/db.sql`

#### Step 4: Create Required Directories

```bash
cd /Applications/XAMPP/xamppfiles/htdocs/Event-yetu/backend

# Create uploads directory
mkdir -p uploads
chmod 755 uploads

# Create logs directory
mkdir -p logs
chmod 755 logs
```

---

## 🔧 Configuration

### 1. Database Configuration

Edit `backend/config/db.php` if needed (default settings):

```php
$host = 'localhost';
$dbname = 'event_yetu';
$username = 'root';
$password = '';
```

### 2. M-Pesa Configuration (Optional)

Edit `backend/config/mpesa.php`:

```php
define('MPESA_CONSUMER_KEY', 'your_key_here');
define('MPESA_CONSUMER_SECRET', 'your_secret_here');
define('MPESA_PASSKEY', 'your_passkey_here');
```

Get credentials from: https://developer.safaricom.co.ke/

---

## ▶️ Running the Application

### Start Backend (XAMPP)

1. Open XAMPP Control Panel
2. Start **Apache** and **MySQL**
3. Backend API will be available at:
   ```
   http://localhost/Event-yetu/backend/api/
   ```

### Start Frontend (Development Server)

```bash
cd /Applications/XAMPP/xamppfiles/htdocs/Event-yetu/frontend
npm run dev
```

Frontend will be available at:

```
http://localhost:5173
```

---

## 🧪 Testing Installation

### Test Backend API

```bash
# Test database connection
curl http://localhost/Event-yetu/backend/api/test-db.php

# Test authentication
curl -X POST http://localhost/Event-yetu/backend/api/auth.php?action=login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}'
```

### Test Frontend

1. Open http://localhost:5173
2. Login with:
   - **Admin:** admin@example.com / Admin123!
   - **Provider:** john@provider.com / Provider123!
   - **Client:** jane@client.com / Client123!

### Test M-Pesa (if configured)

```bash
# Open test page
open http://localhost/Event-yetu/backend/tests/test_mpesa.php
```

---

## 📦 Package Details

### Frontend Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.16.0",
    "axios": "^1.5.0",
    "react-hot-toast": "^2.4.1",
    "chart.js": "^4.4.0",
    "react-chartjs-2": "^5.2.0",
    "jwt-decode": "^3.1.2"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.4",
    "vite": "^7.2.2",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.31"
  }
}
```

### Backend Dependencies

```json
{
  "require": {
    "php": ">=7.4",
    "setasign/fpdf": "^1.8"
  }
}
```

---

## 🔍 Verifying Installation

Run these checks:

```bash
# Check frontend packages
cd frontend && npm list --depth=0

# Check backend packages
cd backend && composer show

# Check database
mysql -u root -e "USE event_yetu; SHOW TABLES;"

# Check directories
ls -la backend/uploads
ls -la backend/logs
```

Expected output:

- ✅ Frontend: ~250 packages installed
- ✅ Backend: fpdf package installed
- ✅ Database: 5 tables (users, services, bookings, payments, categories)
- ✅ Directories: uploads/ and logs/ exist with proper permissions

---

## 🐛 Troubleshooting

### Frontend Issues

**Problem:** `npm install` fails

```bash
# Clear npm cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Problem:** Port 5173 already in use

```bash
# Change port in package.json
"dev": "vite --port 5174"
```

### Backend Issues

**Problem:** Composer not found

```bash
# Install Composer
php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
php composer-setup.php
php -r "unlink('composer-setup.php');"
sudo mv composer.phar /usr/local/bin/composer
```

**Problem:** Database connection failed

- Check XAMPP MySQL is running
- Verify credentials in `backend/config/db.php`
- Check MySQL port (default: 3306)

**Problem:** File upload errors

```bash
# Fix permissions
chmod 755 backend/uploads
chown -R _www backend/uploads  # macOS
```

### M-Pesa Issues

**Problem:** Access token error

- Verify credentials in `mpesa.php`
- Check internet connection
- Ensure using sandbox credentials

**Problem:** Callback not received

- Use ngrok for local testing
- Verify callback URL matches ngrok URL
- Check firewall settings

---

## 📚 Additional Resources

- **Project README:** `/README.md`
- **M-Pesa Setup:** `/backend/MPESA_SETUP.md`
- **M-Pesa Quick Start:** `/backend/MPESA_QUICKSTART.md`
- **Database Schema:** `/backend/db.sql`
- **API Endpoints:** Check `/backend/api/` directory

---

## ✅ Installation Checklist

- [ ] XAMPP installed and running
- [ ] Node.js and npm installed
- [ ] Composer installed
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Backend dependencies installed (`composer install`)
- [ ] Database created and imported
- [ ] Uploads directory created with proper permissions
- [ ] Logs directory created
- [ ] Apache running on port 80
- [ ] MySQL running on port 3306
- [ ] Frontend dev server running on port 5173
- [ ] Can login to admin dashboard
- [ ] M-Pesa credentials configured (if using payments)

---

## 🆘 Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Review log files in `backend/logs/`
3. Check browser console for frontend errors
4. Verify all services are running in XAMPP
5. Ensure all dependencies are installed

---

**Installation complete!** 🎉

Your Event Management System is ready to use.
