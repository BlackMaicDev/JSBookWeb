# นำเข้า Bookshelf 24 พฤศจิกายน 2026

ไฟล์ [bookshelf_2026-11-24.sql](../supabase/imports/bookshelf_2026-11-24.sql) สร้างจาก `Bookshelf-2026-11-24-fixed.xlsx` จำนวน 178 แถว ใช้สำหรับ Supabase SQL Editor หลังจากมีตารางเว็บจาก migration `001`, `004`, `006`, `007` แล้ว

หากนำเข้าและเผยแพร่หนังสือไปแล้ว แต่หน้าเว็บยังแสดงหนังสือตัวอย่าง ให้รัน [migration 007](../supabase/migrations/202611250007_fix_book_visibility.sql) ใน Supabase SQL Editor ของโปรเจกต์เดียวกับที่เว็บใช้ แล้วรีเฟรชหน้าเว็บ ไม่ต้องนำเข้า Excel ซ้ำ

ไฟล์ SQL มีข้อมูลหนังสือและโน้ตจาก Excel ทั้งชุด จึงถูก `.gitignore` ไม่ให้ติดไปกับ Git/Vercel โดยอัตโนมัติ เก็บไฟล์นี้ไว้ในเครื่องเพื่อรันในฐานข้อมูลจริง

## เลือกประเภท / ตู้หนังสือ

เปิด [bookshelf_cabinet_types.xlsx](../supabase/imports/bookshelf_cabinet_types.xlsx) แล้วแก้คอลัมน์ **Cabinet Type** ของแต่ละเล่ม คอลัมน์นี้มีรายการให้เลือก 5 ตู้ ส่วน **Suggested Cabinet** เป็นเพียงคำแนะนำจาก Tags และไม่เปลี่ยนตามที่เลือก

ตู้ที่เลือกเก็บเป็น `genre_shelf_items.genre_slug` ซึ่งเป็นตัวกำหนดว่าหนังสือไปแสดงในตู้ไหนของเว็บ ส่วน `books` เก็บข้อมูลตัวเล่ม ไม่ได้มีคอลัมน์ `type` แยก

คอลัมน์ `Bookshelf` จากไฟล์ต้นฉบับมีค่าอย่างชื่อสำนักพิมพ์/ชั้นเดิม จึงไม่ได้ใช้แทนประเภทของเว็บอัตโนมัติ

| Cabinet Type ใน Excel | ค่า `genre_slug` ในฐานข้อมูล | ตู้บนเว็บ |
| --- | --- | --- |
| สืบสวน / ระทึกขวัญ | `crime` | สืบสวน |
| วรรณกรรมคลาสสิก | `classics` | คลาสสิก |
| กำลังภายใน | `wuxia` | กำลังภายใน |
| โรแมนซ์ | `romance` | โรแมนซ์ |
| มังงะ | `manga` | มังงะ |

เมื่อเลือกครบแล้ว ให้ **สร้าง SQL ใหม่ก่อนรัน** ด้วยคำสั่งท้ายเอกสาร จากนั้นดูจำนวนแต่ละตู้ที่แสดงในผลลัพธ์คำสั่ง หากรัน SQL ไปแล้ว การแก้ไฟล์ Excel และรัน SQL ซ้ำจะไม่ย้ายรายการเดิมเพื่อรักษาการแก้ไขในเว็บ ให้เปลี่ยนตู้ในหน้า `/admin` แทน

## วิธีรัน

1. ตรวจว่าใน `auth.users` มีบัญชี `dongjs.dev@gmail.com` และใน `public.profiles` บัญชีนี้มี `role = 'admin'` หรือ `'editor'` หากจะให้รีวิวเป็นของบัญชีอื่น ให้แก้ `ADMIN_EMAIL` ใน [ตัวสร้างสคริปต์](../scripts/generate_bookshelf_import.py) แล้วสร้าง SQL ใหม่
2. เลือกตู้ในไฟล์ `bookshelf_cabinet_types.xlsx` แล้วสร้าง SQL ใหม่ด้วยคำสั่งท้ายเอกสาร
3. เปิด Supabase Dashboard → SQL Editor → New query วางเนื้อหา SQL ทั้งไฟล์ แล้วกด Run เพียงครั้งเดียว สคริปต์ใช้ transaction; หากมีข้อผิดพลาด จะยกเลิกการนำเข้าทั้งชุด
4. ผลลัพธ์ท้ายสคริปต์ควรเป็น `imported_source_rows = 178`, `linked_books = 178`, `draft_reviews = 178`
5. เปิด `/admin` เพื่อตรวจตู้ ข้อมูลผู้เขียน คำโปรย และคะแนน ก่อนเปลี่ยนสถานะเป็นเผยแพร่

หาก SQL Editor แจ้ง `Run migration 004` หรือ `Run migration 006` ให้รัน `ROLLBACK;` ก่อน แล้วเปิดไฟล์ [004](../supabase/migrations/202611230004_secure_covers.sql), [006](../supabase/migrations/202611240006_content_permissions.sql) และ [007](../supabase/migrations/202611250007_fix_book_visibility.sql) วางรันใน SQL Editor **ทีละไฟล์ตามลำดับ** จากนั้นรันไฟล์นำเข้าใหม่ Migration เหล่านี้ปรับสิทธิ์และ bucket โดยไม่ลบรายการหนังสือ

## การแมปข้อมูล

| จาก Excel | ไปที่ฐานข้อมูล |
| --- | --- |
| `Book Id` | รหัสนำเข้าคงที่ใน `bookshelf_imports.source_book_id` และรหัสรีวิว `bookshelf-<id>` |
| `ISBN`, `Title`, `Authors`, `Translators`, `Publisher`, `Page Count`, `Description` | `books` โดย `Description` เป็น `synopsis` |
| `My Rating` | `reviews.rating`; 106 เล่มที่ไม่มีคะแนนเก็บเป็น `NULL` |
| `Tags` | `reviews.tags` และใช้เดาหมวดเบื้องต้น |
| คอลัมน์ทั้ง 50 ช่อง รวมวันที่อ่านและ `Short note` | `bookshelf_imports.raw_data` แบบ JSONB |

ไม่มีแถวใดมีข้อความในคอลัมน์ `Review` จึงสร้างรีวิวเป็น **draft** ที่เนื้อหายังว่าง ไม่ใช้ `Short note` เป็นรีวิว เพราะในไฟล์ช่องนี้ส่วนใหญ่เป็นตำแหน่งเก็บหนังสือ เช่น กล่อง 3. ไฟล์ไม่มีภาพปก จึงต้องอัปโหลดเพิ่มในหน้าแอดมินหากต้องการภาพจริง

ค่าเริ่มต้นในไฟล์เลือกตู้เดาจาก `Tags`: 62 เล่มเป็น `crime`, 1 เล่มเป็น `wuxia`; อีก 115 เล่มใช้ `classics` เป็นหมวดพักชั่วคราว ต้องตรวจทานก่อนเผยแพร่ ผู้แต่งที่ว่าง 7 แถวใช้ข้อความ `ไม่ระบุผู้เขียน` ใน `books` โดยค่าต้นฉบับยังอยู่ใน `raw_data`

หนังสือ 31 เล่มไม่มีจำนวนหน้าใน Excel จึงเก็บ `books.page_count` เป็น `NULL` และช่องจำนวนหน้าในหน้าแอดมินจะแสดงว่างเมื่อเปิดแก้ไข

รัน SQL ซ้ำได้โดยไม่เขียนทับหนังสือ รีวิว หรือหมวดที่แก้ในแอดมินแล้ว ระบบจับหนังสือที่มี ISBN เดียวกันเข้ากับแถวเดิม แต่สร้าง draft review จาก `Book Id` สำหรับรายการนำเข้าแต่ละแถว หากมี slug ชนกับข้อมูลอื่น สคริปต์จะหยุดและ rollback

ตัวสร้าง SQL ต้องใช้ Python กับ `openpyxl`:

```text
python scripts/generate_bookshelf_import.py "C:\Users\sorachotj\Downloads\Bookshelf-2026-11-24-fixed.xlsx" supabase/imports/bookshelf_2026-11-24.sql --type-map supabase/imports/bookshelf_cabinet_types.xlsx
```
