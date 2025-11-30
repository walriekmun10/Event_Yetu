<?php
// backend/config/jwt.php
// Simple JWT helper (HMAC SHA256). For production, prefer firebase/php-jwt via Composer.

$JWT_SECRET = 'replace_with_a_strong_random_secret_change_me'; // change in production
$JWT_ISSUER = 'event-yetu';
$JWT_EXP_SECONDS = 60 * 60 * 24; // 1 day

function base64UrlEncode($data)
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64UrlDecode($data)
{
    $remainder = strlen($data) % 4;
    if ($remainder) $data .= str_repeat('=', 4 - $remainder);
    return base64_decode(strtr($data, '-_', '+/'));
}

function jwt_create($payload)
{
    global $JWT_SECRET, $JWT_ISSUER, $JWT_EXP_SECONDS;
    $header = ['alg' => 'HS256', 'typ' => 'JWT'];
    $now = time();
    $payload['iat'] = $now;
    $payload['iss'] = $JWT_ISSUER;
    $payload['exp'] = $now + $JWT_EXP_SECONDS;
    $segments = [];
    $segments[] = base64UrlEncode(json_encode($header));
    $segments[] = base64UrlEncode(json_encode($payload));
    $signing_input = implode('.', $segments);
    $sig = hash_hmac('sha256', $signing_input, $JWT_SECRET, true);
    $segments[] = base64UrlEncode($sig);
    return implode('.', $segments);
}

function jwt_validate($token)
{
    global $JWT_SECRET;
    $parts = explode('.', $token);
    if (count($parts) !== 3) return false;
    list($b64h, $b64p, $b64s) = $parts;
    $header = json_decode(base64UrlDecode($b64h), true);
    $payload = json_decode(base64UrlDecode($b64p), true);
    $sig = base64UrlDecode($b64s);
    $signing_input = $b64h . '.' . $b64p;
    $expected = hash_hmac('sha256', $signing_input, $JWT_SECRET, true);
    if (!hash_equals($expected, $sig)) return false;
    if (isset($payload['exp']) && time() > $payload['exp']) return false;
    return $payload;
}

function get_bearer_token()
{
    // Try standard HTTP_AUTHORIZATION header
    $hdr = $_SERVER['HTTP_AUTHORIZATION'] ?? '';

    // Fallback to Apache-specific REDIRECT_HTTP_AUTHORIZATION
    if (!$hdr && isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $hdr = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    }

    // Try getallheaders() if available
    if (!$hdr && function_exists('getallheaders')) {
        $headers = getallheaders();
        $hdr = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    }

    if (!$hdr) return null;
    if (preg_match('/Bearer\s+(.*)$/i', $hdr, $matches)) {
        return $matches[1];
    }
    return null;
}
