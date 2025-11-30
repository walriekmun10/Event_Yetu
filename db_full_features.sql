-- ============================================
-- Event Yetu - Complete Feature Set Database Schema
-- Features: Profile Pictures, Multi-Service Bookings, Packages, M-Pesa
-- Date: 18 November 2025
-- ============================================

-- Add profile_image column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image VARCHAR(255) DEFAULT NULL AFTER email;

-- Create packages table for premium packages
CREATE TABLE IF NOT EXISTS packages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    image VARCHAR(255),
    price DECIMAL(10, 2) NOT NULL,
    duration VARCHAR(100) COMMENT 'e.g., Full Day, Half Day',
    includes TEXT COMMENT 'JSON array of included services',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create booking_services pivot table for multi-service bookings
CREATE TABLE IF NOT EXISTS booking_services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    service_id INT NOT NULL,
    quantity INT DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    UNIQUE KEY unique_booking_service (booking_id, service_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add package_id to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS package_id INT DEFAULT NULL AFTER service_id;

-- Note: Payment table M-Pesa columns already exist:
-- merchant_request_id, checkout_request_id, result_code, result_desc
-- No additional columns needed

-- Create contact_messages table
CREATE TABLE IF NOT EXISTS contact_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    status ENUM('new', 'read', 'replied') DEFAULT 'new',
    user_id INT DEFAULT NULL COMMENT 'If logged in user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create chat_history table for AI chatbot
CREATE TABLE IF NOT EXISTS chat_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    user_id INT DEFAULT NULL,
    user_message TEXT NOT NULL,
    bot_response TEXT NOT NULL,
    context_data JSON COMMENT 'Additional context like recommended services',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_session (session_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert sample packages
INSERT INTO packages (name, description, category, price, duration, includes, status) VALUES
('Wedding Essentials Package', 'Complete wedding setup with DJ, MC, and decoration services', 'Wedding', 250000.00, 'Full Day', 
 '["Professional DJ", "Master of Ceremonies", "Venue Decoration", "Sound System"]', 'active'),
 
('Corporate Event Pro', 'Professional corporate event management package', 'Corporate', 180000.00, 'Half Day',
 '["PA System", "Projector & Screen", "Event Coordinator", "Photography"]', 'active'),
 
('Birthday Bash Package', 'Fun-filled birthday party setup', 'Birthday', 120000.00, 'Full Day',
 '["DJ Services", "Bouncing Castle", "Decoration", "Photography"]', 'active'),
 
('Premium Photography Package', 'Complete photography and videography coverage', 'Photography', 95000.00, 'Full Day',
 '["Professional Photographer", "Videographer", "Drone Coverage", "Photo Editing"]', 'active');

-- Create triggers for booking_services to auto-update booking total
DELIMITER $$

DROP TRIGGER IF EXISTS after_booking_service_insert$$
CREATE TRIGGER after_booking_service_insert
AFTER INSERT ON booking_services
FOR EACH ROW
BEGIN
    UPDATE bookings 
    SET total_amount = (
        SELECT SUM(subtotal) 
        FROM booking_services 
        WHERE booking_id = NEW.booking_id
    )
    WHERE id = NEW.booking_id;
END$$

DROP TRIGGER IF EXISTS after_booking_service_update$$
CREATE TRIGGER after_booking_service_update
AFTER UPDATE ON booking_services
FOR EACH ROW
BEGIN
    UPDATE bookings 
    SET total_amount = (
        SELECT SUM(subtotal) 
        FROM booking_services 
        WHERE booking_id = NEW.booking_id
    )
    WHERE id = NEW.booking_id;
END$$

DROP TRIGGER IF EXISTS after_booking_service_delete$$
CREATE TRIGGER after_booking_service_delete
AFTER DELETE ON booking_services
FOR EACH ROW
BEGIN
    UPDATE bookings 
    SET total_amount = (
        SELECT COALESCE(SUM(subtotal), 0) 
        FROM booking_services 
        WHERE booking_id = OLD.booking_id
    )
    WHERE id = OLD.booking_id;
END$$

DELIMITER ;

-- ============================================
-- Sample Data for Testing
-- ============================================

-- Note: Run this after the application is set up
-- Sample services will be added via the admin interface

-- ============================================
-- Verification Queries
-- ============================================

-- Check if all tables exist
SELECT 'Tables Created Successfully' AS Status;
SHOW TABLES LIKE '%packages%';
SHOW TABLES LIKE '%booking_services%';
SHOW TABLES LIKE '%contact_messages%';
SHOW TABLES LIKE '%chat_history%';

-- Check if columns were added
DESCRIBE users;
DESCRIBE bookings;
DESCRIBE payments;

SELECT 'Database schema updated successfully!' AS Result;
