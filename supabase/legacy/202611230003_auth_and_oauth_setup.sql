-- ==============================================================================
-- FAMILY JS: AUTH & AUTO-CONFIRMATION SETUP
-- 1. ยืนยันอีเมลอัตโนมัติ (ไม่ต้องรอคลิกลิงก์อีเมล)
-- 2. ตั้งค่าสิทธิ์ Admin ให้กับบัญชีผู้ใช้
-- ==============================================================================

-- 1. ยืนยันอีเมลผู้ใช้ทั้งหมดในระบบที่มีอยู่แล้ว
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email_confirmed_at IS NULL;

-- 2. สร้างฟังก์ชันและ Trigger ให้ผู้ใช้ใหม่ที่สมัครผ่านหน้าเว็บได้รับการยืนยันอีเมลทันที
CREATE OR REPLACE FUNCTION public.auto_confirm_new_user()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email_confirmed_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

DROP TRIGGER IF EXISTS trigger_auto_confirm_new_user ON auth.users;
CREATE TRIGGER trigger_auto_confirm_new_user
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_confirm_new_user();

-- 3. อัปเดตโปรไฟล์ของผู้ใช้ทั้งหมดให้เป็นสิทธิ์ admin ในแอพบล็อกนี้
UPDATE public.profiles
SET role = 'admin'
WHERE role != 'admin';

-- 4. ตั้งค่าให้ผู้ใช้ที่สมัครใหม่หรือล็อกอินผ่าน Google ได้สิทธิ์ admin อัตโนมัติ
CREATE OR REPLACE FUNCTION public.create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''), NULLIF(NEW.raw_user_meta_data ->> 'name', ''), 'ผู้ดูแลระบบ'),
    'admin'
  )
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
