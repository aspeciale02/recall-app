import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Recall — AI Study App",
  description: "Upload your lectures. Set your exam date. Recall builds your study plan and tests you with your voice until you're ready.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-[#0a0a0a] text-white">{children}</body>
    </html>
  );
}
