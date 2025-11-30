-- Enhanced Event Yetu Database Schema with Multi-Service Bookings & Unified Receipts
-- Run this AFTER the existing db.sql to add new tables

USE `event_yetu`;

-- Drop existing bookings table and recreate with new structure
-- IMPORTANT: Backup your data before running this in production!

-- Create new bookings table for multi-service support
DROP TABLE IF EXISTS `booking_items`;
DROP TABLE IF EXISTS `payments`;

-- Rename old bookings table to preserve data
ALTER TABLE `bookings` RENAME TO `bookings_old`;

-- New bookings table (parent table for multi-service bookings)
CREATE TABLE `bookings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `booking_number` VARCHAR(50) NOT NULL UNIQUE,
  `user_id` INT NOT NULL COMMENT 'User who made the booking (any role)',
  `user_role` VARCHAR(50) NOT NULL COMMENT 'Role of user at time of booking',
  `event_date` DATE NOT NULL,
  `event_time` TIME NULL,
  `venue` VARCHAR(255) NULL,
  `total_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `status` ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
  `notes` TEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX idx_booking_number (`booking_number`),
  INDEX idx_user_id (`user_id`),
  INDEX idx_event_date (`event_date`),
  INDEX idx_status (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Booking items (child table - services in each booking)
CREATE TABLE `booking_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `booking_id` INT NOT NULL,
  `service_id` INT NOT NULL,
  `service_name` VARCHAR(255) NOT NULL COMMENT 'Snapshot of service name',
  `service_category` VARCHAR(100) NOT NULL COMMENT 'Snapshot of category',
  `provider_id` INT NOT NULL COMMENT 'Snapshot of provider',
  `provider_name` VARCHAR(255) NOT NULL COMMENT 'Snapshot of provider name',
  `quantity` INT NOT NULL DEFAULT 1,
  `unit_price` DECIMAL(10,2) NOT NULL COMMENT 'Snapshot of price',
  `subtotal` DECIMAL(10,2) NOT NULL COMMENT 'quantity * unit_price',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE RESTRICT,
  INDEX idx_booking_id (`booking_id`),
  INDEX idx_service_id (`service_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payments table
CREATE TABLE `payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `booking_id` INT NOT NULL,
  `receipt_number` VARCHAR(50) NOT NULL UNIQUE,
  `amount` DECIMAL(10,2) NOT NULL,
  `payment_method` ENUM('mpesa', 'manual', 'cash', 'bank_transfer') DEFAULT 'mpesa',
  `mpesa_reference` VARCHAR(100) NULL COMMENT 'M-Pesa transaction code',
  `mpesa_phone` VARCHAR(20) NULL,
  `status` ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  `paid_at` DATETIME NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE CASCADE,
  INDEX idx_receipt_number (`receipt_number`),
  INDEX idx_booking_id (`booking_id`),
  INDEX idx_mpesa_reference (`mpesa_reference`),
  INDEX idx_status (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migrate old bookings data to new structure (optional - run if you have existing data)
-- This creates one booking per old booking record
INSERT INTO `bookings` (booking_number, user_id, user_role, event_date, total_amount, status, created_at)
SELECT 
  CONCAT('BK-', LPAD(id, 6, '0')) as booking_number,
  client_id as user_id,
  'client' as user_role,
  date as event_date,
  0.00 as total_amount,
  CASE 
    WHEN status = 'confirmed' THEN 'confirmed'
    WHEN status = 'cancelled' THEN 'cancelled'
    ELSE 'pending'
  END as status,
  created_at
FROM `bookings_old`;

-- Migrate booking items from old bookings
INSERT INTO `booking_items` (booking_id, service_id, service_name, service_category, provider_id, provider_name, quantity, unit_price, subtotal)
SELECT 
  nb.id as booking_id,
  ob.service_id,
  s.name as service_name,
  s.category as service_category,
  s.provider_id,
  u.name as provider_name,
  1 as quantity,
  s.price as unit_price,
  s.price as subtotal
FROM `bookings_old` ob
JOIN `bookings` nb ON CONCAT('BK-', LPAD(ob.id, 6, '0')) = nb.booking_number
JOIN `services` s ON ob.service_id = s.id
JOIN `users` u ON s.provider_id = u.id;

-- Update total amounts in bookings
UPDATE `bookings` b
SET total_amount = (
  SELECT COALESCE(SUM(subtotal), 0)
  FROM `booking_items`
  WHERE booking_id = b.id
);

-- Create trigger to auto-update booking total when items change
DELIMITER //

CREATE TRIGGER update_booking_total_after_insert
AFTER INSERT ON booking_items
FOR EACH ROW
BEGIN
  UPDATE bookings 
  SET total_amount = (
    SELECT COALESCE(SUM(subtotal), 0) 
    FROM booking_items 
    WHERE booking_id = NEW.booking_id
  )
  WHERE id = NEW.booking_id;
END//

CREATE TRIGGER update_booking_total_after_update
AFTER UPDATE ON booking_items
FOR EACH ROW
BEGIN
  UPDATE bookings 
  SET total_amount = (
    SELECT COALESCE(SUM(subtotal), 0) 
    FROM booking_items 
    WHERE booking_id = NEW.booking_id
  )
  WHERE id = NEW.booking_id;
END//

CREATE TRIGGER update_booking_total_after_delete
AFTER DELETE ON booking_items
FOR EACH ROW
BEGIN
  UPDATE bookings 
  SET total_amount = (
    SELECT COALESCE(SUM(subtotal), 0) 
    FROM booking_items 
    WHERE booking_id = OLD.booking_id
  )
  WHERE id = OLD.booking_id;
END//

DELIMITER ;

-- Add image_url column to services if not exists (for compatibility)
ALTER TABLE `services` 
ADD COLUMN IF NOT EXISTS `image_url` VARCHAR(255) NULL AFTER `image`;

-- Update image_url from image column
UPDATE `services` SET image_url = image WHERE image IS NOT NULL AND image_url IS NULL;

-- You can now drop the old bookings table after verifying data migration
-- DROP TABLE IF EXISTS `bookings_old`;

-- Summary of changes:
-- ✅ Multi-service bookings support
-- ✅ Booking number generation
-- ✅ Snapshot of service/provider data for historical accuracy
-- ✅ Payments table with receipt numbers
-- ✅ Support for all user roles (client, provider, admin)
-- ✅ Automatic total calculation via triggers
-- ✅ M-Pesa integration fields
-- ✅ Data migration from old structure
