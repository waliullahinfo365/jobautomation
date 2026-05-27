import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { Poppins } from "next/font/google";
import "./globals.css";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-ui",
  display: "swap",
});

export const metadata: Metadata = {
  title:       { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: APP_DESCRIPTION,
  icons: {
    icon: "/brand/logo.jpeg",
    apple: "/brand/logo.jpeg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${poppins.variable} ${poppins.className} min-h-screen bg-background font-sans text-foreground antialiased`}
        style={
          {
            "--font-display": "var(--font-ui)",
            "--font-serif": "var(--font-ui)",
            "--font-mono": "var(--font-ui)",
          } as CSSProperties
        }
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
