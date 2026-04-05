import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Checklist App",
  description: "Real-time shared checklist app",
};

import NotesSidebar from "@/components/NotesSidebar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistSans.variable}>
      <body className="antialiased text-gray-900 bg-white selection:bg-blue-100 min-h-screen">
        <div className="flex h-screen overflow-hidden">
          {/* Main Content */}
          <main className="flex-1 overflow-y-auto bg-white relative">
            <div className="max-w-4xl mx-auto">
              {children}
            </div>
          </main>

          {/* Persistent Notes Sidebar */}
          <div className="hidden lg:block border-l border-gray-100">
            <NotesSidebar />
          </div>
        </div>
      </body>
    </html>
  );
}
