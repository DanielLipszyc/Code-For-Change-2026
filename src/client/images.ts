import "client-only";

/**
 * Shrink a photo to at most `maxSize` pixels on its longer side and re-encode
 * it as a JPEG data URL. Re-encoding also drops the file's metadata, such as
 * the camera's GPS tag. Rejects if the browser can't read the image (HEIC
 * outside Safari, for example).
 */
export function compressImage(dataUrl: string, maxSize: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Couldn't process the photo"));
        return;
      }
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () =>
      reject(new Error("This photo's format isn't supported. Try a JPEG or PNG."));
    img.src = dataUrl;
  });
}

/** Read a file the user picked as a data URL */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Couldn't read the file"));
    reader.readAsDataURL(file);
  });
}

/** Photos are stored and sent at this size: plenty for identification, small to upload */
export const PHOTO_MAX_SIZE = 800;
export const PHOTO_QUALITY = 0.7;
