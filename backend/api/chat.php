<?php
// backend/api/chat.php
// AI Chatbot API - Intelligent event planning assistant
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Authorization, Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

/**
 * AI Response Generator
 * This is a rule-based system. For production, integrate with OpenAI API
 */
function generateAIResponse($userMessage, $context = []) {
    global $pdo;
    
    $message = strtolower(trim($userMessage));
    $response = '';
    $suggestions = [];
    
    // Greeting patterns
    if (preg_match('/\b(hello|hi|hey|greetings)\b/i', $message)) {
        $response = "Hello! 👋 I'm your Event Yetu assistant. I can help you:\n\n";
        $response .= "• Find and book event services\n";
        $response .= "• Explore premium packages\n";
        $response .= "• Get pricing information\n";
        $response .= "• Guide you through the booking process\n\n";
        $response .= "What type of event are you planning?";
        
        $suggestions = ['Wedding', 'Birthday', 'Corporate Event', 'Show me packages'];
    }
    
    // Package inquiries
    elseif (preg_match('/\b(package|packages|bundle|deals)\b/i', $message)) {
        try {
            $stmt = $pdo->query("SELECT * FROM packages WHERE package_status = 'active' ORDER BY package_price ASC LIMIT 3");
            $packages = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $response = "🎉 Here are our popular event packages:\n\n";
            
            foreach ($packages as $package) {
                $includes = json_decode($package['package_includes'], true);
                $includesList = implode(', ', array_slice($includes, 0, 3));
                $response .= "**{$package['package_name']}**\n";
                $response .= "Ksh " . number_format($package['package_price'], 0) . " - {$package['package_duration']}\n";
                $response .= "Includes: $includesList\n\n";
            }
            
            $response .= "Would you like details about any specific package?";
            $suggestions = array_column($packages, 'package_name');
            $suggestions[] = 'View all packages';
            
        } catch (Exception $e) {
            $response = "I can help you explore our premium packages! Each package includes multiple services at a discounted rate. What type of event are you planning?";
        }
    }
    
    // Wedding-related
    elseif (preg_match('/\b(wedding|marriage|bride|groom)\b/i', $message)) {
        try {
            $stmt = $pdo->query("
                SELECT * FROM services 
                WHERE (service_category LIKE '%Wedding%' OR service_category LIKE '%DJ%' OR service_category LIKE '%Photography%') 
                AND service_status = 'approved' 
                LIMIT 5
            ");
            $services = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $response = "💍 Perfect! For weddings, we offer:\n\n";
            
            if ($services) {
                foreach ($services as $service) {
                    $response .= "• {$service['service_name']} - Ksh " . number_format($service['service_price'], 0) . "\n";
                }
                $response .= "\nWould you like to book individual services or check out our Wedding Package?";
                $suggestions = ['Wedding Package', 'Individual Services', 'Get pricing'];
            } else {
                $response .= "• Professional DJs\n• Photography & Videography\n• Venue Decoration\n• Catering Services\n\n";
                $response .= "Would you like to see our Wedding Essential Package or browse individual services?";
                $suggestions = ['Wedding Package', 'Browse Services'];
            }
            
        } catch (Exception $e) {
            $response = "We have comprehensive wedding services! Would you like to see our Wedding Essential Package?";
        }
    }
    
    // Birthday-related
    elseif (preg_match('/\b(birthday|party|celebration)\b/i', $message)) {
        $response = "🎂 Birthday celebrations are our specialty! We offer:\n\n";
        $response .= "• DJ Services & Entertainment\n";
        $response .= "• Bouncing Castles (kids parties)\n";
        $response .= "• Photography & Videography\n";
        $response .= "• Decoration & Venue Setup\n\n";
        $response .= "Check out our **Birthday Bash Package** for the best value!";
        
        $suggestions = ['Birthday Package', 'DJ Services', 'Photography', 'Show all services'];
    }
    
    // Corporate event
    elseif (preg_match('/\b(corporate|conference|meeting|seminar|workshop)\b/i', $message)) {
        $response = "💼 We specialize in professional corporate events:\n\n";
        $response .= "• PA Systems & Audio Equipment\n";
        $response .= "• Projectors & Screens\n";
        $response .= "• Professional Photography\n";
        $response .= "• Event Coordinators\n\n";
        $response .= "Our **Corporate Event Pro Package** includes everything you need!";
        
        $suggestions = ['Corporate Package', 'Audio Equipment', 'See pricing'];
    }
    
    // Pricing inquiries
    elseif (preg_match('/\b(price|cost|pricing|how much|rates|charges)\b/i', $message)) {
        $response = "💰 Our pricing varies by service and package:\n\n";
        $response .= "**Packages:**\n";
        $response .= "• Wedding Essentials: Ksh 250,000\n";
        $response .= "• Corporate Event Pro: Ksh 180,000\n";
        $response .= "• Birthday Bash: Ksh 120,000\n\n";
        $response .= "**Individual Services:**\n";
        $response .= "• DJs: From Ksh 30,000\n";
        $response .= "• Photography: From Ksh 50,000\n";
        $response .= "• Sound Systems: From Ksh 25,000\n\n";
        $response .= "Would you like detailed pricing for any specific service?";
        
        $suggestions = ['View Packages', 'DJ Services', 'Photography', 'Contact Us'];
    }
    
    // Booking process
    elseif (preg_match('/\b(book|booking|reserve|how to book|make booking)\b/i', $message)) {
        $response = "📝 Booking is simple! Here's how:\n\n";
        $response .= "1. **Browse Services** - Explore our services or packages\n";
        $response .= "2. **Select & Add** - Choose services and add to cart\n";
        $response .= "3. **Event Details** - Provide date, time, and venue\n";
        $response .= "4. **Complete Booking** - Submit your booking\n";
        $response .= "5. **Pay with M-Pesa** - Secure payment via M-Pesa\n";
        $response .= "6. **Confirmation** - Receive booking confirmation\n\n";
        $response .= "Ready to start? What would you like to do?";
        
        $suggestions = ['Browse Services', 'View Packages', 'Talk to Support'];
    }
    
    // Payment inquiries
    elseif (preg_match('/\b(payment|pay|mpesa|m-pesa|how to pay)\b/i', $message)) {
        $response = "💳 We accept payments via M-Pesa:\n\n";
        $response .= "1. Complete your booking\n";
        $response .= "2. Click 'Pay with M-Pesa'\n";
        $response .= "3. Enter your M-Pesa number\n";
        $response .= "4. You'll receive an STK push on your phone\n";
        $response .= "5. Enter your M-Pesa PIN to complete\n";
        $response .= "6. Instant confirmation!\n\n";
        $response .= "Payments are secure and instant. Need help with booking?";
        
        $suggestions = ['Start Booking', 'View Services', 'Contact Support'];
    }
    
    // Help/Support
    elseif (preg_match('/\b(help|support|contact|assistance|question)\b/i', $message)) {
        $response = "🤝 I'm here to help! You can:\n\n";
        $response .= "• Ask me about services and packages\n";
        $response .= "• Get pricing information\n";
        $response .= "• Learn how to make bookings\n";
        $response .= "• Contact our support team\n\n";
        $response .= "What would you like to know?";
        
        $suggestions = ['View Services', 'Check Packages', 'Contact Us', 'Booking Process'];
    }
    
    // Default response
    else {
        $response = "I'm here to help you plan the perfect event! I can assist with:\n\n";
        $response .= "• Finding the right services for your event\n";
        $response .= "• Explaining our packages\n";
        $response .= "• Providing pricing information\n";
        $response .= "• Guiding you through booking\n\n";
        $response .= "What would you like to know?";
        
        $suggestions = ['Show Packages', 'View Services', 'Pricing Info', 'How to Book'];
    }
    
    return [
        'response' => $response,
        'suggestions' => $suggestions
    ];
}

// Main request handler
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $userMessage = trim($data['message'] ?? '');
    $sessionId = $data['session_id'] ?? uniqid('chat_');
    
    if (empty($userMessage)) {
        http_response_code(422);
        echo json_encode([
            'success' => false,
            'error' => 'Message is required'
        ]);
        exit;
    }
    
    // Check if user is logged in (optional)
    $token = get_bearer_token();
    $payload = $token ? jwt_validate($token) : false;
    $userId = $payload ? $payload['user_id'] : null;
    
    try {
        // Generate AI response
        $aiResult = generateAIResponse($userMessage);
        
        // Save to chat history
        $stmt = $pdo->prepare("
            INSERT INTO chat_history (chat_session_id, chat_user_id, chat_user_message, chat_bot_response, chat_context_data, chat_created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        ");
        
        $contextData = json_encode([
            'suggestions' => $aiResult['suggestions']
        ]);
        
        $stmt->execute([
            $sessionId,
            $userId,
            $userMessage,
            $aiResult['response'],
            $contextData
        ]);
        
        echo json_encode([
            'success' => true,
            'response' => $aiResult['response'],
            'suggestions' => $aiResult['suggestions'],
            'session_id' => $sessionId
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Chat error: ' . $e->getMessage()
        ]);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
}
