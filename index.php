<?php
require_once __DIR__ . '/includes/header.php';

// Fetch categories
$stmt = $pdo->query('SELECT * FROM categories');
$categories = $stmt->fetchAll();

// Handle search/filter
$search = $_GET['q'] ?? '';
$category = $_GET['category'] ?? '';
$params = [];
$sql = 'SELECT s.*, u.name as provider_name FROM services s JOIN users u ON s.provider_id = u.id WHERE s.status = "approved"';
if ($search) {
  $sql .= ' AND (s.name LIKE :search OR s.description LIKE :search)';
  $params[':search'] = "%$search%";
}
if ($category) {
  $sql .= ' AND s.category = :category';
  $params[':category'] = $category;
}
$sql .= ' ORDER BY s.created_at DESC';
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$services = $stmt->fetchAll();
?>

<div class="row mb-3">
  <div class="col-md-8">
    <form class="d-flex" method="get" action="/Event-yetu/index.php">
      <input class="form-control me-2" type="search" placeholder="Search services" name="q" value="<?= htmlspecialchars($search) ?>">
      <select class="form-select me-2" name="category">
        <option value="">All categories</option>
        <?php foreach ($categories as $cat): ?>
          <option value="<?= htmlspecialchars($cat['name']) ?>" <?= $cat['name'] == $category ? 'selected' : '' ?>><?= htmlspecialchars($cat['name']) ?></option>
        <?php endforeach; ?>
      </select>
      <button class="btn btn-outline-light" type="submit">Search</button>
    </form>
  </div>
</div>

<div class="row">
  <?php if (empty($services)): ?>
    <div class="col-12">
      <div class="alert alert-info">No services found.</div>
    </div>
  <?php endif; ?>
  <?php foreach ($services as $s): ?>
    <div class="col-md-4 mb-3">
      <div class="card h-100">
        <?php if ($s['image'] && file_exists(__DIR__ . '/uploads/services/' . $s['image'])): ?>
          <img src="/Event-yetu/uploads/services/<?= htmlspecialchars($s['image']) ?>" class="card-img-top" style="height:200px;object-fit:cover;">
        <?php else: ?>
          <img src="/Event-yetu/assets/images/placeholder.png" class="card-img-top" style="height:200px;object-fit:cover;">
        <?php endif; ?>
        <div class="card-body d-flex flex-column">
          <h5 class="card-title"><?= htmlspecialchars($s['name']) ?></h5>
          <p class="card-text"><?= htmlspecialchars(substr($s['description'], 0, 120)) ?>...</p>
          <p class="mt-auto"><strong>Ksh <?= number_format($s['price'], 2) ?></strong></p>
          <a href="/Event-yetu/client/view_service.php?id=<?= $s['id'] ?>" class="btn btn-primary">View</a>
        </div>
      </div>
    </div>
  <?php endforeach; ?>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>