import type { Metadata } from "next";
import { Fira_Code, Merriweather, Plus_Jakarta_Sans } from "next/font/google";
import { AppToaster } from "@/components/app-toaster";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-merriweather",
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  variable: "--font-fira-code",
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
      <body
        className={`${plusJakartaSans.variable} ${merriweather.variable} ${firaCode.variable} ${plusJakartaSans.className} antialiased`}
        suppressHydrationWarning
      >
        {children}
        <AppToaster />
      </body>
    </html>
  );
}
