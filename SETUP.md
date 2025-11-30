# Event Yetu - Full-Stack Event Management System

A modern, full-stack Event Management System built with:

- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion, Chart.js
- **Backend**: PHP 8+, MySQL, JWT Authentication
- **Deployment**: XAMPP (localhost)

## Quick Start (5 minutes)

### Prerequisites

- XAMPP installed with Apache and MySQL running
- Node.js 16+ (for frontend dev)
- Composer (optional, for FPDF reports)

### 1. Set up the database

```bash
# Copy the database schema and seed data
mysql -u root < /Applications/XAMPP/xamppfiles/htdocs/Event-yetu/db.sql
```

### 2. Create admin account (CLI)

```bash
/Applications/XAMPP/xamppfiles/bin/php /Applications/XAMPP/xamppfiles/htdocs/Event-yetu/create_admin.php --email=admin@example.com --password=Admin@123 --name='Administrator'
```

### 3. Install frontend dependencies and run Vite dev server

```bash
cd /Applications/XAMPP/xamppfiles/htdocs/Event-yetu/frontend
npm install
npm run dev
```

Vite will start on http://localhost:5173.

### 4. Access the application

- Frontend: http://localhost:5173
- Backend API: http://localhost/Event-yetu/backend/api/\*
- Login with admin@example.com / Admin@123

## Architecture

### Backend (PHP + MySQL)

Located in `backend/`:

- `config/db.php` — PDO database connection
- `config/jwt.php` — Simple JWT authentication (HMAC SHA256)
- `api/auth.php` — Register/login endpoints
- `api/services.php` — Service CRUD (provider + admin)
- `api/bookings.php` — Booking management
- `api/reports.php` — Analytics and PDF generation

### Frontend (React + Vite + Tailwind)

Located in `frontend/`:

- `src/main.jsx` — Entry point
- `src/App.jsx` — Router configuration
- `src/context/AuthContext.jsx` — JWT and user state
- `src/pages/` — Login, Register, Dashboards
- `src/components/` — Reusable UI components (Button, Card, Modal, etc.)

## Key Features

### Admin

- Dashboard with analytics (total users, providers, services, bookings)
- Manage users (promote to admin, delete)
- Approve/reject services
- View all bookings
- Generate PDF reports

### Service Provider

- Register and post services (category, price, description, image)
- View and manage own services (edit, delete)
- View bookings for own services

### Client

- Browse services by category (Speakers, MCs, DJs, Tents, Sound Systems, Lighting Systems)
- Book services and receive confirmation
- View booking history
- Search and filter services

## Security Features

- **JWT Authentication**: Tokens with 1-day expiration
- **Password Hashing**: PHP's `password_hash()` and `password_verify()`
- **Prepared Statements**: All SQL queries use PDO prepared statements to prevent SQL injection
- **Input Validation**: Server-side validation for all inputs
- **CORS**: Configured for local dev (adjust for production)
- **Role-Based Access Control**: Admin, Provider, Client routes protected on frontend + backend

## Customization

### Change JWT Secret

Edit `backend/config/jwt.php` line 7:

```php
$JWT_SECRET = 'your_super_secure_random_string_here';
```

### Change Database Credentials

Edit `backend/config/db.php` lines 2-5:

```php
$DB_HOST = '127.0.0.1';
$DB_NAME = 'event_yetu';
$DB_USER = 'root';
$DB_PASS = '';
```

### Enable PDF Reports

Option A (Composer):

```bash
cd /Applications/XAMPP/xamppfiles/htdocs/Event-yetu/backend
composer install
```

Option B (Manual):

- Download `fpdf.php` from http://www.fpdf.org/
- Place into `backend/vendor/fpdf.php`

## Folder Structure

```
Event-yetu/
├── backend/
│   ├── config/
│   │   ├── db.php
│   │   └── jwt.php
│   ├── api/
│   │   ├── auth.php
│   │   ├── services.php
│   │   ├── bookings.php
│   │   └── reports.php
│   └── vendor/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
├── db.sql (database schema)
├── create_admin.php (admin setup)
└── README.md (this file)
```

## Database Schema

- `users` (id, name, email, password, role, created_at)
- `services` (id, provider_id, category, name, description, price, image, status, created_at)
- `bookings` (id, client_id, service_id, date, status, created_at)
- `categories` (id, name)

## Development & Troubleshooting

### "Module not found: axios"

```bash
cd frontend && npm install
```

### "CORS error"

Ensure `Access-Control-Allow-Origin` is set in `backend/config/db.php`.

### Database connection error

Check `backend/config/db.php` credentials match your MySQL setup.

### Vite not starting

```bash
cd frontend
npm install
npm run dev
```

## Production Notes

- Change `JWT_SECRET` to a strong random value
- Use HTTPS (not http)
- Set appropriate CORS origins (not `*`)
- Enable database backups
- Consider adding rate limiting to API endpoints
- Use environment variables for sensitive config (`.env` files)
- Add CSRF tokens for any server-rendered forms
- Implement image resizing and compression (GD library)

## License

MIT

## Next Steps

1. Customize the UI with your branding
2. Add image upload to services
3. Implement payment integration (if needed)
4. Add email notifications for bookings
5. Add advanced analytics (charts, exports)
6. Deploy to a production server (DigitalOcean, AWS, etc.)
