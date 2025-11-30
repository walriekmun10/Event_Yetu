-- Migration to rename remaining table columns with prefixes
-- Date: 2025-11-29
-- Remaining tables: categories, packages, contact_messages, chat_history
-- Note: users, services, bookings, payments, booking_services already migrated

-- CATEGORIES TABLE
ALTER TABLE `categories`
  CHANGE COLUMN `id` `category_id` int(11) NOT NULL AUTO_INCREMENT,
  CHANGE COLUMN `name` `category_name` varchar(100) NOT NULL;

-- PACKAGES TABLE
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

-- CONTACT_MESSAGES TABLE
ALTER TABLE `contact_messages`
  CHANGE COLUMN `id` `message_id` int(11) NOT NULL AUTO_INCREMENT,
  CHANGE COLUMN `name` `message_name` varchar(255) NOT NULL,
  CHANGE COLUMN `email` `message_email` varchar(255) NOT NULL,
  CHANGE COLUMN `subject` `message_subject` varchar(255),
  CHANGE COLUMN `message` `message_content` text NOT NULL,
  CHANGE COLUMN `status` `message_status` enum('new','read','replied') DEFAULT 'new',
  CHANGE COLUMN `user_id` `message_user_id` int(11),
  CHANGE COLUMN `created_at` `message_created_at` timestamp NOT NULL DEFAULT current_timestamp();

-- CHAT_HISTORY TABLE
ALTER TABLE `chat_history`
  CHANGE COLUMN `id` `chat_id` int(11) NOT NULL AUTO_INCREMENT,
  CHANGE COLUMN `session_id` `chat_session_id` varchar(100) NOT NULL,
  CHANGE COLUMN `user_id` `chat_user_id` int(11),
  CHANGE COLUMN `user_message` `chat_user_message` text NOT NULL,
  CHANGE COLUMN `bot_response` `chat_bot_response` text NOT NULL,
  CHANGE COLUMN `context_data` `chat_context_data` longtext,
  CHANGE COLUMN `created_at` `chat_created_at` timestamp NOT NULL DEFAULT current_timestamp();
