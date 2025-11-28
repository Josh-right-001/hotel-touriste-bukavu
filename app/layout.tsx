import type React from "react"
import type { Metadata, Viewport } from "next"
import { Playfair_Display, Inter } from "next/font/google"
import "./globals.css"
import { AppProviders } from "@/lib/contexts"

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" })
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "Hôtel Touriste | Bukavu",
  description: "Application de gestion hôtelière - Hôtel Touriste, Place Mulamba, Bukavu",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-512.png",
  },
    generator: 'v0.app'
}

export const viewport: Viewport = {
  themeColor: "#071428",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="dark">
      <head>
        <link rel="apple-touch-icon" href="/icon-512.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${playfair.variable} ${inter.variable} font-sans antialiased bg-[#071428]`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
