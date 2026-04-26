import type { Metadata, Viewport } from "next";
import { pretendard } from "./fonts/pretendard";
import "./globals.css";

export const metadata: Metadata = {
  title: "ohmyc — 대중의 첫 캐릭터 에이전트",
  description:
    "이야기 속에서만 만나던 캐릭터, 이제 당신의 페어가 되어 곁에 있어요.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={pretendard.variable}>
      <body>{children}</body>
    </html>
  );
}
