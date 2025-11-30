# Event Yetu

A simple Event Management System built with PHP, MySQL, JavaScript, HTML, and Bootstrap. Designed to run on XAMPP (htdocs).

Features:

- Roles: Admin, Service Provider, Client
- Provider: CRUD services with image uploads
- Client: Browse, view, book services
- Admin: Approve services, manage users, view bookings, generate PDF reports (FPDF)
- Security: password_hash, prepared statements, upload validation

Setup (macOS, XAMPP):

1. Copy project folder into your XAMPP htdocs, e.g. `/Applications/XAMPP/xamppfiles/htdocs/Event-yetu`.
2. Start Apache and MySQL via XAMPP.
3. Import the database:
   - Open phpMyAdmin (http://localhost/phpmyadmin), create database `event_yetu` or import `db.sql` included.
   - Or run: mysql -u root < /Applications/XAMPP/xamppfiles/htdocs/Event-yetu/db.sql
4. Edit `config.php` if your DB credentials differ.
5. (Optional) Download FPDF from http://www.fpdf.org/ and place `fpdf.php` into `/vendor/` to enable PDF report generation.
6. Visit http://localhost/Event-yetu/ in your browser.

Notes:

- When a provider creates a service it's saved as `pending`. Admin must approve for it to appear publicly.
- To create an admin: register a user, then update the `users` table (role -> 'admin') via phpMyAdmin.

Security and next steps:

- Consider adding CSRF tokens, stronger file type checks and image resizing.
- Add pagination and richer analytics if needed.
