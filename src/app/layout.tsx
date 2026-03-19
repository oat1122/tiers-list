import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const kanit = Kanit({
  variable: "--font-sans",
  subsets: ["latin", "thai"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tier List",
  description: "Create and share beautiful tier lists",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${kanit.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
