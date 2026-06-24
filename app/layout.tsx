import type { Metadata } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Work Progress Platform",
  description: "Internal website work management platform"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
