export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  dataUrl?: string;
  file?: File;
  width?: number;
  height?: number;
}

const SUPPORTED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Validates and compresses an image file on the client using HTML5 Canvas.
 * Compresses large camera shots to a maximum dimension of 1024px and JPEG quality 0.85.
 */
export async function processAndCompressImage(
  file: File,
  maxDimension = 1024,
  quality = 0.85
): Promise<ImageValidationResult> {
  // 1. MIME type validation
  if (!SUPPORTED_MIME_TYPES.includes(file.type.toLowerCase()) && !file.name.match(/\.(jpe?g|png|webp)$/i)) {
    return {
      valid: false,
      error: 'Please upload a valid JPG, JPEG, PNG, or WEBP image.',
    };
  }

  // 2. File size validation
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'This image exceeds the 10MB limit. Please upload a smaller file or take a lower resolution photo.',
    };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate scaled dimensions while preserving aspect ratio
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({
            valid: true,
            dataUrl: event.target?.result as string,
            file,
            width: img.width,
            height: img.height,
          });
          return;
        }

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

        resolve({
          valid: true,
          dataUrl: compressedDataUrl,
          file,
          width,
          height,
        });
      };

      img.onerror = () => {
        resolve({
          valid: false,
          error: 'Failed to decode image file. Please try a different photo.',
        });
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      resolve({
        valid: false,
        error: 'Unable to read the image file from device storage.',
      });
    };

    reader.readAsDataURL(file);
  });
}
