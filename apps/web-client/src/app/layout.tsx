import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";

const googleSans = localFont({
  src: "../../public/fonts/GoogleSans-Variable.ttf",
  variable: "--font-google-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CMC Network — Kết nối sinh viên, mở rộng tri thức",
  description:
    "Nền tảng mạng xã hội nội bộ dành cho sinh viên CMC University. Chia sẻ kiến thức, giao lưu kết bạn và tham gia các sự kiện thú vị.",
  keywords: ["CMC", "Network", "sinh viên", "mạng xã hội", "đại học"],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CMC Network",
  },
  icons: {
    icon: "/logo.png",
    apple: "/new-logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#3b82f6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${googleSans.variable} h-full antialiased overflow-y-scroll`} suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <meta name="darkreader-lock" content="true" />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
