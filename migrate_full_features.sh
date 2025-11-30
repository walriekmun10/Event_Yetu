#!/bin/bash

# ============================================
# Event Yetu - Full Features Migration Script
# ============================================

echo "╔═══════════════════════════════════════════════╗"
echo "║   Event Yetu - Full Features Migration       ║"
echo "║   Profile Pictures | Packages | M-Pesa       ║"
echo "╚═══════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DB_NAME="event_yetu"
DB_USER="root"
DB_PASS=""
BACKUP_DIR="./backups"
SQL_FILE="./db_full_features.sql"

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo -e "${BLUE}📋 Pre-Migration Checklist:${NC}"
echo "  ✓ Database schema enhancement"
echo "  ✓ Profile picture support"
echo "  ✓ Multi-service bookings"
echo "  ✓ Premium packages"
echo "  ✓ Enhanced M-Pesa integration"
echo "  ✓ Contact form"
echo "  ✓ AI chatbot"
echo ""

# Confirmation
read -p "$(echo -e ${YELLOW}Continue with migration? [y/N]:${NC} )" -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Migration cancelled${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}📦 Step 1: Creating database backup...${NC}"
BACKUP_FILE="$BACKUP_DIR/event_yetu_backup_$(date +%Y%m%d_%H%M%S).sql"

if command -v mysqldump &> /dev/null; then
    mysqldump -u "$DB_USER" "$DB_NAME" > "$BACKUP_FILE" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Backup created: $BACKUP_FILE${NC}"
    else
        echo -e "${YELLOW}⚠ Backup failed (continuing anyway)${NC}"
    fi
else
    echo -e "${YELLOW}⚠ mysqldump not found, skipping backup${NC}"
fi

echo ""
echo -e "${BLUE}📊 Step 2: Applying database migrations...${NC}"

if [ ! -f "$SQL_FILE" ]; then
    echo -e "${RED}✗ SQL file not found: $SQL_FILE${NC}"
    exit 1
fi

# Apply migrations
mysql -u "$DB_USER" "$DB_NAME" < "$SQL_FILE" 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database migrations applied successfully${NC}"
else
    echo -e "${RED}✗ Migration failed!${NC}"
    echo -e "${YELLOW}Attempting to restore backup...${NC}"
    
    if [ -f "$BACKUP_FILE" ]; then
        mysql -u "$DB_USER" "$DB_NAME" < "$BACKUP_FILE"
        echo -e "${GREEN}✓ Database restored from backup${NC}"
    fi
    exit 1
fi

echo ""
echo -e "${BLUE}🔍 Step 3: Verifying migrations...${NC}"

# Check if new tables exist
TABLES=("packages" "booking_services" "contact_messages" "chat_history")
ALL_OK=true

for table in "${TABLES[@]}"; do
    RESULT=$(mysql -u "$DB_USER" "$DB_NAME" -e "SHOW TABLES LIKE '$table';" 2>/dev/null | grep "$table")
    
    if [ -n "$RESULT" ]; then
        echo -e "${GREEN}  ✓ Table '$table' exists${NC}"
    else
        echo -e "${RED}  ✗ Table '$table' missing${NC}"
        ALL_OK=false
    fi
done

# Check if columns were added
echo ""
echo -e "${BLUE}Checking new columns...${NC}"
COLUMN_CHECK=$(mysql -u "$DB_USER" "$DB_NAME" -e "SHOW COLUMNS FROM users LIKE 'profile_image';" 2>/dev/null)
if [ -n "$COLUMN_CHECK" ]; then
    echo -e "${GREEN}  ✓ users.profile_image column exists${NC}"
else
    echo -e "${RED}  ✗ users.profile_image column missing${NC}"
    ALL_OK=false
fi

COLUMN_CHECK=$(mysql -u "$DB_USER" "$DB_NAME" -e "SHOW COLUMNS FROM bookings LIKE 'package_id';" 2>/dev/null)
if [ -n "$COLUMN_CHECK" ]; then
    echo -e "${GREEN}  ✓ bookings.package_id column exists${NC}"
else
    echo -e "${RED}  ✗ bookings.package_id column missing${NC}"
    ALL_OK=false
fi

echo ""
if [ "$ALL_OK" = true ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║           ✓ MIGRATION SUCCESSFUL!            ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}📝 Next Steps:${NC}"
    echo "  1. Restart your development server"
    echo "  2. Visit http://localhost:5175 to see the new landing page"
    echo "  3. Test profile picture upload"
    echo "  4. Try booking multiple services"
    echo "  5. Test M-Pesa payments (TEST MODE enabled)"
    echo "  6. Chat with the AI assistant"
    echo ""
    echo -e "${BLUE}📚 Documentation:${NC}"
    echo "  - Landing page: /"
    echo "  - Home page: /home"
    echo "  - About page: /about"
    echo "  - Contact page: /contact"
    echo "  - Book services: /book-services"
    echo ""
    echo -e "${YELLOW}⚠ Important:${NC}"
    echo "  - M-Pesa is in TEST MODE - no real charges"
    echo "  - Update MPESA_CALLBACK_URL in backend/config/mpesa.php"
    echo "  - For production, set MPESA_TEST_MODE to false"
else
    echo -e "${RED}╔═══════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║      ✗ MIGRATION COMPLETED WITH ERRORS       ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}Please check the errors above and:${NC}"
    echo "  1. Review the SQL file"
    echo "  2. Check database permissions"
    echo "  3. Restore from backup if needed: $BACKUP_FILE"
fi

echo ""
echo -e "${BLUE}📁 Backup saved at: ${NC}$BACKUP_FILE"
echo -e "${GREEN}Migration script completed!${NC}"
