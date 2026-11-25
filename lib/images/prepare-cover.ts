export const MAX_COVER_SOURCE_BYTES = 20 * 1024 * 1024;
export const MAX_COVER_UPLOAD_BYTES = 5 * 1024 * 1024;

const ALLOWED_TYPES = new Set(["image/webp", "image/png", "image/jpeg"]);

function canvasBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("แปลงภาพไม่สำเร็จ"));
    }, type, quality);
  });
}

/** Resize without cropping, then encode to a Storage-friendly image. Browser only. */
async function prepareImage(file: File, maxWidth: number, maxHeight: number, name: string): Promise<File> {
  if (!ALLOWED_TYPES.has(file.type)) throw new Error("ใช้ภาพ WebP, PNG หรือ JPEG เท่านั้น");
  if (file.size > MAX_COVER_SOURCE_BYTES) throw new Error("ไฟล์ต้นฉบับต้องไม่เกิน 20 MB");

  let image: ImageBitmap;
  try {
    image = await createImageBitmap(file);
  } catch {
    throw new Error("อ่านภาพไม่ได้ กรุณาเลือกไฟล์ภาพอื่น");
  }

  try {
    if (!image.width || !image.height) throw new Error("ขนาดภาพไม่ถูกต้อง");
    const scale = Math.min(1, maxWidth / image.width, maxHeight / image.height);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("เบราว์เซอร์นี้ไม่รองรับการปรับขนาดภาพ");

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingQuality = "high";
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    for (const quality of [0.88, 0.75, 0.6]) {
      const blob = await canvasBlob(canvas, "image/webp", quality);
      if (blob.type === "image/webp" && blob.size <= MAX_COVER_UPLOAD_BYTES) {
        return new File([blob], `${name}.webp`, { type: "image/webp" });
      }
    }

    // Older browsers may not encode WebP; JPEG keeps the same size limit.
    for (const quality of [0.85, 0.7, 0.55]) {
      const blob = await canvasBlob(canvas, "image/jpeg", quality);
      if (blob.type === "image/jpeg" && blob.size <= MAX_COVER_UPLOAD_BYTES) {
        return new File([blob], `${name}.jpg`, { type: "image/jpeg" });
      }
    }
    throw new Error("ภาพที่ย่อแล้วยังใหญ่เกิน 5 MB กรุณาเลือกภาพอื่น");
  } finally {
    image.close();
  }
}

export function prepareCoverImage(file: File): Promise<File> {
  return prepareImage(file, 1200, 1800, "cover");
}

export function prepareBlogImage(file: File): Promise<File> {
  return prepareImage(file, 1600, 1600, "blog-image");
}
