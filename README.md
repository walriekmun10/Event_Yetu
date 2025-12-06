# Event Yetu

A comprehensive Event Management System with modern React frontend and PHP REST API backend, featuring M-Pesa payment integration, AI-powered recommendations, and role-based access control.

## Overview

Event Yetu is a full-stack event services booking platform designed for Kenya's event industry. The system connects service providers (caterers, photographers, DJ services, etc.) with clients looking to book event services, with full admin oversight and M-Pesa payment integration.

## Tech Stack

**Frontend:**
- React 18 + Vite
- Tailwind CSS
- React Router v6
- Axios for API calls
- JWT authentication

**Backend:**
- PHP 8.0 + Apache
- MySQL with prefixed column naming (table_column format)
- RESTful API architecture
- JWT token-based authentication
- FPDF for PDF report generation

**Integrations:**
- M-Pesa Daraja API (STK Push)
- AI-powered service recommendations
- Image upload system (5MB limit, PNG/JPEG/GIF/WEBP)

## Features

### Role-Based System
- **Admin**: Manage all services, users, bookings; view analytics; generate reports
- **Provider**: Create/manage services, handle bookings, view earnings
- **Client**: Browse services, make bookings, track booking history, make payments

### Core Functionality
- ✅ Complete CRUD operations for services and bookings
- ✅ Image upload with validation and unique filename generation
- ✅ M-Pesa STK Push payment integration (sandbox + production ready)
- ✅ AI-powered service recommendations based on user history
- ✅ Admin dashboard with analytics and detailed reports
- ✅ Cross-role data visibility (providers see admin services, etc.)
- ✅ Real-time booking status updates
- ✅ PDF report generation for bookings

### Security Features
- JWT token authentication with expiration checking
- Password hashing (bcrypt)
- SQL injection prevention (prepared statements)
- File upload validation (type, size)
- Role-based authorization on all endpoints
- CORS enabled for frontend-backend communication

## Installation

### Prerequisites
- XAMPP (Apache + MySQL + PHP 8.0+)
- Node.js 16+ and npm
- Git

### Backend Setup
1. Clone repository to XAMPP htdocs:
   ```bash
   cd /Applications/XAMPP/xamppfiles/htdocs/
   git clone https://github.com/walriekmun10/Event_Yetu.git Event-yetu
   cd Event-yetu
   ```

2. Import database:
   ```bash
   # Start XAMPP services (Apache + MySQL)
   mysql -u root < db.sql
   ```

3. Configure M-Pesa credentials in `backend/config/mpesa.php`:
   - Add your consumer key, consumer secret, and passkey
   - Set callback URL (use ngrok for local testing)
   - Toggle `MPESA_TEST_MODE` for sandbox/production

4. Verify backend configuration:
   - Database: `backend/config/db.php`
   - JWT secret: `backend/config/jwt.php`

### Frontend Setup
1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Configure API endpoint in `frontend/src/` (if needed):
   - Base URL: `http://localhost/Event-yetu/backend/api/`

3. Start development server:
   ```bash
   npm run dev
   ```
   - Frontend: http://localhost:5173
   - Backend: http://localhost/Event-yetu/

### Test Users
```
Admin:    admin1@gmail.com / password123
Provider: provider1@gmail.com / password123
Client:   client1@gmail.com / password123
```

## API Endpoints

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/auth.php` | POST | Login, register, get user profile |
| `/api/services.php` | GET, POST, PUT, DELETE | Service CRUD operations |
| `/api/bookings.php` | GET, POST, PUT, DELETE | Booking management |
| `/api/upload.php` | POST | Image upload for services |
| `/api/reports.php` | GET | Admin analytics and reports |
| `/api/ai.php` | GET | AI service recommendations |
| `/api/payments/mpesa_stk_push.php` | POST | Initiate M-Pesa payment |
| `/api/payments/payments.php` | GET | Payment history |

## Challenges Faced

1. **Database Migration**: Migrated from unprefixed to prefixed column naming (table_column format) requiring column mapping across all API endpoints
2. **M-Pesa Integration**: Sandbox credential issues required enabling test mode with simulated responses
3. **Cross-Role Permissions**: Complex authorization logic to allow providers to manage bookings for admin-created services
4. **Token Authentication**: Inconsistent token handling between Authorization header and query string across endpoints
5. **Frontend-Backend Sync**: Column name mismatches between database and frontend expectations (date, price, image_url fields)

## Future Improvements

1. **Real-time Features**: WebSocket integration for live booking notifications
2. **Enhanced Security**: Implement CSRF tokens, rate limiting, and 2FA
3. **Advanced Analytics**: Predictive booking trends, seasonal demand analysis
4. **Mobile App**: React Native version for iOS and Android
5. **Multi-currency Support**: Beyond KES for international events
6. **Service Categories**: Expandable taxonomy with custom fields per category
7. **Review System**: Client ratings and reviews for service providers
8. **Automated Reminders**: Email/SMS notifications for upcoming bookings
9. **Dispute Resolution**: Built-in mediation system for booking conflicts
10. **API Versioning**: Support for backward compatibility as platform evolves

## Testing

Comprehensive test suite validates all functionality:
- ✅ 18/18 tests passing (100% pass rate)
- See `TEST_REPORT.md` for detailed test results
- Run tests: `bash /tmp/final_test_report.sh`

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is open source and available for educational purposes.

## Contact

Repository: https://github.com/walriekmun10/Event_Yetu
