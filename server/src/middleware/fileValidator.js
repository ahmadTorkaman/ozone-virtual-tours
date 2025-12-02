// ===========================================
// File Validator Middleware
// ===========================================
// Validates file types using magic bytes (not just MIME types)

import { fileTypeFromBuffer } from 'file-type';

// Allowed file types by category
const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mp4', 'audio/x-m4a']
};

/**
 * Validates uploaded file using magic bytes
 * Must be used AFTER multer middleware
 */
export const validateFileType = (allowedCategory) => async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      return next(); // Let the route handler deal with missing file
    }

    const allowed = ALLOWED_TYPES[allowedCategory];
    if (!allowed) {
      return res.status(500).json({
        error: { message: 'Invalid file category configuration' }
      });
    }

    // Check magic bytes
    const fileType = await fileTypeFromBuffer(req.file.buffer);

    if (!fileType) {
      return res.status(400).json({
        error: { message: 'Could not determine file type. Please upload a valid file.' }
      });
    }

    if (!allowed.includes(fileType.mime)) {
      return res.status(400).json({
        error: {
          message: `Invalid file type: ${fileType.mime}. Allowed types: ${allowed.join(', ')}`
        }
      });
    }

    // Attach validated file type to request
    req.validatedFileType = fileType;
    next();
  } catch (error) {
    console.error('File validation error:', error);
    next(error);
  }
};

/**
 * Sanitizes filename to prevent directory traversal attacks
 */
export const sanitizeFilename = (filename) => {
  if (!filename) return '';

  // Remove path separators and null bytes
  let sanitized = filename
    .replace(/[/\\]/g, '')
    .replace(/\0/g, '')
    .replace(/\.\./g, '');

  // Remove leading dots (hidden files)
  sanitized = sanitized.replace(/^\.+/, '');

  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop();
    sanitized = sanitized.substring(0, 250 - ext.length) + '.' + ext;
  }

  return sanitized || 'unnamed';
};

/**
 * Validates file size (in bytes)
 */
export const validateFileSize = (maxSize) => (req, res, next) => {
  if (!req.file) {
    return next();
  }

  if (req.file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    return res.status(400).json({
      error: { message: `File too large. Maximum size is ${maxSizeMB}MB` }
    });
  }

  next();
};

export default {
  validateFileType,
  sanitizeFilename,
  validateFileSize
};
