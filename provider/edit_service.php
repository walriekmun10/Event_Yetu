<?php
require_once __DIR__ . '/../includes/header.php';
if (!is_logged_in() || !is_provider()) {
  header('Location: /Event-yetu/login.php');
  exit;
}
$uid = $_SESSION['user_id'];
$id = intval($_GET['id'] ?? 0);
$stmt = $pdo->prepare('SELECT * FROM services WHERE id = :id AND provider_id = :pid');
$stmt->execute([':id' => $id, ':pid' => $uid]);
$svc = $stmt->fetch();
if (!$svc) {
  echo '<div class="alert alert-danger">Service not found</div>';
  require_once __DIR__ . '/../includes/footer.php';
  exit;
}
$errors = [];
$cats = $pdo->query('SELECT name FROM categories')->fetchAll(PDO::FETCH_COLUMN);
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  // CSRF check
  if (!isset($_POST['csrf_token']) || !validate_csrf_token($_POST['csrf_token'])) {
    $errors[] = 'Invalid CSRF token';
  }
  $name = trim($_POST['name']);
  $category = $_POST['category'];
  $description = trim($_POST['description']);
  $price = floatval($_POST['price']);

  if (!$name) $errors[] = 'Name required';
  if (!$category) $errors[] = 'Category required';
  if ($price <= 0) $errors[] = 'Price must be > 0';

  $imageName = $svc['image'];
  // allow filename provided by async upload (stored in hidden uploaded_image)
  if (!empty($_POST['uploaded_image'])) {
    $provided = basename($_POST['uploaded_image']);
    if (file_exists(__DIR__ . '/../uploads/services/' . $provided)) {
      // remove old image
      if ($svc['image'] && file_exists(__DIR__ . '/../uploads/services/' . $svc['image'])) @unlink(__DIR__ . '/../uploads/services/' . $svc['image']);
      $imageName = $provided;
    }
  }

  if (isset($_FILES['image']) && $_FILES['image']['error'] !== UPLOAD_ERR_NO_FILE) {
    $img = $_FILES['image'];
    $allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
    if ($img['error'] !== UPLOAD_ERR_OK) $errors[] = 'Image upload error';
    if ($img['size'] > 5 * 1024 * 1024) $errors[] = 'Image too large (max 5MB)';
    if (!in_array(mime_content_type($img['tmp_name']), $allowed)) $errors[] = 'Invalid image type. Allowed: jpg, jpeg, png, gif, webp';
    if (empty($errors)) {
      $ext = pathinfo($img['name'], PATHINFO_EXTENSION);
      $imageName = uniqid('svc_') . '.' . $ext;
      $uploadDir = __DIR__ . '/../uploads/services/';
      if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
      $target = $uploadDir . $imageName;
      if (!move_uploaded_file($img['tmp_name'], $target)) {
        $errors[] = 'Failed to move uploaded file';
      } else {
        // remove old
        if ($svc['image'] && file_exists(__DIR__ . '/../uploads/services/' . $svc['image'])) @unlink(__DIR__ . '/../uploads/services/' . $svc['image']);
      }
    }
  }

  if (empty($errors)) {
    $stmt = $pdo->prepare('UPDATE services SET category=:cat,name=:name,description=:desc,price=:price,image=:img,updated_at=NOW() WHERE id=:id AND provider_id=:pid');
    $stmt->execute([':cat' => $category, ':name' => $name, ':desc' => $description, ':price' => $price, ':img' => $imageName, ':id' => $id, ':pid' => $uid]);
    header('Location: /Event-yetu/provider/my_services.php');
    exit;
  }
}
?>
<h2>Edit Service</h2>
<?php if ($errors): ?><div class="alert alert-danger"><?php echo implode('<br>', $errors); ?></div><?php endif; ?>
<form method="post" enctype="multipart/form-data">
  <?= csrf_input_field() ?>
  <div class="mb-3"><label class="form-label">Name</label><input name="name" class="form-control" value="<?= htmlspecialchars($svc['name']) ?>" required></div>
  <div class="mb-3"><label class="form-label">Category</label>
    <select name="category" class="form-select" required>
      <?php foreach ($cats as $c): ?>
        <option value="<?= htmlspecialchars($c) ?>" <?= $c === $svc['category'] ? 'selected' : '' ?>><?= htmlspecialchars($c) ?></option>
      <?php endforeach; ?>
    </select>
  </div>
  <div class="mb-3"><label class="form-label">Description</label><textarea name="description" class="form-control"><?= htmlspecialchars($svc['description']) ?></textarea></div>
  <div class="mb-3"><label class="form-label">Price</label><input name="price" type="number" step="0.01" class="form-control" value="<?= htmlspecialchars($svc['price']) ?>" required></div>
  <div class="mb-3">
    <label class="form-label">Replace Image (optional)</label>
    <input id="image-input" name="image" type="file" accept="image/*" class="form-control">
    <input type="hidden" name="uploaded_image" id="uploaded_image" value="">
    <div class="mt-2">
      <?php if ($svc['image']): ?>
        <img id="image-preview" src="/Event-yetu/uploads/services/<?= htmlspecialchars($svc['image']) ?>" alt="Current" style="max-width:200px; max-height:200px; object-fit:cover; border:1px solid #ddd; padding:4px; border-radius:6px;" />
      <?php else: ?>
        <img id="image-preview" src="" alt="Preview" style="display:none; max-width:200px; max-height:200px; object-fit:cover; border:1px solid #ddd; padding:4px; border-radius:6px;" />
      <?php endif; ?>
      <div id="image-error" class="text-danger mt-2" style="display:none;"></div>
      <div id="image-loading" class="text-muted mt-2" style="display:none;">Uploading image...</div>
    </div>
  </div>
  <button class="btn btn-primary">Update</button>
</form>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>

<script>
// Client-side preview and async upload for edit service
(function(){
  const input = document.getElementById('image-input');
  const preview = document.getElementById('image-preview');
  const errorBox = document.getElementById('image-error');
  const loading = document.getElementById('image-loading');
  const uploadedField = document.getElementById('uploaded_image');
  const allowedTypes = ['image/jpeg','image/png','image/jpg','image/gif','image/webp'];
  const MAX = 5 * 1024 * 1024;

  input && input.addEventListener('change', async (e) => {
    errorBox.style.display = 'none';
    const file = e.target.files[0];
    if (!file) return;
    if (!allowedTypes.includes(file.type)) {
      errorBox.textContent = 'Invalid image type. Allowed: jpg, jpeg, png, gif, webp';
      errorBox.style.display = 'block';
      input.value = '';
      return;
    }
    if (file.size > MAX) {
      errorBox.textContent = 'Image too large (max 5MB)';
      errorBox.style.display = 'block';
      input.value = '';
      return;
    }

    const url = URL.createObjectURL(file);
    preview.src = url;
    preview.style.display = 'inline-block';

    try {
      loading.style.display = 'block';
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch('/Event-yetu/backend/api/upload.php?type=service', { method: 'POST', body: fd, credentials: 'same-origin' });
      const data = await res.json();
      if (res.ok && data.success) {
        uploadedField.value = data.filename || data.url || '';
      } else {
        errorBox.textContent = data.error || 'Upload failed';
        errorBox.style.display = 'block';
        preview.style.display = 'none';
        input.value = '';
      }
    } catch (err) {
      console.error(err);
      errorBox.textContent = 'Upload failed. Please try again.';
      errorBox.style.display = 'block';
      preview.style.display = 'none';
      input.value = '';
    } finally {
      loading.style.display = 'none';
    }
  });
})();
</script>