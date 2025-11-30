<?php
require_once __DIR__ . '/../config.php';

// Determine a role-aware home URL with file fallbacks so button always points somewhere useful
$docRoot = $_SERVER['DOCUMENT_ROOT'] ?? '';
$homeUrl = '/Event-yetu/index.php';
if (function_exists('is_logged_in')) {
  if (is_admin()) {
    $fallbackFile = $docRoot . '/Event-yetu/admin/index.php';
    // prefer /admin/dashboard if you have an SPA route, otherwise link to server-side admin index
    $homeUrl = file_exists($fallbackFile) ? '/Event-yetu/admin/index.php' : '/Event-yetu/admin/dashboard';
  } elseif (is_provider()) {
    $fallbackFile = $docRoot . '/Event-yetu/provider/my_services.php';
    $homeUrl = file_exists($fallbackFile) ? '/Event-yetu/provider/my_services.php' : '/Event-yetu/provider/dashboard';
  } else {
    // customer / client
    $fallbackFile = $docRoot . '/Event-yetu/client/my_bookings.php';
    if (file_exists($fallbackFile)) {
      $homeUrl = '/Event-yetu/client/my_bookings.php';
    } elseif (file_exists($docRoot . '/Event-yetu/services')) {
      $homeUrl = '/Event-yetu/services';
    } else {
      $homeUrl = '/Event-yetu/index.php';
    }
  }
}

$currentUri = $_SERVER['REQUEST_URI'] ?? '';
$isHomeActive = ($currentUri === $homeUrl || strpos($currentUri, $homeUrl) === 0);
?>
<!doctype html>
<html lang="en">

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Event Yetu</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <!-- Material Icons (Google) -->
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
  <link href="/Event-yetu/assets/css/style.css" rel="stylesheet">
</head>

<body>

  <nav class="navbar navbar-expand-lg navbar-dark bg-primary mb-4">
    <div class="container-fluid">
      <a class="navbar-brand" href="/Event-yetu/index.php">Event Yetu</a>
      
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav ms-auto">
          <!-- Persistent Home link (right side). Visible for all users -->
          <li class="nav-item">
            <a class="nav-link home-nav <?php echo $isHomeActive ? 'active' : ''; ?>" href="<?php echo htmlspecialchars($homeUrl); ?>" aria-label="Home">
              <span class="material-icons" aria-hidden="true">home</span>
              <span class="d-none d-sm-inline ms-1">Home</span>
            </a>
          </li>
          <?php if (is_logged_in()): ?>
            <?php if (is_admin()): ?>
              <li class="nav-item"><a class="nav-link" href="/Event-yetu/admin/index.php">Admin Dashboard</a></li>
            <?php elseif (is_provider()): ?>
              <li class="nav-item"><a class="nav-link" href="/Event-yetu/provider/my_services.php">Provider</a></li>
            <?php else: ?>
              <li class="nav-item"><a class="nav-link" href="/Event-yetu/client/my_bookings.php">My Bookings</a></li>
            <?php endif; ?>
            <li class="nav-item"><a class="nav-link" href="/Event-yetu/logout.php">Logout</a></li>
            <li class="nav-item">
              <a class="nav-link position-relative" href="/Event-yetu/frontend/index.html#/cart" id="global-cart-link">
                Cart
                <span id="global-cart-badge" class="badge bg-danger" style="position:relative; top:-3px; margin-left:6px; display:none;">0</span>
              </a>
            </li>
          <?php else: ?>
            <li class="nav-item"><a class="nav-link" href="/Event-yetu/register.php">Register</a></li>
            <li class="nav-item"><a class="nav-link" href="/Event-yetu/login.php">Login</a></li>
          <?php endif; ?>
        </ul>
      </div>
    </div>
  </nav>
  <div class="container">
  <style>
    /* Home link visuals */
    .home-nav { transition: transform .12s ease; display:flex; align-items:center; }
    .home-nav:hover { transform: translateY(-2px); }
    .home-nav.active, .home-nav:active { box-shadow: 0 2px 6px rgba(0,0,0,0.12); }
    @media (max-width: 576px) {
      .home-nav .d-none.d-sm-inline { display: none !important; }
      .home-nav { padding: .15rem .35rem; }
    }
    .home-nav .material-icons { font-size: 1.05rem; line-height: 1; vertical-align: middle; }
    /* Breadcrumb styling */
    .site-breadcrumb { background: #f8f9fa; padding: .5rem 0; margin-bottom: 1rem; border-bottom: 1px solid rgba(0,0,0,0.04); }
  </style>

  <?php
  // Simple breadcrumb generation (skips repository root name)
  $uriPath = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
  $segments = array_values(array_filter(explode('/', $uriPath)));
  // Remove the project folder name if present
  if (isset($segments[0]) && strtolower($segments[0]) === 'event-yetu') array_shift($segments);

  $map = [
    'admin' => 'Admin', 'provider' => 'Provider', 'client' => 'Client', 'frontend' => 'App',
    'cart' => 'Cart', 'checkout' => 'Checkout', 'bookings' => 'Bookings', 'services' => 'Services',
    'login' => 'Login', 'register' => 'Register'
  ];

  if (count($segments) > 0) {
    echo '<div class="site-breadcrumb d-none d-md-block"><div class="container"><nav aria-label="breadcrumb"><ol class="breadcrumb mb-0">';
    echo '<li class="breadcrumb-item"><a href="/Event-yetu">Home</a></li>';
    $acc = '/Event-yetu';
    foreach ($segments as $idx => $seg) {
      $acc .= '/' . $seg;
      $label = $map[$seg] ?? ucwords(str_replace(['-','_'], ' ', $seg));
      if ($idx === count($segments) - 1) {
        echo '<li class="breadcrumb-item active" aria-current="page">' . htmlspecialchars($label) . '</li>';
      } else {
        echo '<li class="breadcrumb-item"><a href="' . htmlspecialchars($acc) . '">' . htmlspecialchars($label) . '</a></li>';
      }
    }
    echo '</ol></nav></div></div>';
  }
  ?>
  <script>
    (function(){
      try {
        const key = 'eventYetuCart';
        const badge = document.getElementById('global-cart-badge');
        const link = document.getElementById('global-cart-link');
        function updateBadge(){
          let data = localStorage.getItem(key);
          if (!data) { if(badge) badge.style.display='none'; return; }
          try { data = JSON.parse(data); } catch(e){ if(badge) badge.style.display='none'; return; }
          const count = Array.isArray(data) ? data.length : 0;
          if (badge) {
            if (count > 0) { badge.style.display='inline-block'; badge.textContent = count; }
            else badge.style.display='none';
          }
        }
        updateBadge();
        // Update on storage events (other tabs)
        window.addEventListener('storage', function(e){ if (e.key === key) updateBadge(); });
        // Also update before page show
        window.addEventListener('pageshow', updateBadge);
      } catch(e) { /* silent */ }
    })();
  </script>