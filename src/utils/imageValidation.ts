// Image validation utilities for Water Talk app

export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateImageFile = (file: File): ImageValidationResult => {
  // File size limit (5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'Image must be smaller than 5MB'
    };
  }
  
  // File type validation
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    return {
      isValid: false,
      error: 'Only JPG, PNG, and WebP images are allowed'
    };
  }
  
  return { isValid: true };
};

export const validateImageDimensions = (file: File): Promise<ImageValidationResult> => {
  return new Promise((resolve) => {
    const img = new Image();
    
    img.onload = () => {
      // Clean up object URL to prevent memory leaks
      URL.revokeObjectURL(img.src);
      
      // Max dimensions: 2048x2048
      if (img.width > 2048 || img.height > 2048) {
        resolve({
          isValid: false,
          error: 'Image dimensions must be smaller than 2048×2048 pixels'
        });
        return;
      }
      
      // Min dimensions: 200x200
      if (img.width < 200 || img.height < 200) {
        resolve({
          isValid: false,
          error: 'Image must be at least 200×200 pixels for clear visibility'
        });
        return;
      }
      
      resolve({ isValid: true });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      resolve({
        isValid: false,
        error: 'Invalid image file or corrupted data'
      });
    };
    
    img.src = URL.createObjectURL(file);
  });
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getImageInfo = (file: File): Promise<{
  width: number;
  height: number;
  size: string;
  type: string;
}> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve({
        width: img.width,
        height: img.height,
        size: formatFileSize(file.size),
        type: file.type
      });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };
    
    img.src = URL.createObjectURL(file);
  });
};