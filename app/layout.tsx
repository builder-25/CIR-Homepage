import "./globals.css";
import { Inter, Newsreader } from "next/font/google";

export const metadata = {
  title: "Robin",
  description: "Fast internal submissions hub",
};

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const news = Newsreader({
  subsets: ["latin"],
  variable: "--font-serif",
  style: ["normal"],
  weight: ["400", "600", "700"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${news.variable}`}>
      <body>{children}</body>
      <head>
        <link rel="preconnect" href="https://airtable.com" />
        <link rel="preconnect" href="https://static.airtable.com" />
        <link rel="dns-prefetch" href="https://airtable.com" />
      </head>
    </html>
  );
}
