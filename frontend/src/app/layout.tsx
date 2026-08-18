import type { Metadata } from "next";
import { Outfit, Merriweather } from "next/font/google";
import "./globals.css";
import Fireflies from "./components/Fireflies";

const outfit = Outfit({ 
  subsets: ["latin"],
  variable: "--font-outfit", 
});

const merriweather = Merriweather({ 
  weight: ['300', '400', '700'],
  subsets: ["latin"],
  variable: "--font-merriweather",
});

export const metadata: Metadata = {
  title: "Atlas Studio",
  description: "Interactive Story & World Workspace",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${merriweather.variable}`}>
        <Fireflies />
        {children}
      </body>
    </html>
  );
}
