/**
 * Utility to compress images (Data URL or File) on client side
 * Max dimension: 1000px, JPEG quality: 0.75
 * Reduces 10MB camera photo to ~100KB-200KB
 */
export function compressImageFile(file: File, maxWidth = 1000, maxHeight = 1000, quality = 0.75): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve('');
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) {
        resolve('');
        return;
      }
      compressDataUrl(result, maxWidth, maxHeight, quality)
        .then(resolve)
        .catch(() => resolve(result)); // fallback to raw if canvas fails
    };
    reader.readAsDataURL(file);
  });
}

export function compressDataUrl(dataUrl: string, maxWidth = 1000, maxHeight = 1000, quality = 0.75): Promise<string> {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith('data:image')) {
      resolve(dataUrl);
      return;
    }

    const img = new Image();
    img.onerror = () => resolve(dataUrl);
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // If already small enough, skip compression
      if (width <= maxWidth && height <= maxHeight && dataUrl.length < 200000) {
        resolve(dataUrl);
        return;
      }

      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };
    img.src = dataUrl;
  });
}
