<?php
/**
 * AI-Enhanced Recommendations API
 * Provides smart recommendations, predictive insights, and analytics
 */

header('Content-Type: application/json');
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

// Helper function to map service database columns to frontend format
function mapServiceForAI($s) {
    return [
        'id' => $s['service_id'] ?? null,
        'provider_id' => $s['service_provider_id'] ?? null,
        'category' => $s['service_category'] ?? null,
        'name' => $s['service_name'] ?? null,
        'description' => $s['service_description'] ?? null,
        'price' => $s['service_price'] ?? null,
        'image' => $s['service_image'] ?? null,
        'image_url' => $s['service_image'] ? 'uploads/services/' . $s['service_image'] : null,
        'status' => $s['service_status'] ?? null,
        'created_at' => $s['service_created_at'] ?? null,
        'booking_count' => $s['booking_count'] ?? 0,
        'recent_bookings' => $s['recent_bookings'] ?? 0,
        'recommendation_reason' => $s['recommendation_reason'] ?? null,
        'trend_reason' => $s['trend_reason'] ?? null
    ];
}

$action = $_GET['action'] ?? '';

try {
    switch($action) {
        case 'service-recommendations':
            getServiceRecommendations($pdo);
            break;
        case 'trending-services':
            getTrendingServices($pdo);
            break;
        case 'provider-insights':
            getProviderInsights($pdo);
            break;
        case 'demand-forecast':
            getDemandForecast($pdo);
            break;
        case 'similar-services':
            getSimilarServices($pdo);
            break;
        case 'package-suggestions':
            getPackageSuggestions($pdo);
            break;
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
    }
} catch(Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'details' => $e->getMessage()]);
}

/**
 * Get personalized service recommendations for clients
 * Based on booking history and popular trends
 */
function getServiceRecommendations($pdo) {
    $token = get_bearer_token();
    $payload = $token ? jwt_validate($token) : null;
    
    if (!$payload) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        return;
    }
    
    $userId = $payload['sub'];
    
    // Get user's booking history categories
    $stmt = $pdo->prepare('
        SELECT DISTINCT s.service_category 
        FROM bookings b 
        JOIN services s ON b.booking_service_id = s.service_id 
        WHERE b.booking_client_id = :user_id
    ');
    $stmt->execute([':user_id' => $userId]);
    $userCategories = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    // Get trending services in user's preferred categories
    if (count($userCategories) > 0) {
        $placeholders = implode(',', array_fill(0, count($userCategories), '?'));
        $stmt = $pdo->prepare("
            SELECT s.*, COUNT(b.booking_id) as booking_count,
                   'Based on your booking history' as recommendation_reason
            FROM services s
            LEFT JOIN bookings b ON s.service_id = b.booking_service_id
            WHERE s.service_status = 'approved' 
            AND s.service_category IN ($placeholders)
            AND s.service_id NOT IN (
                SELECT booking_service_id FROM bookings WHERE booking_client_id = :user_id
            )
            GROUP BY s.service_id
            ORDER BY booking_count DESC, s.service_created_at DESC
            LIMIT 6
        ");
        $params = array_merge($userCategories, [':user_id' => $userId]);
        $stmt->execute($params);
        $recommendations = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } else {
        // New user - show most popular services
        $stmt = $pdo->prepare('
            SELECT s.*, COUNT(b.booking_id) as booking_count,
                   "Popular with other clients" as recommendation_reason
            FROM services s
            LEFT JOIN bookings b ON s.service_id = b.booking_service_id
            WHERE s.service_status = "approved"
            GROUP BY s.service_id
            ORDER BY booking_count DESC, s.service_created_at DESC
            LIMIT 6
        ');
        $stmt->execute();
        $recommendations = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // Map database columns to frontend format
    $mappedRecommendations = array_map('mapServiceForAI', $recommendations);
    
    echo json_encode([
        'success' => true,
        'recommendations' => $mappedRecommendations,
        'personalized' => count($userCategories) > 0
    ]);
}

/**
 * Get trending services based on recent booking activity
 */
function getTrendingServices($pdo) {
    // Services with most bookings in last 30 days
    $stmt = $pdo->query('
        SELECT s.*, COUNT(b.booking_id) as recent_bookings,
               "Trending this month" as trend_reason
        FROM services s
        LEFT JOIN bookings b ON s.service_id = b.booking_service_id 
            AND b.booking_created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        WHERE s.service_status = "approved"
        GROUP BY s.service_id
        HAVING recent_bookings > 0
        ORDER BY recent_bookings DESC
        LIMIT 10
    ');
    $trending = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Map database columns to frontend format
    $mappedTrending = array_map('mapServiceForAI', $trending);
    
    echo json_encode([
        'success' => true,
        'trending' => $mappedTrending,
        'period' => 'last_30_days'
    ]);
}

/**
 * Provider insights and optimization suggestions
 */
function getProviderInsights($pdo) {
    $token = get_bearer_token();
    $payload = $token ? jwt_validate($token) : null;
    
    if (!$payload || $payload['role'] !== 'provider') {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        return;
    }
    
    $providerId = $payload['sub'];
    
    // Get provider's service performance
    $stmt = $pdo->prepare('
        SELECT 
            s.service_category,
            COUNT(b.booking_id) as total_bookings,
            SUM(CASE WHEN b.booking_status = "confirmed" THEN 1 ELSE 0 END) as confirmed_bookings,
            AVG(s.service_price) as avg_price
        FROM services s
        LEFT JOIN bookings b ON s.service_id = b.booking_service_id
        WHERE s.service_provider_id = :provider_id
        GROUP BY s.service_category
    ');
    $stmt->execute([':provider_id' => $providerId]);
    $performance = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get market insights
    $stmt = $pdo->query('
        SELECT service_category, COUNT(*) as demand
        FROM bookings b
        JOIN services s ON b.booking_service_id = s.service_id
        WHERE b.booking_created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY)
        GROUP BY service_category
        ORDER BY demand DESC
    ');
    $marketDemand = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Generate insights
    $insights = [];
    
    // Peak demand insight
    if (count($marketDemand) > 0) {
        $topCategory = $marketDemand[0];
        $insights[] = [
            'type' => 'opportunity',
            'icon' => '📈',
            'title' => 'High Demand Alert',
            'message' => "{$topCategory['service_category']} services are in high demand with {$topCategory['demand']} bookings in the last 60 days"
        ];
    }
    
    // Performance insight
    if (count($performance) > 0) {
        $bestCategory = array_reduce($performance, function($carry, $item) {
            return (!$carry || $item['total_bookings'] > $carry['total_bookings']) ? $item : $carry;
        });
        
        if ($bestCategory['total_bookings'] > 0) {
            $confirmationRate = round(($bestCategory['confirmed_bookings'] / $bestCategory['total_bookings']) * 100);
            $insights[] = [
                'type' => 'performance',
                'icon' => '⭐',
                'title' => 'Top Performing Category',
                'message' => "Your {$bestCategory['service_category']} services have {$confirmationRate}% confirmation rate"
            ];
        }
    }
    
    // Pricing insight
    $stmt = $pdo->prepare('
        SELECT AVG(service_price) as market_avg_price
        FROM services 
        WHERE service_status = "approved" 
        AND service_category IN (
            SELECT service_category FROM services WHERE service_provider_id = :provider_id
        )
        AND service_provider_id != :provider_id
    ');
    $stmt->execute([':provider_id' => $providerId]);
    $marketData = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($marketData && $marketData['market_avg_price'] && count($performance) > 0) {
        $avgProviderPrice = array_sum(array_column($performance, 'avg_price')) / count($performance);
        $priceDiff = (($avgProviderPrice - $marketData['market_avg_price']) / $marketData['market_avg_price']) * 100;
        
        if (abs($priceDiff) > 20) {
            $insights[] = [
                'type' => 'pricing',
                'icon' => '💰',
                'title' => $priceDiff > 0 ? 'Premium Pricing' : 'Competitive Pricing',
                'message' => sprintf(
                    'Your prices are %d%% %s than market average',
                    abs(round($priceDiff)),
                    $priceDiff > 0 ? 'higher' : 'lower'
                )
            ];
        }
    }
    
    // Seasonal insight
    $currentMonth = date('n');
    if ($currentMonth >= 11 || $currentMonth <= 1) {
        $insights[] = [
            'type' => 'seasonal',
            'icon' => '🎄',
            'title' => 'Holiday Season Peak',
            'message' => 'Event bookings typically increase by 40% during holiday season'
        ];
    }
    
    echo json_encode([
        'success' => true,
        'insights' => $insights,
        'performance' => $performance,
        'marketDemand' => $marketDemand
    ]);
}

/**
 * Forecast demand for different service categories
 */
function getDemandForecast($pdo) {
    // Analyze booking patterns by month and category
    $stmt = $pdo->query('
        SELECT 
            s.service_category,
            MONTH(b.booking_created_at) as month,
            COUNT(*) as bookings
        FROM bookings b
        JOIN services s ON b.booking_service_id = s.service_id
        WHERE b.booking_created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY s.service_category, MONTH(b.booking_created_at)
        ORDER BY s.service_category, month
    ');
    $historicalData = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Group by category
    $forecast = [];
    foreach ($historicalData as $row) {
        $category = $row['service_category'];
        if (!isset($forecast[$category])) {
            $forecast[$category] = [
                'category' => $category,
                'monthly_data' => [],
                'average_bookings' => 0,
                'trend' => 'stable'
            ];
        }
        $forecast[$category]['monthly_data'][] = [
            'month' => $row['month'],
            'bookings' => $row['bookings']
        ];
    }
    
    // Calculate averages and trends
    foreach ($forecast as &$cat) {
        if (count($cat['monthly_data']) > 0) {
            $bookings = array_column($cat['monthly_data'], 'bookings');
            $cat['average_bookings'] = round(array_sum($bookings) / count($bookings), 1);
            
            // Simple trend: compare last 3 months to previous 3 months
            if (count($bookings) >= 6) {
                $recent = array_slice($bookings, -3);
                $previous = array_slice($bookings, -6, 3);
                $recentAvg = array_sum($recent) / 3;
                $previousAvg = array_sum($previous) / 3;
                
                if ($recentAvg > $previousAvg * 1.1) {
                    $cat['trend'] = 'increasing';
                    $cat['trend_icon'] = '📈';
                } elseif ($recentAvg < $previousAvg * 0.9) {
                    $cat['trend'] = 'decreasing';
                    $cat['trend_icon'] = '📉';
                } else {
                    $cat['trend'] = 'stable';
                    $cat['trend_icon'] = '➡️';
                }
            }
        }
    }
    
    echo json_encode([
        'success' => true,
        'forecast' => array_values($forecast),
        'generated_at' => date('Y-m-d H:i:s')
    ]);
}

/**
 * Find services similar to a given service
 * Used for "Clients who booked X also booked Y"
 */
function getSimilarServices($pdo) {
    $serviceId = $_GET['service_id'] ?? null;
    
    if (!$serviceId) {
        http_response_code(400);
        echo json_encode(['error' => 'service_id required']);
        return;
    }
    
    // Get the service category
    $stmt = $pdo->prepare('SELECT service_category FROM services WHERE service_id = :id');
    $stmt->execute([':id' => $serviceId]);
    $service = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$service) {
        http_response_code(404);
        echo json_encode(['error' => 'Service not found']);
        return;
    }
    
    // Find services frequently booked together
    $stmt = $pdo->prepare('
        SELECT s2.*, COUNT(*) as co_booking_count
        FROM bookings b1
        JOIN bookings b2 ON b1.booking_client_id = b2.booking_client_id AND b1.booking_id != b2.booking_id
        JOIN services s2 ON b2.booking_service_id = s2.service_id
        WHERE b1.booking_service_id = :service_id
        AND s2.service_id != :service_id
        AND s2.service_status = "approved"
        GROUP BY s2.service_id
        ORDER BY co_booking_count DESC
        LIMIT 4
    ');
    $stmt->execute([':service_id' => $serviceId]);
    $frequentlyBookedWith = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // If not enough, add similar category services
    if (count($frequentlyBookedWith) < 4) {
        $stmt = $pdo->prepare('
            SELECT s.*, COUNT(b.booking_id) as popularity
            FROM services s
            LEFT JOIN bookings b ON s.service_id = b.booking_service_id
            WHERE s.service_category = :category
            AND s.service_id != :service_id
            AND s.service_status = "approved"
            GROUP BY s.service_id
            ORDER BY popularity DESC
            LIMIT :limit
        ');
        $limit = 4 - count($frequentlyBookedWith);
        $stmt->bindValue(':category', $service['service_category']);
        $stmt->bindValue(':service_id', $serviceId);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        $similarCategory = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $frequentlyBookedWith = array_merge($frequentlyBookedWith, $similarCategory);
    }
    
    echo json_encode([
        'success' => true,
        'similar_services' => $frequentlyBookedWith,
        'recommendation_type' => count($frequentlyBookedWith) > 0 && isset($frequentlyBookedWith[0]['co_booking_count']) 
            ? 'frequently_booked_together' 
            : 'similar_category'
    ]);
}

/**
 * Suggest service packages/bundles
 */
function getPackageSuggestions($pdo) {
    // Find commonly booked service combinations
    $stmt = $pdo->query('
        SELECT 
            s1.service_category as category1,
            s2.service_category as category2,
            COUNT(*) as combination_count
        FROM bookings b1
        JOIN bookings b2 ON b1.booking_client_id = b2.booking_client_id 
            AND DATE(b1.booking_created_at) = DATE(b2.booking_created_at)
            AND b1.booking_id < b2.booking_id
        JOIN services s1 ON b1.booking_service_id = s1.service_id
        JOIN services s2 ON b2.booking_service_id = s2.service_id
        WHERE s1.service_category != s2.service_category
        GROUP BY s1.service_category, s2.service_category
        HAVING combination_count >= 2
        ORDER BY combination_count DESC
        LIMIT 10
    ');
    $packages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format suggestions
    $suggestions = [];
    foreach ($packages as $pkg) {
        $suggestions[] = [
            'package_name' => "{$pkg['category1']} + {$pkg['category2']}",
            'categories' => [$pkg['category1'], $pkg['category2']],
            'popularity' => $pkg['combination_count'],
            'suggestion' => "Clients often book {$pkg['category1']} and {$pkg['category2']} together"
        ];
    }
    
    echo json_encode([
        'success' => true,
        'package_suggestions' => $suggestions
    ]);
}
