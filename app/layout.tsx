import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flowdesk — Helpdesk nội bộ",
  description: "Quản lý ticket, SLA và hỗ trợ nội bộ tại NovaTech Việt Nam.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
