import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Space Cinema - Cerro Maggiore",
  description: "A custom dashboard and schedule viewer for The Space Cinema - Cerro Maggiore (ID 1016)",
  openGraph: {
    title: "The Space Cinema Viewer",
    description: "Browse the upcoming schedule for The Space Cinema - Cerro Maggiore with this clean, fast dashboard.",
    type: "website",
    locale: "it_IT",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Space Cinema Viewer",
    description: "Browse the upcoming schedule for The Space Cinema - Cerro Maggiore with this clean, fast dashboard.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
