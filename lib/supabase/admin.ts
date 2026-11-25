import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function requireEditor() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profileError || !profile || !["admin", "editor"].includes(profile.role)) {
      return NextResponse.json({ success: false, error: "บัญชีนี้ไม่มีสิทธิ์จัดการเนื้อหา" }, { status: 403 });
    }

    return { supabase, userId: user.id, role: profile.role as "admin" | "editor" };
  } catch {
    return NextResponse.json({ success: false, error: "ยังไม่ได้ตั้งค่า Supabase" }, { status: 500 });
  }
}
