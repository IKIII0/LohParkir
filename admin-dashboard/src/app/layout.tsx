import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LohParkir — Admin Dashboard | Dishub Kota Medan",
  description: "Sistem Manajemen dan Validasi Parkir Resmi Kota Medan oleh Dinas Perhubungan",
  keywords: ["parkir", "medan", "dishub", "lohparkir", "validasi QR"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={inter.className}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
            },
          }}
        />
      </body>
    </html>
  );
}
