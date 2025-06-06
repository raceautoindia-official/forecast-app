// app/layout.js  (or src/app/layout.js)

import { Inter } from "next/font/google";
import "./globals.css";
import "bootstrap/dist/css/bootstrap.css";
import "antd/dist/reset.css";

import BootstrapClient from "./components/BootstrapClient";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <BootstrapClient />
        {children}
      </body>
    </html>
  );
}


