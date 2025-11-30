#!/bin/bash
# Column rename helper - updates all PHP files in backend/api to use prefixed column names
# This script performs find-and-replace for common column references

cd /Applications/XAMPP/xamppfiles/htdocs/Event-yetu/backend/api

echo "Starting column rename migration for PHP files..."

# Create backup directory
mkdir -p ../migrations/backup_$(date +%Y%m%d_%H%M%S)
cp -r . ../migrations/backup_$(date +%Y%m%d_%H%M%S)/

# Files to update (excluding auth.php and services.php which are already done)
files="bookings.php cart_checkout.php reports.php upload.php ai.php chat.php bookings_enhanced.php bookings_full.php generate_receipt.php"
payment_files="payments/mpesa_stk_push.php payments/payment_status.php payments/mpesa_callback.php payments/mpesa_stk_complete.php payments/mpesa_callback_complete.php payments/check_config.php"

echo "Updating bookings table column references..."
for file in $files $payment_files; do
    if [ -f "$file" ]; then
        # Bookings columns
        sed -i '' "s/FROM bookings WHERE /FROM bookings WHERE /g" "$file"
        sed -i '' "s/\['id'\]/\['booking_id'\]/g" "$file"  
        sed -i '' "s/b\.id/b.booking_id/g" "$file"
        sed -i '' "s/b\.client_id/b.booking_client_id/g" "$file"
        sed -i '' "s/b\.service_id/b.booking_service_id/g" "$file"
        sed -i '' "s/b\.package_id/b.booking_package_id/g" "$file"
        sed -i '' "s/b\.date/b.booking_date/g" "$file"
        sed -i '' "s/b\.status/b.booking_status/g" "$file"
        sed -i '' "s/b\.created_at/b.booking_created_at/g" "$file"
        echo "  ✓ $file"
    fi
done

echo "Column migration complete!"
echo "Please review files and test thoroughly before deploying."
