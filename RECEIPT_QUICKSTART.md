# 🧾 Unified Receipt System - Quick Start

## 🚀 Get Started in 3 Steps

### Step 1: Migrate Database (One-time setup)

```bash
cd /Applications/XAMPP/xamppfiles/htdocs/Event-yetu
./migrate.sh
```

Or manually:
```bash
mysql -u root -p event_yetu < db_enhanced.sql
```

### Step 2: Start Your App

```bash
# Frontend (if not running)
cd frontend
npm run dev
```

Visit: **http://localhost:5175/book-services**

### Step 3: Test Multi-Service Booking

1. **Login** as any user (client, provider, or admin)
2. **Add services** - Click "Add" on multiple services
3. **Set event details** - Date, time, venue
4. **Complete booking** - Click "Complete Booking" button
5. **View receipt** - Download professional PDF

---

## 📸 Screenshots

### Multi-Service Booking Page
```
┌─────────────────────────────────────────────────────────┐
│  🔍 Search: [Wedding DJ______]  [All Categories ▼]     │
├─────────────────────────┬───────────────────────────────┤
│  Available Services     │   Your Cart (3)               │
│  ┌──────────────────┐  │   ┌─────────────────────────┐ │
│  │ 🎧 Wedding DJ    │  │   │ Wedding DJ         ➕➖ │ │
│  │ DJs              │  │   │ Qty: 1     Ksh 50,000   │ │
│  │ Ksh 50,000  [Add]│  │   ├─────────────────────────┤ │
│  └──────────────────┘  │   │ MC Services        ➕➖ │ │
│  ┌──────────────────┐  │   │ Qty: 1     Ksh 35,000   │ │
│  │ 🎤 MC Services   │  │   ├─────────────────────────┤ │
│  │ MCs              │  │   │ LED Lighting       ➕➖ │ │
│  │ Ksh 35,000  [Add]│  │   │ Qty: 2     Ksh 65,000   │ │
│  └──────────────────┘  │   └─────────────────────────┘ │
│                         │                               │
│                         │   Event Details               │
│                         │   Date: [2025-12-25]          │
│                         │   Time: [18:00]               │
│                         │   Venue: [Safari Park]        │
│                         │                               │
│                         │   Total: Ksh 150,000          │
│                         │   [✓ Complete Booking]        │
└─────────────────────────┴───────────────────────────────┘
```

### Professional PDF Receipt
```
┌─────────────────────────────────────────────────────────┐
│  [Indigo Gradient Header]                               │
│                   🎉 Event Yetu                          │
│        Professional Event Management Services            │
│                                                          │
│              BOOKING RECEIPT                             │
├─────────────────────────────────────────────────────────┤
│  Booking Info                                           │
│  • Number: BK-20251115-0001                             │
│  • Event Date: 25 Dec 2025                              │
│  • Status: CONFIRMED                                     │
│                                                          │
│  Client: Sarah Johnson (sarah@example.com)              │
│                                                          │
│  Booked Services                                         │
│  ┌──────────────┬─────────┬─────────┬─────┬──────────┐ │
│  │ Service      │ Category│ Provider│ Qty │ Amount   │ │
│  ├──────────────┼─────────┼─────────┼─────┼──────────┤ │
│  │ Wedding DJ   │ DJs     │ John's  │  1  │  50,000  │ │
│  │ MC Services  │ MCs     │ MC Pro  │  1  │  35,000  │ │
│  │ LED Lighting │ Lighting│ LightPro│  2  │  65,000  │ │
│  └──────────────┴─────────┴─────────┴─────┴──────────┘ │
│                                                          │
│                                   TOTAL:  Ksh 150,000   │
│                                                          │
│  ✓ Payment Confirmed                                    │
│  M-Pesa Ref: QJK9X4T2L1                                 │
├─────────────────────────────────────────────────────────┤
│  Thank you for choosing Event Yetu!                     │
│  support@eventyetu.com | www.eventyetu.com              │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Use Cases

### Use Case 1: Client Books Wedding Package
**User:** Sarah (Client)  
**Services:** DJ + MC + Lighting + Sound System  
**Process:**
1. Browses services → Adds 4 services to cart
2. Sets wedding date: Dec 25, 2025
3. Adds venue: Sarova Whitesands
4. Completes booking
5. Gets booking #BK-20251115-0001
6. Downloads receipt showing all 4 services

### Use Case 2: Provider Coordinates Event
**User:** John (Provider)  
**Services:** Booking multiple vendors for client  
**Process:**
1. Logs in as provider
2. Books DJ + Tent + Catering from different providers
3. Creates booking on behalf of client
4. Shares receipt with client

### Use Case 3: Admin Manages Corporate Event
**User:** Admin  
**Services:** Conference setup (multiple categories)  
**Process:**
1. Logs in as admin
2. Books speakers, sound, lighting, venue
3. Creates comprehensive booking
4. Downloads receipt for accounting

---

## 🔧 API Reference

### Create Multi-Service Booking

**Endpoint:** `POST /backend/api/bookings_enhanced.php?action=create-multi`

**Headers:**
```json
{
  "Authorization": "Bearer {token}",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "services": [
    {"service_id": 1, "quantity": 2},
    {"service_id": 5, "quantity": 1}
  ],
  "event_date": "2025-12-25",
  "event_time": "18:00",
  "venue": "Nairobi Convention Center",
  "notes": "VIP seating required"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Multi-service booking created successfully",
  "booking": {
    "id": 15,
    "booking_number": "BK-20251115-0001",
    "event_date": "2025-12-25",
    "total_amount": 125000,
    "items": [
      {
        "service_name": "Professional DJ",
        "category": "DJs",
        "provider": "John's Events",
        "quantity": 2,
        "unit_price": 50000,
        "subtotal": 100000
      }
    ]
  }
}
```

### Get Booking Details

**Endpoint:** `GET /backend/api/bookings_enhanced.php?action=booking-details&booking_id=15`

**Response:**
```json
{
  "success": true,
  "booking": {
    "id": 15,
    "booking_number": "BK-20251115-0001",
    "user_name": "Sarah Johnson",
    "user_email": "sarah@example.com",
    "event_date": "2025-12-25",
    "total_amount": 150000,
    "status": "confirmed",
    "items": [...],
    "payment": {...}
  }
}
```

### Download Receipt

**Endpoint:** `GET /backend/api/generate_receipt.php?booking_id=15`

**Response:** PDF file download

---

## 📋 Database Structure

### Bookings Table
| Field          | Type         | Description                    |
|----------------|--------------|--------------------------------|
| id             | INT          | Primary key                    |
| booking_number | VARCHAR(50)  | Unique ref (BK-20251115-0001) |
| user_id        | INT          | Any user (client/provider/admin)|
| user_role      | VARCHAR(50)  | Role at booking time           |
| event_date     | DATE         | Event date                     |
| event_time     | TIME         | Event time (optional)          |
| venue          | VARCHAR(255) | Venue (optional)               |
| total_amount   | DECIMAL      | Auto-calculated                |
| status         | ENUM         | pending/confirmed/completed    |
| notes          | TEXT         | Special requirements           |

### Booking Items Table
| Field            | Type         | Description                |
|------------------|--------------|----------------------------|
| id               | INT          | Primary key                |
| booking_id       | INT          | Foreign key to bookings    |
| service_id       | INT          | Service reference          |
| service_name     | VARCHAR(255) | Snapshot                   |
| service_category | VARCHAR(100) | Snapshot                   |
| provider_id      | INT          | Provider ID                |
| provider_name    | VARCHAR(255) | Snapshot                   |
| quantity         | INT          | Number of units            |
| unit_price       | DECIMAL      | Price snapshot             |
| subtotal         | DECIMAL      | quantity × unit_price      |

### Payments Table
| Field           | Type         | Description              |
|-----------------|--------------|--------------------------|
| id              | INT          | Primary key              |
| booking_id      | INT          | Foreign key              |
| receipt_number  | VARCHAR(50)  | Unique receipt ID        |
| amount          | DECIMAL      | Payment amount           |
| payment_method  | ENUM         | mpesa/manual/cash/bank   |
| mpesa_reference | VARCHAR(100) | M-Pesa transaction code  |
| status          | ENUM         | pending/completed/failed |
| paid_at         | DATETIME     | Payment timestamp        |

---

## 🎨 Customization

### Modify Receipt Design

Edit `/backend/api/generate_receipt.php`:

```php
// Change header color
$this->SetFillColor(79, 70, 229); // Indigo

// Change company name
$this->Cell(0, 10, 'Your Company Name', 0, 1, 'C');

// Add logo
$this->Image('path/to/logo.png', 10, 10, 30);

// Customize footer
$this->Cell(0, 4, 'Custom footer text', 0, 1, 'C');
```

### Add Custom Fields

1. **Update database:**
```sql
ALTER TABLE bookings ADD COLUMN custom_field VARCHAR(255);
```

2. **Update API** (`bookings_enhanced.php`):
```php
$customField = $data['custom_field'] ?? null;
// Include in INSERT statement
```

3. **Update frontend** (`MultiServiceBooking.jsx`):
```jsx
const [customField, setCustomField] = useState('');
// Add input field and include in booking data
```

---

## 🐛 Troubleshooting

### Issue: "Booking not found"
**Solution:** Check booking_id parameter is correct

### Issue: PDF not downloading
**Solution:** 
- Verify FPDF is installed: `/vendor/setasign/fpdf/`
- Check PHP `allow_url_fopen` is enabled
- Verify file permissions

### Issue: Total amount is 0
**Solution:** Database triggers may not be active. Run:
```sql
-- Check triggers exist
SHOW TRIGGERS FROM event_yetu;

-- If missing, re-run db_enhanced.sql
```

### Issue: Services not showing
**Solution:** Ensure services have `status = 'approved'`

### Issue: Can't access /book-services
**Solution:** 
- Clear browser cache
- Verify route in App.jsx
- Check user is logged in

---

## ✅ Testing Checklist

- [ ] Database migration completed
- [ ] Can access /book-services
- [ ] Can search and filter services
- [ ] Can add service to cart
- [ ] Can adjust quantities
- [ ] Can remove from cart
- [ ] Can fill event details
- [ ] Can submit booking
- [ ] Booking appears in dashboard
- [ ] Can view receipt page
- [ ] Can download PDF
- [ ] PDF shows all services
- [ ] PDF shows correct totals
- [ ] Tested as Client
- [ ] Tested as Provider
- [ ] Tested as Admin

---

## 🎉 Success!

You now have a complete unified receipt system!

**Key Features:**
- ✅ Multi-service bookings
- ✅ Professional PDF receipts
- ✅ All user roles supported
- ✅ Historical accuracy
- ✅ Auto-calculations
- ✅ Beautiful UI
- ✅ Mobile responsive

**Need help?** Check `RECEIPT_SYSTEM_GUIDE.md` for detailed documentation.

Happy booking! 🎊
