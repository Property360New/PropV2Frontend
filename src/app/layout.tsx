import type { Metadata } from "next";
import StoreProvider from "@/store/StoreProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Property 360 CRM",
  description: "Property 360 Degree — Internal CRM Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col" style={{ margin: 0 }}>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
