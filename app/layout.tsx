import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import "react-day-picker/dist/style.css"
import { Toaster } from "@/components/ui/sonner"

export const metadata: Metadata = {
  title: "ORD Scorecard",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="download" content="force" />
      </head>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
