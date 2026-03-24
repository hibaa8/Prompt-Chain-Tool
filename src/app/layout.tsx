import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import Navbar from "./components/Navbar";
import { Toaster } from "react-hot-toast";

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
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Navbar />
          <main className="min-h-screen bg-white dark:bg-gray-950">
            {children}
          </main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
