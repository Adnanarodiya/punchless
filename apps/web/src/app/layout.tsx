import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppToaster } from "@/components/app-toaster";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Punchless — Workshop Attendance SaaS",
  description:
    "Automatic GPS-based attendance, job tracking & salary management for workshops",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        {children}
        <AppToaster />
      </body>
    </html>
  );
}
