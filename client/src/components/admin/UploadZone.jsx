import { useState, useCallback } from 'react';
import { Upload, X, Check, AlertCircle } from 'lucide-react';

const UploadZone = ({
  onUploadComplete,
  uploadType = 'panorama', // 'panorama', 'stereo', 'floorplan'
  accept = 'image/jpeg,image/png,image/webp',
  maxSize = 50 * 1024 * 1024 // 50MB
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const validateFile = (file) => {
    // Check file type
    const acceptedTypes = accept.split(',').map(t => t.trim());
    if (!acceptedTypes.includes(file.type)) {
      throw new Error(`Invalid file type. Accepted: ${accept}`);
    }

    // Check file size
    if (file.size > maxSize) {
      throw new Error(`File too large. Max size: ${(maxSize / 1024 / 1024).toFixed(0)}MB`);
    }

    return true;
  };

  const uploadFile = async (file) => {
    try {
      setIsUploading(true);
      setError(null);
      setProgress(0);

      validateFile(file);

      const formData = new FormData();
      formData.append('file', file);

      const endpoint = `/api/upload/${uploadType}`;
      
      // Use XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      
      const uploadPromise = new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(xhr.statusText || 'Upload failed'));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Network error')));
        xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));
      });

      xhr.open('POST', endpoint);
      xhr.send(formData);

      const result = await uploadPromise;
      
      setUploadedFile({
        name: file.name,
        ...result
      });

      if (onUploadComplete) {
        onUploadComplete(result);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      uploadFile(files[0]);
    }
  }, []);

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const reset = () => {
    setUploadedFile(null);
    setError(null);
    setProgress(0);
  };

  const getUploadLabel = () => {
    switch (uploadType) {
      case 'panorama':
        return '360° Panorama';
      case 'stereo':
        return 'Stereo Panorama (Side-by-Side)';
      case 'floorplan':
        return 'Floor Plan';
      default:
        return 'Image';
    }
  };

  const getHelpText = () => {
    switch (uploadType) {
      case 'panorama':
        return 'Upload an equirectangular panorama (2:1 aspect ratio, recommended 4096×2048px)';
      case 'stereo':
        return 'Upload a side-by-side stereo panorama for VR viewing';
      case 'floorplan':
        return 'Upload a top-down floor plan image';
      default:
        return '';
    }
  };

  // Show uploaded state
  if (uploadedFile) {
    return (
      <div className="upload-zone upload-complete">
        <div className="upload-success">
          <Check size={32} className="success-icon" />
          <p className="success-text">Upload complete!</p>
          <p className="file-name">{uploadedFile.name}</p>
          {uploadedFile.metadata && (
            <p className="file-meta">
              {uploadedFile.metadata.width} × {uploadedFile.metadata.height}px
            </p>
          )}
        </div>
        <button className="btn btn-sm" onClick={reset}>
          Upload Another
        </button>
      </div>
    );
  }

  return (
    <div
      className={`upload-zone ${isDragging ? 'dragging' : ''} ${isUploading ? 'uploading' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="file-input"
        disabled={isUploading}
      />

      {isUploading ? (
        <div className="upload-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <p className="progress-text">Uploading... {progress}%</p>
        </div>
      ) : (
        <div className="upload-content">
          <Upload size={48} className="upload-icon" />
          <p className="upload-label">Drop {getUploadLabel()} here</p>
          <p className="upload-sublabel">or click to browse</p>
          <p className="upload-help">{getHelpText()}</p>
        </div>
      )}

      {error && (
        <div className="upload-error">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default UploadZone;
