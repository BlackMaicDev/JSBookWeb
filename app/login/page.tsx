"use client";

import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpenText,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Sparkles,
  Loader2,
} from "lucide-react";
import FamilyLogo from "@/components/FamilyLogo";
import CurrentYear from "@/components/CurrentYear";
import { createClient } from "@/lib/supabase/client";

const SHOW_EXTRA_AUTH_OPTIONS = false;

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

async function hasEditorRole(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  return data?.role === "admin" || data?.role === "editor";
}

export default function LoginPage() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Only editor and admin accounts should open the workspace.
  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!mounted) return;
      if (user && await hasEditorRole(supabase, user.id)) {
        if (!mounted) return;
        router.replace("/admin");
      } else {
        if (!mounted) return;
        if (user) setError("บัญชีที่เข้าสู่ระบบอยู่ยังไม่มีสิทธิ์ editor หรือ admin");
        setCheckingSession(false);
      }
    }).catch(() => { if (mounted) setCheckingSession(false); });

    return () => {
      mounted = false;
    };
  }, [router]);

  // Email/Password Submit
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 6) {
      setError("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      if (isSignUp) {
        // 1. Sign Up with real Supabase Auth
        const { data: signUpData, error: signUpError } =
          await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              data: {
                full_name: fullName.trim() || undefined,
              },
            },
          });

        if (signUpError) {
          setError(signUpError.message || "ไม่สามารถสมัครสมาชิกได้");
          setLoading(false);
          return;
        }

        // New accounts start as readers; role assignment is managed separately.
        if (signUpData.session) {
          if (await hasEditorRole(supabase, signUpData.session.user.id)) router.replace("/admin");
          else setMessage("สร้างบัญชีสำเร็จแล้ว บัญชีนี้ต้องได้รับสิทธิ์ editor หรือ admin ก่อนจึงจะเปิดพื้นที่จัดการได้");
          return;
        }

        // If session not returned directly (e.g. email confirmation turned off just now), auto sign-in immediately!
        const { data: signInData } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInData?.session) {
          if (await hasEditorRole(supabase, signInData.session.user.id)) router.replace("/admin");
          else setMessage("สร้างบัญชีสำเร็จแล้ว บัญชีนี้ต้องได้รับสิทธิ์ editor หรือ admin ก่อนจึงจะเปิดพื้นที่จัดการได้");
          return;
        }

        setMessage("สร้างบัญชีสำเร็จแล้ว หากเปิดการยืนยันอีเมลไว้ กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ");
      } else {
        // Sign In with real Supabase Auth
        const { data, error: signInError } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

        if (signInError) {
          if (signInError.message.includes("Invalid login credentials")) {
            setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบใหม่อีกครั้ง");
          } else if (signInError.message.includes("Email not confirmed")) {
            setError(
              "อีเมลนี้ยังไม่ได้รับการยืนยัน (ให้ปิด Confirm email ใน Supabase Settings)",
            );
          } else {
            setError(signInError.message);
          }
          setLoading(false);
          return;
        }

        if (data?.session) {
          if (await hasEditorRole(supabase, data.session.user.id)) {
            router.replace("/admin");
          } else {
            setError("บัญชีนี้ยังไม่มีสิทธิ์จัดการเนื้อหา กรุณาให้ผู้ดูแลกำหนด role เป็น editor หรือ admin ใน Supabase");
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล");
    } finally {
      setLoading(false);
    }
  }

  // Google OAuth Login
  async function handleGoogleLogin() {
    setError("");
    setMessage("");
    setGoogleLoading(true);

    try {
      const supabase = createClient();
      const redirectUrl = `${window.location.origin}/auth/callback`;

      const { error: oAuthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (oAuthError) {
        throw oAuthError;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(
        msg.includes("provider is not enabled")
          ? "ยังไม่ได้เปิดใช้งาน Google Provider ใน Supabase Dashboard (ไปที่ Authentication -> Providers -> Google)"
          : msg || "ไม่สามารถเข้าสู่ระบบด้วย Google ได้",
      );
      setGoogleLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <div className="workspace admin-loading" style={{ minHeight: "100vh" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <Loader2
            size={32}
            className="animate-spin"
            style={{ color: "#6d4e81" }}
          />
          <p style={{ color: "#756d80", fontSize: "0.95rem" }}>
            กำลังตรวจสอบสถานะการเข้าสู่ระบบ…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace workspace-login">
      <header className="workspace-login-header">
        <Link
          href="/"
          className="workspace-brand"
          aria-label="กลับหน้าแรก Family JS"
        >
          <FamilyLogo />
        </Link>
        <Link href="/" className="workspace-back-link">
          ← กลับไปหน้าแรก
        </Link>
      </header>

      <main className="login-grid">
        {/* Left Story Column */}
        <section className="login-story" aria-label="เกี่ยวกับ Family JS">
          <div className="login-story-copy">
            <p className="workspace-eyebrow">FAMILY JS / AUTHENTICATION</p>
            <h1>
              ทุกเรื่องเล่า
              <br />
              เริ่มจาก
              <br />
              <em>การเปิดหน้าแรก</em>
            </h1>
            <p>
              เข้าสู่ระบบเพื่อจัดการรีวิวหนังสือ คลังบทความ
              และชั้นวางหนังสือประจำธีมของคุณบน Family JS
            </p>
          </div>

          <div className="login-book-scene" aria-hidden="true">
            <span className="login-orbit login-orbit-one" />
            <span className="login-orbit login-orbit-two" />
            <div className="login-book-cover">
              <span>STORIES WE LOVE</span>
              <BookOpenText size={76} strokeWidth={1.1} />
              <strong>
                GOOD STORIES
                <br />
                STAY WITH US.
              </strong>
              <span>FAMILY JS / <CurrentYear /></span>
            </div>
            <span className="login-scene-sparkle">
              <Sparkles size={40} strokeWidth={1.3} />
            </span>
          </div>

          <p className="login-story-footer">READ · REVIEW · REMEMBER</p>
        </section>

        {/* Right Form Column */}
        <section className="login-form-side" aria-labelledby="login-title">
          <div className="login-panel">
            <p className="workspace-eyebrow">
              {isSignUp ? "CREATE NEW ACCOUNT" : "SIGN IN"}
            </p>
            <h2 id="login-title">
              {isSignUp ? "สมัครสมาชิกใหม่" : "เข้าสู่ระบบ"}
            </h2>
            <p className="login-subtitle">
              {isSignUp
                ? "ลงทะเบียนบัญชีจริงผ่าน Supabase เพื่อจัดการเนื้อหาบนเว็บไซต์"
                : "เข้าสู่ระบบเพื่อจัดการรีวิวหนังสือและบทความบล็อก"}
            </p>

            {SHOW_EXTRA_AUTH_OPTIONS && <>
              <div style={{ marginTop: "24px" }}>
                <button type="button" className="login-google-btn" onClick={handleGoogleLogin} disabled={googleLoading || loading}>
                  {googleLoading ? <Loader2 size={18} className="animate-spin" /> : <GoogleIcon />}
                  <span>{googleLoading ? "กำลังเชื่อมต่อไปยัง Google..." : "ดำเนินการต่อด้วย Google"}</span>
                </button>
              </div>
              <div className="login-divider"><span>หรือเข้าสู่ระบบด้วยอีเมล</span></div>
            </>}

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className={`login-form${SHOW_EXTRA_AUTH_OPTIONS ? "" : " login-form-email-only"}`}>
              {isSignUp && (
                <div className="workspace-field">
                  <label htmlFor="login-name">
                    ชื่อที่ใช้แสดง (Display Name)
                  </label>
                  <div className="login-input-wrap">
                    <input
                      id="login-name"
                      type="text"
                      placeholder="เช่น ธนกฤต หรือ แอดมิน"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="workspace-field">
                <label htmlFor="login-email">อีเมล (Email)</label>
                <div className="login-input-wrap">
                  <Mail size={19} aria-hidden="true" />
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="username"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                  />
                </div>
              </div>

              <div className="workspace-field">
                <label htmlFor="login-password">รหัสผ่าน (Password)</label>
                <div className="login-input-wrap">
                  <LockKeyhole size={19} aria-hidden="true" />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={
                      isSignUp ? "new-password" : "current-password"
                    }
                    required
                    placeholder="รหัสผ่านอย่างน้อย 6 ตัวอักษร"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                  />
                  <button
                    type="button"
                    className="login-eye"
                    aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  className="login-error"
                  role="alert"
                  style={{
                    padding: "12px 14px",
                    borderRadius: "12px",
                    background: "#fff1f2",
                    color: "#be123c",
                    fontSize: "0.86rem",
                    border: "1px solid #ffe4e6",
                    lineHeight: "1.5",
                  }}
                >
                  {error}
                </div>
              )}

              {message && (
                <div
                  className="login-success"
                  role="status"
                  style={{
                    padding: "12px 14px",
                    borderRadius: "12px",
                    background: "#f0fdf4",
                    color: "#15803d",
                    fontSize: "0.86rem",
                    border: "1px solid #dcfce7",
                    lineHeight: "1.5",
                  }}
                >
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="workspace-primary-button"
                style={{ width: "100%", marginTop: "6px" }}
              >
                {loading ? (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Loader2 size={18} className="animate-spin" />{" "}
                    กำลังดำเนินการ...
                  </span>
                ) : isSignUp ? (
                  "สร้างบัญชีและสมัครสมาชิก"
                ) : (
                  "เข้าสู่ระบบ"
                )}
              </button>

              {SHOW_EXTRA_AUTH_OPTIONS && <div style={{ textAlign: "center", paddingTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError("");
                    setMessage("");
                  }}
                  style={{
                    background: "none",
                    border: 0,
                    color: "#6d4e81",
                    fontSize: "0.88rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    textDecoration: "underline",
                    textUnderlineOffset: "3px",
                  }}
                >
                  {isSignUp
                    ? "มีบัญชีอยู่แล้ว? คลิกที่นี่เพื่อเข้าสู่ระบบ"
                    : "ยังไม่มีบัญชี? คลิกที่นี่เพื่อสมัครสมาชิกใหม่"}
                </button>
              </div>}
            </form>
          </div>

          <p className="login-side-footer">
            FAMILY JS · เรื่องเล่า หนังสือ และชีวิตประจำวัน
          </p>
        </section>
      </main>
    </div>
  );
}
