import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

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
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          forcedTheme="light"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster
            theme="light"
            position="top-right"
            richColors
            closeButton
            duration={4000}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
