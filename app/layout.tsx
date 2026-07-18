import { Inter, Plus_Jakarta_Sans, Lora } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import AgentationToolbar from "@/components/agentation-toolbar"

// Inter — all UI chrome (nav labels, badges, buttons, header)
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700"],
})

// Lora — editorial serif for AI starter screen headline
const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  weight: ["400", "500", "600", "700"],
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
      className={cn("antialiased", inter.variable, plusJakartaSans.variable, lora.variable, "font-sans", inter.variable)}
      suppressHydrationWarning
    >
      <body className="font-inter text-foreground bg-background" style={{ minHeight: "100vh" }}>
        {children}
        <AgentationToolbar />
      </body>
    </html>
  )
}
