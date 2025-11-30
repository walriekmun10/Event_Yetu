import React, { useState, useEffect } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ProfileUpload = ({ currentImage, onUploadSuccess }) => {
  const { updateProfileImage } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    
    if (!file) return;
    // Validate file type (jpeg/jpg/png)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a JPEG or PNG image');
      return;
    }

    // Validate file size (limit to 5MB for original; we'll compress client-side)
    const MAX_ORIGINAL_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_ORIGINAL_SIZE) {
      setError('Image must be less than 5MB');
      return;
    }

    setError('');

    // Compress the image client-side for faster upload & preview
    // This keeps aspect ratio and avoids distortion.
    const compressImage = (file, maxDimension = 1024, quality = 0.8) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          // Calculate target dimensions while preserving aspect ratio
          if (width > height) {
            if (width > maxDimension) {
              height = Math.round((height *= maxDimension / width));
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width = Math.round((width *= maxDimension / height));
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          // Draw with high quality settings where available
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Determine output type (preserve PNG if source was PNG)
          const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';

          canvas.toBlob(
            (blob) => {
              if (!blob) return reject(new Error('Image compression failed'));
              // Create a new File object so we preserve a filename when sending
              const compressedFile = new File([blob], file.name.replace(/\s+/g, '_'), { type: outputType });
              resolve({ blob, file: compressedFile });
            },
            outputType,
            quality
          );
        };
        img.onerror = (err) => reject(err);
        // Use FileReader to load image into the img element
        const reader = new FileReader();
        reader.onload = (ev) => {
          img.src = ev.target.result;
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });
    };

    // Run compression, set preview from compressed blob and store compressed file
    compressImage(file, 1024, 0.8)
      .then(async ({ blob, file: compressedFile }) => {
        // Create a fast preview URL
        const url = URL.createObjectURL(blob);
        setPreview(url);
        setSelectedFile(compressedFile);

        // Auto-upload immediately after selection & compression so the image
        // appears as the user's profile image without requiring an extra click.
        try {
          setUploading(true);
          setError('');

          const formData = new FormData();
          formData.append('image', compressedFile);

          const token = localStorage.getItem('token');
          const res = await fetch('http://localhost/Event-yetu/backend/api/upload.php?type=profile', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`
            },
            body: formData
          });

          const data = await res.json();
          if (res.ok && data.success) {
            // Use server-returned url when possible (authoritative)
            const serverUrl = data.url || (data.filename ? `/Event-yetu/uploads/${data.filename}` : null);
            // Normalize stored path for AuthContext (strip leading /Event-yetu/ or leading slash)
            let storedPath = '';
            if (data.filename) storedPath = `uploads/${data.filename}`;
            else if (data.url) storedPath = data.url.replace(/^\/?Event-yetu\//, '').replace(/^\//, '');

            if (storedPath) updateProfileImage(storedPath);
            // Replace preview with server-hosted URL so it persists across reloads
            if (serverUrl) setPreview(`http://localhost${serverUrl}`);
            onUploadSuccess?.(serverUrl);
            setSelectedFile(null);
          } else {
            setError(data.error || 'Upload failed');
          }
        } catch (err) {
          console.error('Auto-upload error', err);
          setError('Upload failed. Please try again.');
        } finally {
          setUploading(false);
        }
      })
      .catch((err) => {
        console.error('Compression error', err);
        setError('Failed to process image');
      });
  };

  // Revoke preview object URL when component unmounts or preview changes
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost/Event-yetu/backend/api/upload.php?type=profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Normalize stored path: database stores 'uploads/filename'
        let storedPath = '';
        if (data.filename) {
          storedPath = `uploads/${data.filename}`;
        } else if (data.url) {
          // strip leading /Event-yetu/ if present
          storedPath = data.url.replace(/^\/?Event-yetu\//, '').replace(/^\//, '');
        }

        // Update auth context so UI updates immediately
        if (storedPath) updateProfileImage(storedPath);

        onUploadSuccess?.(data.url);
        setSelectedFile(null);
        setPreview(null);
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err) {
      setError('Upload failed. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const cancelSelection = () => {
    setSelectedFile(null);
    setPreview(null);
    setError('');
  };

  return (
    <div className="space-y-4">
      {/* Current/Preview Image */}
      <div className="flex items-center space-x-4">
        <div className="relative">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
            {preview || currentImage ? (
              <img
                src={preview || `http://localhost/Event-yetu/${currentImage}`}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Camera size={48} />
              </div>
            )}
          </div>
          
          {/* Upload button overlay */}
          {!preview && (
            <label
              htmlFor="profile-upload"
              className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full cursor-pointer hover:bg-indigo-700 transition-colors shadow-lg"
            >
              <Camera size={20} />
              <input
                id="profile-upload"
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          )}
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">Profile Picture</h3>
          <p className="text-sm text-gray-500">JPG or PNG. Max size 2MB.</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Upload Actions */}
      {preview && (
        <div className="flex space-x-3">
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload size={18} />
                <span>Upload Photo</span>
              </>
            )}
          </button>
          
          <button
            onClick={cancelSelection}
            disabled={uploading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <X size={18} />
            <span>Cancel</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileUpload;
