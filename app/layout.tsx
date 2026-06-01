import { Inter, Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"

// Inter — all UI chrome (nav labels, badges, buttons, header)
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700"],
})

// Plus Jakarta Sans — content headings, brand moments
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-pjs",
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
      className={cn("dark antialiased", inter.variable, plusJakartaSans.variable)}
      suppressHydrationWarning
    >
      <body className="font-inter text-foreground" style={{
        background: "linear-gradient(45deg, #141137 0%, #191647 100%)",
        minHeight: "100vh",
      }}>
        {children}
      </body>
    </html>
  )
}
