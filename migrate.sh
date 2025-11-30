#!/bin/bash

# Event-Yetu Receipt System Migration Script
# This script helps migrate your database to the new multi-service booking structure

echo "╔════════════════════════════════════════════════════╗"
echo "║   Event-Yetu Receipt System Migration             ║"
echo "║   Multi-Service Bookings & Unified Receipts        ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DB_NAME="event_yetu"
DB_USER="root"
DB_PASS=""
SQL_FILE="db_enhanced.sql"

echo -e "${YELLOW}⚠️  WARNING: This will modify your database structure!${NC}"
echo -e "${YELLOW}   Please backup your database before proceeding.${NC}"
echo ""
echo "This script will:"
echo "  1. Create new tables (bookings, booking_items, payments)"
echo "  2. Rename old bookings table to bookings_old"
echo "  3. Migrate existing data to new structure"
echo "  4. Create database triggers for auto-calculations"
echo ""

# Ask for confirmation
read -p "Do you want to proceed? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
    echo -e "${RED}Migration cancelled.${NC}"
    exit 1
fi

# Ask for MySQL password
echo "Please enter your MySQL root password:"
read -s DB_PASS_INPUT
DB_PASS=$DB_PASS_INPUT
echo ""

# Create backup
echo -e "${GREEN}Step 1: Creating backup...${NC}"
BACKUP_FILE="backup_event_yetu_$(date +%Y%m%d_%H%M%S).sql"

if mysqldump -u $DB_USER -p"$DB_PASS" $DB_NAME > "$BACKUP_FILE" 2>/dev/null; then
    echo -e "${GREEN}✓ Backup created: $BACKUP_FILE${NC}"
else
    echo -e "${RED}✗ Backup failed. Please check your MySQL credentials.${NC}"
    exit 1
fi

# Run migration
echo ""
echo -e "${GREEN}Step 2: Running migration script...${NC}"

if mysql -u $DB_USER -p"$DB_PASS" < "$SQL_FILE" 2>/dev/null; then
    echo -e "${GREEN}✓ Migration completed successfully!${NC}"
else
    echo -e "${RED}✗ Migration failed.${NC}"
    echo -e "${YELLOW}Restoring from backup...${NC}"
    mysql -u $DB_USER -p"$DB_PASS" $DB_NAME < "$BACKUP_FILE"
    echo -e "${GREEN}✓ Database restored from backup.${NC}"
    exit 1
fi

# Verify migration
echo ""
echo -e "${GREEN}Step 3: Verifying migration...${NC}"

BOOKINGS_COUNT=$(mysql -u $DB_USER -p"$DB_PASS" -D $DB_NAME -se "SELECT COUNT(*) FROM bookings" 2>/dev/null)
ITEMS_COUNT=$(mysql -u $DB_USER -p"$DB_PASS" -D $DB_NAME -se "SELECT COUNT(*) FROM booking_items" 2>/dev/null)

if [ ! -z "$BOOKINGS_COUNT" ] && [ ! -z "$ITEMS_COUNT" ]; then
    echo -e "${GREEN}✓ New bookings table created: $BOOKINGS_COUNT records${NC}"
    echo -e "${GREEN}✓ Booking items table created: $ITEMS_COUNT records${NC}"
else
    echo -e "${RED}✗ Verification failed.${NC}"
    exit 1
fi

# Success message
echo ""
echo "╔════════════════════════════════════════════════════╗"
echo "║            🎉 MIGRATION SUCCESSFUL! 🎉             ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""
echo "Your database is now ready for multi-service bookings!"
echo ""
echo "Next steps:"
echo "  1. Test the booking system at: http://localhost:5175/book-services"
echo "  2. Create a test booking with multiple services"
echo "  3. Download and verify the PDF receipt"
echo ""
echo "Files created:"
echo "  ✓ Backup: $BACKUP_FILE"
echo "  ✓ Old bookings preserved in: bookings_old table"
echo ""
echo -e "${YELLOW}Note: Keep the backup file until you verify everything works!${NC}"
echo ""
