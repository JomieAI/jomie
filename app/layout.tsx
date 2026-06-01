import { Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
})

export const metadata = {
  title: "Jomie — AI Financial OS",
  description: "AI-powered financial operating system for finance teams and audit firms.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      // dark class locks dark mode — Jomie is dark-first
      className={cn("dark antialiased", plusJakartaSans.variable)}
      suppressHydrationWarning
    >
      <body className="font-sans bg-background text-foreground">
        {children}
      </body>
    </html>
  )
}
