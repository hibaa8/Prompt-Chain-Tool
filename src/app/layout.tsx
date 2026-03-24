import type { Metadata } from "next";
import "./globals.css";
import RootLayoutClient from "./layout-client";

export const metadata: Metadata = {
  title: "Humor Flavor Manager",
  description: "Manage humor flavors and test caption generation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}
