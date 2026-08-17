import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Fireflies from "./components/Fireflies";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Atlas Studio",
  description: "Interactive Story & World Workspace",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Fireflies />
        {children}
      </body>
    </html>
  );
}
