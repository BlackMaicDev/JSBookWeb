-- ==============================================================================
-- FAMILY JS: ENABLE FULL ADMIN CRUD PERMISSIONS
-- รันโค้ดนี้ใน Supabase SQL Editor เพื่อเปิดสิทธิ์ให้ Admin Panel จัดการข้อมูลได้เต็มรูปแบบ
-- ==============================================================================

-- 1. มอบสิทธิ์ INSERT, UPDATE, DELETE ให้กับ anon และ authenticated
GRANT ALL ON public.books, public.reviews, public.genre_shelf_items, public.blog_posts, public.profiles TO anon, authenticated;

-- 2. สร้าง Policy อนุญาตให้จัดการตารางหนังสือ
DROP POLICY IF EXISTS "allow_all_books" ON public.books;
CREATE POLICY "allow_all_books" ON public.books FOR ALL USING (true) WITH CHECK (true);

-- 3. สร้าง Policy อนุญาตให้จัดการตารางรีวิว
DROP POLICY IF EXISTS "allow_all_reviews" ON public.reviews;
CREATE POLICY "allow_all_reviews" ON public.reviews FOR ALL USING (true) WITH CHECK (true);

-- 4. สร้าง Policy อนุญาตให้จัดการตารางชั้นวางประจำธีม
DROP POLICY IF EXISTS "allow_all_shelf" ON public.genre_shelf_items;
CREATE POLICY "allow_all_shelf" ON public.genre_shelf_items FOR ALL USING (true) WITH CHECK (true);

-- 5. สร้าง Policy อนุญาตให้จัดการตารางบทความบล็อก
DROP POLICY IF EXISTS "allow_all_blog" ON public.blog_posts;
CREATE POLICY "allow_all_blog" ON public.blog_posts FOR ALL USING (true) WITH CHECK (true);
