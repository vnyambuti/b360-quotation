
export function shrinkDataUrl(
  dataUrl: string,
  maxSize = 300,
  mime: 'image/jpeg' | 'image/png' = 'image/jpeg',
  quality = 0.85,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext('2d')!;
      if (mime === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
      }
      ctx.drawImage(img, 0, 0, w, h);

      resolve(canvas.toDataURL(mime, quality));
    };
    img.onerror = () => reject(new Error('Could not load logo image'));
    img.src = dataUrl;
  });
}

