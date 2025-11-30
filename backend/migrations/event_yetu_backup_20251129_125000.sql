-- MariaDB dump 10.19  Distrib 10.4.28-MariaDB, for osx10.10 (x86_64)
--
-- Host: localhost    Database: event_yetu
-- ------------------------------------------------------
-- Server version	10.4.28-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `booking_services`
--

DROP TABLE IF EXISTS `booking_services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `booking_services` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `booking_id` int(11) NOT NULL,
  `service_id` int(11) NOT NULL,
  `quantity` int(11) DEFAULT 1,
  `unit_price` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_booking_service` (`booking_id`,`service_id`),
  KEY `service_id` (`service_id`),
  CONSTRAINT `booking_services_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `booking_services_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `booking_services`
--

LOCK TABLES `booking_services` WRITE;
/*!40000 ALTER TABLE `booking_services` DISABLE KEYS */;
/*!40000 ALTER TABLE `booking_services` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER after_booking_service_insert
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
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER after_booking_service_update
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
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER after_booking_service_delete
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
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `bookings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `client_id` int(11) NOT NULL,
  `service_id` int(11) NOT NULL,
  `package_id` int(11) DEFAULT NULL,
  `date` date NOT NULL,
  `status` varchar(50) DEFAULT 'booked',
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `client_id` (`client_id`),
  KEY `service_id` (`service_id`),
  KEY `fk_package` (`package_id`),
  CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_package` FOREIGN KEY (`package_id`) REFERENCES `packages` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookings`
--

LOCK TABLES `bookings` WRITE;
/*!40000 ALTER TABLE `bookings` DISABLE KEYS */;
INSERT INTO `bookings` VALUES (16,15,10,NULL,'2025-11-20','confirmed','2025-11-13 12:51:10'),(17,15,4,NULL,'2025-11-20','confirmed','2025-11-13 12:51:39'),(18,15,10,NULL,'2025-11-22','confirmed','2025-11-13 20:55:49'),(19,15,4,NULL,'2025-11-22','confirmed','2025-11-13 20:56:02'),(20,15,4,NULL,'2025-11-15','confirmed','2025-11-13 21:17:35'),(21,15,10,NULL,'2025-11-14','confirmed','2025-11-13 21:24:59'),(22,15,10,NULL,'2025-11-22','confirmed','2025-11-13 21:26:03'),(23,15,4,NULL,'2025-11-15','confirmed','2025-11-14 15:50:59'),(24,15,10,NULL,'2025-11-15','confirmed','2025-11-15 21:59:59'),(25,15,4,NULL,'2025-11-15','confirmed','2025-11-15 21:59:59'),(26,15,4,NULL,'2025-11-22','confirmed','2025-11-18 15:04:12'),(27,15,10,NULL,'2025-11-22','confirmed','2025-11-18 15:04:12'),(28,15,10,NULL,'2025-11-30','booked','2025-11-29 11:57:53'),(29,15,4,NULL,'2025-11-30','booked','2025-11-29 11:58:13'),(30,15,4,NULL,'2025-11-30','booked','2025-11-29 11:58:27');
/*!40000 ALTER TABLE `bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (3,'DJs'),(6,'Lighting Systems'),(2,'MCs'),(5,'Sound Systems'),(1,'Speakers'),(4,'Tents');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_history`
--

DROP TABLE IF EXISTS `chat_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `chat_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `session_id` varchar(100) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `user_message` text NOT NULL,
  `bot_response` text NOT NULL,
  `context_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Additional context like recommended services' CHECK (json_valid(`context_data`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_session` (`session_id`),
  KEY `idx_user` (`user_id`),
  CONSTRAINT `chat_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_history`
--

LOCK TABLES `chat_history` WRITE;
/*!40000 ALTER TABLE `chat_history` DISABLE KEYS */;
INSERT INTO `chat_history` VALUES (1,'chat_691c55a4cfb08',NULL,'Hello','Hello! 👋 I\'m your Event Yetu assistant. I can help you:\n\n• Find and book event services\n• Explore premium packages\n• Get pricing information\n• Guide you through the booking process\n\nWhat type of event are you planning?','{\"suggestions\":[\"Wedding\",\"Birthday\",\"Corporate Event\",\"Show me packages\"]}','2025-11-18 11:16:52'),(2,'chat_1763464877554',NULL,'Show Packages','🎉 Here are our popular event packages:\n\n**Premium Photography Package**\nKsh 95,000 - Full Day\nIncludes: Professional Photographer, Videographer, Drone Coverage\n\n**Birthday Bash Package**\nKsh 120,000 - Full Day\nIncludes: DJ Services, Bouncing Castle, Decoration\n\n**Corporate Event Pro**\nKsh 180,000 - Half Day\nIncludes: PA System, Projector & Screen, Event Coordinator\n\nWould you like details about any specific package?','{\"suggestions\":[\"Premium Photography Package\",\"Birthday Bash Package\",\"Corporate Event Pro\",\"View all packages\"]}','2025-11-18 12:05:15'),(3,'chat_1763464877554',NULL,'Premium Photography Package','🎉 Here are our popular event packages:\n\n**Premium Photography Package**\nKsh 95,000 - Full Day\nIncludes: Professional Photographer, Videographer, Drone Coverage\n\n**Birthday Bash Package**\nKsh 120,000 - Full Day\nIncludes: DJ Services, Bouncing Castle, Decoration\n\n**Corporate Event Pro**\nKsh 180,000 - Half Day\nIncludes: PA System, Projector & Screen, Event Coordinator\n\nWould you like details about any specific package?','{\"suggestions\":[\"Premium Photography Package\",\"Birthday Bash Package\",\"Corporate Event Pro\",\"View all packages\"]}','2025-11-18 12:05:19'),(4,'chat_1763464877554',NULL,'Birthday Bash Package','🎉 Here are our popular event packages:\n\n**Premium Photography Package**\nKsh 95,000 - Full Day\nIncludes: Professional Photographer, Videographer, Drone Coverage\n\n**Birthday Bash Package**\nKsh 120,000 - Full Day\nIncludes: DJ Services, Bouncing Castle, Decoration\n\n**Corporate Event Pro**\nKsh 180,000 - Half Day\nIncludes: PA System, Projector & Screen, Event Coordinator\n\nWould you like details about any specific package?','{\"suggestions\":[\"Premium Photography Package\",\"Birthday Bash Package\",\"Corporate Event Pro\",\"View all packages\"]}','2025-11-18 12:05:21'),(5,'chat_1763464877554',NULL,'Corporate Event Pro','💼 We specialize in professional corporate events:\n\n• PA Systems & Audio Equipment\n• Projectors & Screens\n• Professional Photography\n• Event Coordinators\n\nOur **Corporate Event Pro Package** includes everything you need!','{\"suggestions\":[\"Corporate Package\",\"Audio Equipment\",\"See pricing\"]}','2025-11-18 12:05:23'),(6,'chat_1763464877554',NULL,'Corporate Package','🎉 Here are our popular event packages:\n\n**Premium Photography Package**\nKsh 95,000 - Full Day\nIncludes: Professional Photographer, Videographer, Drone Coverage\n\n**Birthday Bash Package**\nKsh 120,000 - Full Day\nIncludes: DJ Services, Bouncing Castle, Decoration\n\n**Corporate Event Pro**\nKsh 180,000 - Half Day\nIncludes: PA System, Projector & Screen, Event Coordinator\n\nWould you like details about any specific package?','{\"suggestions\":[\"Premium Photography Package\",\"Birthday Bash Package\",\"Corporate Event Pro\",\"View all packages\"]}','2025-11-18 12:05:25'),(7,'chat_1763464877554',NULL,'Premium Photography Package','🎉 Here are our popular event packages:\n\n**Premium Photography Package**\nKsh 95,000 - Full Day\nIncludes: Professional Photographer, Videographer, Drone Coverage\n\n**Birthday Bash Package**\nKsh 120,000 - Full Day\nIncludes: DJ Services, Bouncing Castle, Decoration\n\n**Corporate Event Pro**\nKsh 180,000 - Half Day\nIncludes: PA System, Projector & Screen, Event Coordinator\n\nWould you like details about any specific package?','{\"suggestions\":[\"Premium Photography Package\",\"Birthday Bash Package\",\"Corporate Event Pro\",\"View all packages\"]}','2025-11-18 12:05:28'),(8,'chat_1763464877554',NULL,'View all packages','🎉 Here are our popular event packages:\n\n**Premium Photography Package**\nKsh 95,000 - Full Day\nIncludes: Professional Photographer, Videographer, Drone Coverage\n\n**Birthday Bash Package**\nKsh 120,000 - Full Day\nIncludes: DJ Services, Bouncing Castle, Decoration\n\n**Corporate Event Pro**\nKsh 180,000 - Half Day\nIncludes: PA System, Projector & Screen, Event Coordinator\n\nWould you like details about any specific package?','{\"suggestions\":[\"Premium Photography Package\",\"Birthday Bash Package\",\"Corporate Event Pro\",\"View all packages\"]}','2025-11-18 12:05:31');
/*!40000 ALTER TABLE `chat_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contact_messages`
--

DROP TABLE IF EXISTS `contact_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `contact_messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `message` text NOT NULL,
  `status` enum('new','read','replied') DEFAULT 'new',
  `user_id` int(11) DEFAULT NULL COMMENT 'If logged in user',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `contact_messages_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contact_messages`
--

LOCK TABLES `contact_messages` WRITE;
/*!40000 ALTER TABLE `contact_messages` DISABLE KEYS */;
INSERT INTO `contact_messages` VALUES (1,'Test User','test@test.com','Test Subject','Test message','new',NULL,'2025-11-18 11:16:42'),(2,'Gungun Gual','WALRIEKMUN@GMAIL.COM','Book with us','Hire with us','new',NULL,'2025-11-18 11:21:57');
/*!40000 ALTER TABLE `contact_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `packages`
--

DROP TABLE IF EXISTS `packages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `packages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `duration` varchar(100) DEFAULT NULL COMMENT 'e.g., Full Day, Half Day',
  `includes` text DEFAULT NULL COMMENT 'JSON array of included services',
  `status` enum('active','inactive') DEFAULT 'active',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `packages_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `packages`
--

LOCK TABLES `packages` WRITE;
/*!40000 ALTER TABLE `packages` DISABLE KEYS */;
INSERT INTO `packages` VALUES (1,'Wedding Essentials Package','Complete wedding setup with DJ, MC, and decoration services','Wedding',NULL,250000.00,'Full Day','[\"Professional DJ\", \"Master of Ceremonies\", \"Venue Decoration\", \"Sound System\"]','active',NULL,'2025-11-18 11:16:31','2025-11-18 11:16:31'),(2,'Corporate Event Pro','Professional corporate event management package','Corporate',NULL,180000.00,'Half Day','[\"PA System\", \"Projector & Screen\", \"Event Coordinator\", \"Photography\"]','active',NULL,'2025-11-18 11:16:31','2025-11-18 11:16:31'),(3,'Birthday Bash Package','Fun-filled birthday party setup','Birthday',NULL,120000.00,'Full Day','[\"DJ Services\", \"Bouncing Castle\", \"Decoration\", \"Photography\"]','active',NULL,'2025-11-18 11:16:31','2025-11-18 11:16:31'),(4,'Premium Photography Package','Complete photography and videography coverage','Photography',NULL,95000.00,'Full Day','[\"Professional Photographer\", \"Videographer\", \"Drone Coverage\", \"Photo Editing\"]','active',NULL,'2025-11-18 11:16:31','2025-11-18 11:16:31');
/*!40000 ALTER TABLE `packages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `booking_id` int(11) NOT NULL,
  `mpesa_receipt` varchar(255) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `phone` varchar(15) NOT NULL,
  `status` enum('Pending','Completed','Failed','Cancelled') DEFAULT 'Pending',
  `transaction_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `merchant_request_id` varchar(255) DEFAULT NULL,
  `checkout_request_id` varchar(255) DEFAULT NULL,
  `result_code` varchar(10) DEFAULT NULL,
  `result_desc` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_booking` (`booking_id`),
  KEY `idx_receipt` (`mpesa_receipt`),
  KEY `idx_status` (`status`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (1,20,'TESTE5162DFBF4',10000.00,'254746633140','Completed','2025-11-13 18:19:02','TEST-69162116b2836','TEST-CO-1763057942','0','TEST MODE: Payment simulated successfully','2025-11-13 18:19:02','2025-11-13 18:19:02'),(2,21,'TESTBBBE7F8FF4',5500.00,'254706288861','Completed','2025-11-13 18:25:22','TEST-691622922afd6','TEST-CO-1763058322','0','TEST MODE: Payment simulated successfully','2025-11-13 18:25:22','2025-11-13 18:25:22'),(3,23,'TEST18904CE463',10000.00,'254714193102','Completed','2025-11-14 12:51:44','TEST-691725e0e8f84','TEST-CO-1763124704','0','TEST MODE: Payment simulated successfully','2025-11-14 12:51:44','2025-11-14 12:51:44'),(4,27,'TEST2CEA687CF9',5500.00,'254706288861','Completed','2025-11-18 12:04:37','TEST-691c60d53f993','TEST-CO-1763467477','0','TEST MODE: Payment simulated successfully','2025-11-18 12:04:37','2025-11-18 12:04:37'),(5,26,'TESTE22291723D',10000.00,'254702688861','Completed','2025-11-24 11:31:47','TEST-69244223893fb','TEST-CO-1763983907','0','TEST MODE: Payment simulated successfully','2025-11-24 11:31:47','2025-11-24 11:31:47');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `services`
--

DROP TABLE IF EXISTS `services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `services` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `provider_id` int(11) NOT NULL,
  `category` varchar(100) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) DEFAULT 0.00,
  `image` varchar(255) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `provider_id` (`provider_id`),
  CONSTRAINT `services_ibfk_1` FOREIGN KEY (`provider_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `services`
--

LOCK TABLES `services` WRITE;
/*!40000 ALTER TABLE `services` DISABLE KEYS */;
INSERT INTO `services` VALUES (4,1,'MCs','Experienced MCs','Affordable budget',10000.00,NULL,'approved','2025-11-12 20:58:21',NULL),(10,13,'Tents','Tent','tent for hire',5500.00,'service_6915a2df099f4.jpg','approved','2025-11-13 12:20:31',NULL),(11,14,'Speakers','Professional','Available for hire',50000.00,NULL,'pending','2025-11-14 15:49:13',NULL),(12,13,'Photography','Camermanii','Experienced Camerman',5500.00,'service_692440e887f00.jpeg','approved','2025-11-24 14:26:32',NULL),(14,14,'Tents','Quality tents','Quality for hire',8000.00,'service_692a97d021af6.jpeg','approved','2025-11-29 09:50:56',NULL),(15,13,'Tents','Service','Hire',50000.00,'service_692aa33d2d014.jpg','approved','2025-11-29 10:39:41',NULL);
/*!40000 ALTER TABLE `services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `profile_image` varchar(255) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(50) NOT NULL DEFAULT 'client',
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Administrator','admin@example.com',NULL,'$2y$10$5JFqUhBu6LqItOt8MCUJDuGjK9RxXkvgmd5razE3pvOZTWxT64uf.','admin','2025-11-12 18:52:32'),(13,'Administrator01','admin1@gmail.com',NULL,'$2y$10$5JFqUhBu6LqItOt8MCUJDuGjK9RxXkvgmd5razE3pvOZTWxT64uf.','admin','2025-11-13 12:02:17'),(14,'Provider01','provider1@gmail.com',NULL,'$2y$10$5JFqUhBu6LqItOt8MCUJDuGjK9RxXkvgmd5razE3pvOZTWxT64uf.','provider','2025-11-13 12:03:16'),(15,'Client01','client1@gmail.com',NULL,'$2y$10$5JFqUhBu6LqItOt8MCUJDuGjK9RxXkvgmd5razE3pvOZTWxT64uf.','client','2025-11-13 12:04:38'),(16,'Test User','testclient@test.com',NULL,'$2y$10$U1VWiX5s3qh7w2XKQUQxd.qJYj7A6NMNvP164ydjZL/8Tonhgq83K','client','2025-11-13 12:25:53'),(17,'Test Provider','testprovider@test.com',NULL,'$2y$10$mgJ4mY5dNx/IV20lQMuSZeOzsvLd9UrFgLfrrjIKUNm96afTY0LZy','provider','2025-11-13 12:26:00'),(18,'client2','client2@gmail.com',NULL,'$2y$10$rGwXQyLIIs83UqQ0hzz64.YM2B9wIbLdIyrZ8U7Yq3/k5gopMLn0S','provider','2025-11-14 15:58:36');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-29 12:50:02
