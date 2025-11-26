import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PflegeQuiz - Teste dein Wissen zur Pflegeversicherung",
  description: "Ein interaktives Quiz-Spiel zum Thema Pflegeversicherung. Perfekt für Schulungen, Seminare und Selbstlernen.",
  keywords: ["Pflegeversicherung", "Quiz", "Lernen", "Ausbildung", "Pflege"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={`${inter.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
