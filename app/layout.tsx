import { Inter, Plus_Jakarta_Sans, Lora, Figtree } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import AgentationToolbar from "@/components/agentation-toolbar"

// Preset fonts (bPuhec5Mm): Inter heading + Figtree body
const interHeading = Inter({ subsets: ["latin"], variable: "--font-heading", weight: ["400", "500", "600", "700"] })
const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans", weight: ["300", "400", "500", "600", "700", "800"] })

// Jomie brand fonts
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", weight: ["300", "400", "500", "600", "700"] })
const lora = Lora({ subsets: ["latin"], variable: "--font-lora", weight: ["400", "500", "600", "700"] })
const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-pjs", weight: ["400", "500", "600", "700", "800"] })

export const metadata = {
  title: "Jomie — AI Financial OS",
  description: "AI-powered financial operating system for finance teams and audit firms.",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={cn("antialiased", figtree.variable, interHeading.variable, inter.variable, plusJakartaSans.variable, lora.variable)}
      suppressHydrationWarning
    >
      <body className="text-foreground bg-background" style={{ minHeight: "100vh" }}>
        {children}
        <AgentationToolbar />
      </body>
    </html>
  )
}
