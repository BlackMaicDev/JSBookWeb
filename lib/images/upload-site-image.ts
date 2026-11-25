import { createClient } from "@/lib/supabase/client";
import { prepareBlogImage } from "@/lib/images/prepare-cover";

const BUCKET = "book-covers";

export async function uploadSiteImage(file: File) {
  const prepared = await prepareBlogImage(file);
  const extension = prepared.type === "image/jpeg" ? "jpg" : "webp";
  const path = `books/${crypto.randomUUID()}.${extension}`;
  const storage = createClient().storage.from(BUCKET);
  const { data, error } = await storage.upload(path, prepared, {
    contentType: prepared.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error || !data) {
    if (error && /bucket not found/i.test(error.message)) {
      throw new Error("ยังไม่มี Storage bucket book-covers กรุณารัน migration 202611230004_secure_covers.sql ใน Supabase ก่อนอัปโหลดรูป");
    }
    throw new Error(error?.message || "อัปโหลดภาพไม่สำเร็จ");
  }
  return { path: data.path, url: storage.getPublicUrl(data.path).data.publicUrl };
}
