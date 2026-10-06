// Images are stored inside Firestore documents (Spark plan, no Storage), so they
// are resized and compressed before saving. Presets match where each image is shown.
export const IMAGE_PRESETS = {
  photo: { maxSize: 560, maxBytes: 60 * 1024 },      // faculty, leadership: only shown small
  thumb: { maxSize: 480, maxBytes: 28 * 1024 },      // gallery grid previews
  gallery: { maxSize: 1600, maxBytes: 450 * 1024 },  // full-size gallery photo (lightbox)
  hero: { maxSize: 1920, maxBytes: 550 * 1024 },
  logo: { maxSize: 512, maxBytes: 150 * 1024, keepTransparency: true },
};

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('This file could not be read as an image.')); };
    img.src = url;
  });
}

function toBlob(canvas, type, quality) {
  return new Promise(resolve => canvas.toBlob(resolve, type, quality));
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read the processed image.'));
    reader.readAsDataURL(blob);
  });
}

/** Resizes and compresses an image file; resolves to { dataUrl, bytes, width, height }. */
export async function compressImage(file, presetName = 'photo') {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file (JPG, PNG or WebP).');
  const preset = IMAGE_PRESETS[presetName];
  const img = await loadImage(file);

  let scale = Math.min(1, preset.maxSize / Math.max(img.width, img.height));
  // PNG keeps logo transparency; photos use JPEG, which is far smaller
  const type = preset.keepTransparency && file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  let quality = 0.86;
  let blob;

  for (let attempt = 0; attempt < 10; attempt++) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext('2d');
    if (type === 'image/jpeg') {
      ctx.fillStyle = '#fff'; // JPEG has no alpha; avoid black backgrounds
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    blob = await toBlob(canvas, type, quality);
    if (blob && blob.size <= preset.maxBytes) {
      return { dataUrl: await blobToDataUrl(blob), bytes: blob.size, width: canvas.width, height: canvas.height };
    }
    // Lower quality first, then shrink the dimensions
    if (type === 'image/jpeg' && quality > 0.6) quality -= 0.08;
    else scale *= 0.8;
  }
  throw new Error('This image is too large to store even after compression. Please use a smaller image.');
}

/** Re-compresses an existing data URL (e.g. a stored photo) with another preset. */
export async function compressDataUrl(dataUrl, presetName) {
  const blob = await (await fetch(dataUrl)).blob();
  return compressImage(blob, presetName);
}

/** Approximate decoded size of a data URL in bytes. */
export function dataUrlBytes(value) {
  return typeof value === 'string' && value.startsWith('data:') ? Math.round((value.length - value.indexOf(',') - 1) * 0.75) : 0;
}

/** Reads a document file (PDF) as a data URL, refusing anything that can't fit in Firestore. */
export async function readDocumentFile(file, maxBytes = 650 * 1024) {
  if (file.size > maxBytes) {
    throw new Error(`This file is ${(file.size / 1024).toFixed(0)} KB. Files over ${(maxBytes / 1024).toFixed(0)} KB can't be stored here; upload it to Google Drive and paste the share link instead.`);
  }
  return blobToDataUrl(file);
}

export function formatBytes(bytes) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}
