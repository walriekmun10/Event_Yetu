-- Migration: Add receipt_path and email_sent to payments
-- Date: 2025-11-29
-- Adds columns to store the generated receipt path and whether email was sent

ALTER TABLE `payments`
  ADD COLUMN `receipt_path` VARCHAR(255) NULL AFTER `mpesa_receipt`,
  ADD COLUMN `email_sent` TINYINT(1) DEFAULT 0 AFTER `receipt_path`;

-- Rollback:
-- ALTER TABLE `payments` DROP COLUMN `email_sent`, DROP COLUMN `receipt_path`;
