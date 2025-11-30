-- Migration: Rename all columns with table name prefix
-- Date: 2025-11-29
-- WARNING: This is a BREAKING CHANGE that requires updating all application code

-- USERS TABLE
ALTER TABLE `users`
  CHANGE COLUMN `id` `user_id` int(11) NOT NULL AUTO_INCREMENT,
  CHANGE COLUMN `name` `user_name` varchar(255) NOT NULL,
  CHANGE COLUMN `email` `user_email` varchar(255) NOT NULL,
  CHANGE COLUMN `profile_image` `user_profile_image` varchar(255) DEFAULT NULL,
  CHANGE COLUMN `password` `user_password` varchar(255) NOT NULL,
  CHANGE COLUMN `role` `user_role` varchar(50) NOT NULL DEFAULT 'client',
  CHANGE COLUMN `created_at` `user_created_at` datetime DEFAULT current_timestamp();

-- Add phone column if not exists (with prefix)
ALTER TABLE `users` ADD COLUMN `user_phone` varchar(20) DEFAULT NULL AFTER `user_email`;

-- SERVICES TABLE
ALTER TABLE `services`
  CHANGE COLUMN `id` `service_id` int(11) NOT NULL AUTO_INCREMENT,
  CHANGE COLUMN `provider_id` `service_provider_id` int(11) NOT NULL,
  CHANGE COLUMN `category` `service_category` varchar(100) NOT NULL,
  CHANGE COLUMN `name` `service_name` varchar(255) NOT NULL,
  CHANGE COLUMN `description` `service_description` text DEFAULT NULL,
  CHANGE COLUMN `price` `service_price` decimal(10,2) DEFAULT 0.00,
  CHANGE COLUMN `image` `service_image` varchar(255) DEFAULT NULL,
  CHANGE COLUMN `status` `service_status` varchar(50) DEFAULT 'pending',
  CHANGE COLUMN `created_at` `service_created_at` datetime DEFAULT current_timestamp(),
  CHANGE COLUMN `updated_at` `service_updated_at` datetime DEFAULT NULL;

-- BOOKINGS TABLE
ALTER TABLE `bookings`
  CHANGE COLUMN `id` `booking_id` int(11) NOT NULL AUTO_INCREMENT,
  CHANGE COLUMN `client_id` `booking_client_id` int(11) NOT NULL,
  CHANGE COLUMN `service_id` `booking_service_id` int(11) NOT NULL,
  CHANGE COLUMN `package_id` `booking_package_id` int(11) DEFAULT NULL,
  CHANGE COLUMN `date` `booking_date` date NOT NULL,
  CHANGE COLUMN `status` `booking_status` varchar(50) DEFAULT 'booked',
  CHANGE COLUMN `created_at` `booking_created_at` datetime DEFAULT current_timestamp();

-- PAYMENTS TABLE
ALTER TABLE `payments`
  CHANGE COLUMN `id` `payment_id` int(11) NOT NULL AUTO_INCREMENT,
  CHANGE COLUMN `booking_id` `payment_booking_id` int(11) NOT NULL,
  CHANGE COLUMN `mpesa_receipt` `payment_mpesa_receipt` varchar(255) DEFAULT NULL,
  CHANGE COLUMN `amount` `payment_amount` decimal(10,2) NOT NULL,
  CHANGE COLUMN `phone` `payment_phone` varchar(15) NOT NULL,
  CHANGE COLUMN `status` `payment_status` enum('Pending','Completed','Failed','Cancelled') DEFAULT 'Pending',
  CHANGE COLUMN `transaction_date` `payment_transaction_date` timestamp NOT NULL DEFAULT current_timestamp(),
  CHANGE COLUMN `merchant_request_id` `payment_merchant_request_id` varchar(255) DEFAULT NULL,
  CHANGE COLUMN `checkout_request_id` `payment_checkout_request_id` varchar(255) DEFAULT NULL,
  CHANGE COLUMN `result_code` `payment_result_code` varchar(10) DEFAULT NULL,
  CHANGE COLUMN `result_desc` `payment_result_desc` text DEFAULT NULL,
  CHANGE COLUMN `created_at` `payment_created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  CHANGE COLUMN `updated_at` `payment_updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp();

-- Add receipt_path and email_sent with prefix if they exist
ALTER TABLE `payments` ADD COLUMN `payment_receipt_path` varchar(255) DEFAULT NULL AFTER `payment_mpesa_receipt`;
ALTER TABLE `payments` ADD COLUMN `payment_email_sent` tinyint(1) DEFAULT 0 AFTER `payment_receipt_path`;

-- BOOKING_SERVICES TABLE (if exists)
ALTER TABLE `booking_services`
  CHANGE COLUMN `id` `booking_service_id` int(11) NOT NULL AUTO_INCREMENT,
  CHANGE COLUMN `booking_id` `booking_service_booking_id` int(11) NOT NULL,
  CHANGE COLUMN `service_id` `booking_service_service_id` int(11) NOT NULL,
  CHANGE COLUMN `quantity` `booking_service_quantity` int(11) DEFAULT 1,
  CHANGE COLUMN `unit_price` `booking_service_unit_price` decimal(10,2) NOT NULL,
  CHANGE COLUMN `subtotal` `booking_service_subtotal` decimal(10,2) NOT NULL,
  CHANGE COLUMN `created_at` `booking_service_created_at` timestamp NOT NULL DEFAULT current_timestamp();

-- CATEGORIES TABLE (if exists)
ALTER TABLE `categories`
  CHANGE COLUMN `id` `category_id` int(11) NOT NULL AUTO_INCREMENT,
  CHANGE COLUMN `name` `category_name` varchar(100) NOT NULL;

-- PACKAGES TABLE (if exists)
ALTER TABLE `packages`
  CHANGE COLUMN `id` `package_id` int(11) NOT NULL AUTO_INCREMENT,
  CHANGE COLUMN `name` `package_name` varchar(255) NOT NULL,
  CHANGE COLUMN `description` `package_description` text,
  CHANGE COLUMN `category` `package_category` varchar(100),
  CHANGE COLUMN `image` `package_image` varchar(255),
  CHANGE COLUMN `price` `package_price` decimal(10,2) NOT NULL,
  CHANGE COLUMN `duration` `package_duration` varchar(100),
  CHANGE COLUMN `includes` `package_includes` text,
  CHANGE COLUMN `status` `package_status` enum('active','inactive') DEFAULT 'active',
  CHANGE COLUMN `created_by` `package_created_by` int(11),
  CHANGE COLUMN `created_at` `package_created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  CHANGE COLUMN `updated_at` `package_updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp();

-- CONTACT_MESSAGES TABLE (if exists)
ALTER TABLE `contact_messages`
  CHANGE COLUMN `id` `message_id` int(11) NOT NULL AUTO_INCREMENT,
  CHANGE COLUMN `name` `message_name` varchar(255) NOT NULL,
  CHANGE COLUMN `email` `message_email` varchar(255) NOT NULL,
  CHANGE COLUMN `subject` `message_subject` varchar(255),
  CHANGE COLUMN `message` `message_content` text NOT NULL,
  CHANGE COLUMN `status` `message_status` enum('new','read','replied') DEFAULT 'new',
  CHANGE COLUMN `user_id` `message_user_id` int(11),
  CHANGE COLUMN `created_at` `message_created_at` timestamp NOT NULL DEFAULT current_timestamp();

-- CHAT_HISTORY TABLE (if exists)
ALTER TABLE `chat_history`
  CHANGE COLUMN `id` `chat_id` int(11) NOT NULL AUTO_INCREMENT,
  CHANGE COLUMN `session_id` `chat_session_id` varchar(100) NOT NULL,
  CHANGE COLUMN `user_id` `chat_user_id` int(11),
  CHANGE COLUMN `user_message` `chat_user_message` text NOT NULL,
  CHANGE COLUMN `bot_response` `chat_bot_response` text NOT NULL,
  CHANGE COLUMN `context_data` `chat_context_data` longtext,
  CHANGE COLUMN `created_at` `chat_created_at` timestamp NOT NULL DEFAULT current_timestamp();

-- UPDATE FOREIGN KEY REFERENCES
-- Note: Foreign keys need to be dropped and recreated with new column names
-- This requires knowing the exact foreign key constraint names from your database

-- Rollback script (save separately):
/*
ALTER TABLE `users`
  CHANGE COLUMN `user_id` `id` int(11) NOT NULL AUTO_INCREMENT,
  CHANGE COLUMN `user_name` `name` varchar(255) NOT NULL,
  CHANGE COLUMN `user_email` `email` varchar(255) NOT NULL,
  CHANGE COLUMN `user_profile_image` `profile_image` varchar(255) DEFAULT NULL,
  CHANGE COLUMN `user_password` `password` varchar(255) NOT NULL,
  CHANGE COLUMN `user_role` `role` varchar(50) NOT NULL DEFAULT 'client',
  CHANGE COLUMN `user_phone` `phone` varchar(20) DEFAULT NULL,
  CHANGE COLUMN `user_created_at` `created_at` datetime DEFAULT current_timestamp();
-- (Add similar rollback for all other tables)
*/
