import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import LayoutSwitch from "@/components/layout/LayoutSwitch";

export const metadata: Metadata = {
  title: "EnviroConnect — Environmental Compliance Vendor Directory",
  description: "Discover pre-vetted environmental compliance vendors across the Pacific Northwest.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@600;700&family=Source+Sans+3:wght@400;500;600&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Providers>
          <LayoutSwitch>{children}</LayoutSwitch>
        </Providers>
      </body>
    </html>
  );
}
