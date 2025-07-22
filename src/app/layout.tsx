import { Inter } from "next/font/google";
import "./globals.css";
import { Metadata } from "next";
import ClientLayout from "@/components/clientLayout";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AAA Dashboard",
  description: "AAA is an international school providing skills in robotics and coding.",
  icons: {
    icon: "/AAA logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head></head>
      <body className={inter.className}>
        <ClientLayout>{children}</ClientLayout> 
      </body>
    </html>
  );
}21