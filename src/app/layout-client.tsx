"use client";

import { ThemeProvider } from "next-themes";
import Navbar from "./components/Navbar";
import { Toaster } from "react-hot-toast";

export default function RootLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Navbar />
      <main className="min-h-screen bg-white dark:bg-gray-950">
        {children}
      </main>
      <Toaster />
    </ThemeProvider>
  );
}
