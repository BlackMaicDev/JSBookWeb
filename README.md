# Family JS

คู่มือขึ้น Vercel: [docs/deploy-vercel.md](docs/deploy-vercel.md) แอปรองรับทั้ง `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` และ `NEXT_PUBLIC_SUPABASE_ANON_KEY` แบบเดิม

นำเข้า Bookshelf Excel: [docs/import-bookshelf-2026-11-24.md](docs/import-bookshelf-2026-11-24.md)

เว็บเรื่องเล่า หนังสือ และชีวิตประจำวัน สร้างด้วย Next.js 16

## เริ่มใช้งาน

```bash
npm install
npm run dev
```

เปิด `http://localhost:3000` เพื่อดูหน้าแรก

## หน้าในเว็บไซต์

- `/` หน้าแรกและทางเข้าหมวดรีวิว
- `/genre/crime`, `/genre/classics`, `/genre/wuxia`, `/genre/romance`, `/genre/manga` รีวิวหนังสือ 5 หมวด
- `/blog` บล็อกทั่วไป แสดงเฉพาะบทความที่เผยแพร่ใน Supabase
- `/login` และ `/admin` เข้าสู่ระบบและจัดการรีวิว/บล็อกผ่าน Supabase

ตั้งค่า `NEXT_PUBLIC_SUPABASE_URL` และ `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (หรือ `NEXT_PUBLIC_SUPABASE_ANON_KEY` แบบเดิม) ใน `.env.local` สำหรับโปรเจกต์ใหม่ให้รัน migration `001` → `004` → `006` → `007` เท่านั้น (`002`/`003` เป็น migration เดโมเก่าที่เปิดสิทธิ์กว้างเกินไป) โปรเจกต์ที่เคยรันแล้วให้ตรวจสิทธิ์ตาม [คู่มือตรวจความปลอดภัย](docs/security-check.md) บัญชีที่จะใช้แอดมินต้องมี `profiles.role` เป็น `editor` หรือ `admin`

ข้อมูลรีวิวหนังสือและบทความอยู่ใน Supabase เท่านั้น ส่วน `lib/genres-data.ts` เก็บรูปแบบธีมของแต่ละหมวด และ `lib/blog-data.ts` เก็บชนิดข้อมูลบทความ

รายละเอียดโครงข้อมูลอยู่ใน [docs/content-foundation.md](docs/content-foundation.md) หน้าเว็บอ่านข้อมูลจาก Supabase เท่านั้น หากหมวดหรือบล็อกยังไม่มีรายการเผยแพร่ จะแสดงหน้าว่าง

ภาพปกอัปโหลดผ่านหน้าแอดมินไปยัง bucket `book-covers` เมื่อใช้ migration `202611230004_secure_covers.sql` แล้ว ฐานข้อมูลเก็บ path ของไฟล์ใน `books.cover_path` หากไม่มีรูป เว็บใช้ปกจำลองเดิม

รูปปกบทความและรูปที่แทรกใน Rich Text ใช้ bucket `book-covers` เดิม รูปปกบทความเก็บ path ใน `blog_posts.sections[0].cover_path` ส่วนรูปในเนื้อหาเก็บ URL ใน HTML ที่ผ่านการกรองก่อนบันทึก ไฟล์จะถูกย่อในเบราว์เซอร์ก่อนอัปโหลด ไม่ต้องสร้าง bucket หรือตารางเพิ่ม
ก่อนอัปโหลด เบราว์เซอร์จะย่อภาพให้ไม่เกิน 1200 × 1800 พิกเซลและแปลงเป็น WebP (หรือ JPEG เมื่อเบราว์เซอร์ไม่รองรับ) โดยไฟล์ที่ส่งไป Storage ต้องไม่เกิน 5 MB
