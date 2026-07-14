import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Family Chore Hub",
  description:
    "A private family schedule, chores, and rewards app for fair daily planning.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
