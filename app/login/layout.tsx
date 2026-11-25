import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "เข้าสู่ระบบ | Family JS",
  description: "เข้าสู่พื้นที่จัดการรีวิวหนังสือและบทความของ Family JS",
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
