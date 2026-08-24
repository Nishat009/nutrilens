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

        // Extract chromatic analysis from pixel data (ignoring background)
        let dominantColor = 'unknown';
        const colorCounts: Record<string, number> = {
          red: 0,
          orange: 0,
          yellow: 0,
          green: 0,
          purple: 0,
          brown: 0,
          white: 0,
        };

        try {
          const imgData = ctx.getImageData(0, 0, width, height);
          const data = imgData.data;
          let nonBgPixels = 0;

          for (let i = 0; i < data.length; i += 16) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            if (a < 100) continue; // Skip transparent
            // Skip near-white and near-black background
            if (r > 240 && g > 240 && b > 240) continue;
            if (r < 20 && g < 20 && b < 20) continue;

            nonBgPixels++;

            // Convert RGB to HSV
            const max = Math.max(r, g, b) / 255;
            const min = Math.min(r, g, b) / 255;
            const delta = max - min;

            let h = 0;
            if (delta !== 0) {
              if (max === r / 255) {
                h = ((g / 255 - b / 255) / delta) % 6;
              } else if (max === g / 255) {
                h = (b / 255 - r / 255) / delta + 2;
              } else {
                h = (r / 255 - g / 255) / delta + 4;
              }
              h = Math.round(h * 60);
              if (h < 0) h += 360;
            }

            const s = max === 0 ? 0 : delta / max;
            const v = max;

            if (s < 0.15 && v > 0.7) {
              colorCounts.white++;
            } else if ((h < 18 || h >= 335) && s > 0.22 && v > 0.2) {
              colorCounts.red++;
            } else if (h >= 18 && h < 42 && s > 0.35 && v > 0.25) {
              colorCounts.orange++;
            } else if (h >= 42 && h < 70 && s > 0.25 && v > 0.25) {
              colorCounts.yellow++;
            } else if (h >= 70 && h <= 165 && s > 0.18 && v > 0.15) {
              colorCounts.green++;
            } else if (h >= 240 && h < 335 && s > 0.15 && v > 0.15) {
              colorCounts.purple++;
            } else if (h >= 15 && h < 45 && v < 0.55 && s > 0.2) {
              colorCounts.brown++;
            }
          }

          // Compute normalized percentages relative to non-background pixels
          const colorProfile: Record<string, number> = {};
          const secondaryColors: string[] = [];
          if (nonBgPixels > 30) {
            for (const [col, count] of Object.entries(colorCounts)) {
              colorProfile[col] = Math.round((count / nonBgPixels) * 100);
            }

            // Find dominant non-white chromatic hue
            let maxPercent = 0;
            for (const [col, pct] of Object.entries(colorProfile)) {
              if (col !== 'white' && pct > maxPercent) {
                maxPercent = pct;
                dominantColor = col;
              }
            }

            // Detect secondary colors with significant coverage (>= 10%)
            for (const [col, pct] of Object.entries(colorProfile)) {
              if (col !== 'white' && col !== dominantColor && pct >= 10) {
                secondaryColors.push(col);
              }
            }

            // If highest chromatic color is less than 15%, mark unknown
            if (maxPercent < 15) {
              dominantColor = 'unknown';
            }
          } else {
            colorProfile.red = 0;
            colorProfile.orange = 0;
            colorProfile.green = 0;
            colorProfile.yellow = 0;
            colorProfile.purple = 0;
            colorProfile.brown = 0;
            colorProfile.white = 0;
          }

          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

          resolve({
            valid: true,
            dataUrl: compressedDataUrl,
            file,
            width,
            height,
            aspectRatio: Math.round((width / (height || 1)) * 100) / 100,
            fileName: file.name,
            dominantColor,
            secondaryColors,
            colorProfile,
          } as any);
          return;
        } catch (e) {
          console.warn('Canvas chromatic analysis note:', e);
        }
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
