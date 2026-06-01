"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bell, Search, Sparkles, ChevronDown, Eye } from "lucide-react"
import { cn } from "@/lib/utils"

function JomieFavicon() {
  return (
    <a href="/" className="select-none" aria-label="Jomie home">
      {/* Favicon / app icon variant — navy rounded square + blue J mark */}
      <svg width="28" height="28" viewBox="0 0 99 99" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M79.0457 99H19.8168C8.85666 99 0 90.0302 0 79.0671V19.8221C0 8.85906 8.85666 0 19.8168 0H79.0457C90.0059 0 98.8625 8.85906 98.8625 19.8221V79.0671C98.9732 90.0302 90.0059 99 79.0457 99Z" fill="#0A1628"/>
        <path d="M50.1508 26.0235C48.7116 27.4631 47.6046 29.1242 46.7189 30.896C44.9476 27.2416 41.9584 24.2517 38.3051 22.4799C40.0764 21.594 41.737 20.4866 43.1762 19.047C44.6154 17.6074 45.8332 15.9463 46.7189 14.1745C47.6046 15.9463 48.7116 17.4966 50.1508 19.047C51.5901 20.4866 53.2507 21.7047 55.022 22.5906C53.2507 23.3658 51.5901 24.5839 50.1508 26.0235Z" fill="#2563EB"/>
        <path d="M48.9331 81.0604V47.2852C48.9331 38.094 56.3505 30.5638 65.65 30.5638V64.3389C65.65 73.5302 58.1219 81.0604 48.9331 81.0604Z" fill="#2563EB"/>
        <path d="M36.5337 80.7282C31.884 80.7282 28.1199 76.9631 28.1199 72.3121C28.1199 67.6611 31.884 63.896 36.5337 63.896C41.1835 63.896 44.9476 67.6611 44.9476 72.3121C44.9476 77.0738 41.1835 80.7282 36.5337 80.7282Z" fill="#2563EB"/>
        <path d="M68.0856 30.5638H65.65V31.3389H68.0856V30.5638Z" fill="#2563EB"/>
      </svg>
    </a>
  )
}

export function AppTopbar() {
  return (
    <header className="flex h-11 shrink-0 items-center border-b border-border bg-background px-3 gap-3 relative z-50">

      {/* Left */}
      <div className="flex items-center gap-2 flex-1">
        <SidebarTrigger className="size-7 text-muted-foreground/60 hover:text-muted-foreground transition-colors" />

        {/* Entity */}
        <button className="flex items-center gap-2 rounded px-2 py-1 text-left hover:bg-white/[0.04] transition-colors group">
          <div className="size-4 rounded-sm bg-primary/15 flex items-center justify-center flex-shrink-0">
            <span className="text-[7px] font-bold text-primary">BR</span>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-foreground/80 leading-none">Berjaya Retail</div>
            <div className="text-[9px] text-muted-foreground leading-none mt-0.5">AZA · MYR · 14 entities</div>
          </div>
          <ChevronDown size={10} className="text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
        </button>

        {/* Module breadcrumb */}
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground/40 ml-1">
          <span>P2P Agent</span>
          <span>/</span>
          <span className="text-muted-foreground/70">Purchase Requests</span>
        </div>
      </div>

      {/* Centre — favicon icon only */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <JomieFavicon />
      </div>

      {/* Right */}
      <div className="flex items-center gap-1 ml-auto">
        {/* Search */}
        <button className="flex items-center gap-2 rounded px-2.5 py-1 border border-border/60 bg-white/[0.02] hover:bg-white/[0.04] transition-colors group" aria-label="Search">
          <Search size={12} className="text-muted-foreground/50" />
          <span className="text-[11px] text-muted-foreground/40">Search</span>
          <kbd className="text-[9px] text-muted-foreground/30 font-mono bg-white/[0.04] border border-border/40 rounded px-1">⌘K</kbd>
        </button>

        {/* Eye */}
        <button className="size-7 flex items-center justify-center rounded hover:bg-white/[0.04] text-muted-foreground/50 hover:text-muted-foreground transition-colors" aria-label="Hide figures">
          <Eye size={13} />
        </button>

        {/* Notifications */}
        <button className="size-7 flex items-center justify-center rounded hover:bg-white/[0.04] text-muted-foreground/50 hover:text-muted-foreground transition-colors relative" aria-label="Notifications">
          <Bell size={13} />
          <span className="absolute top-1 right-1 size-1.5 rounded-full bg-warning" />
        </button>

        {/* Ask Jomie — command prompt style */}
        <button className="flex items-center gap-1.5 rounded px-2.5 py-1 bg-primary/8 border border-primary/20 hover:bg-primary/12 transition-colors group">
          <Sparkles size={11} className="text-primary/70 group-hover:text-primary transition-colors" />
          <span className="text-[11px] font-medium text-primary/70 group-hover:text-primary transition-colors">Ask Jomie</span>
        </button>

        {/* Avatar */}
        <Avatar className="size-6 border border-border ml-1 cursor-pointer">
          <AvatarFallback className="text-[9px] font-bold bg-primary/10 text-primary/80">LW</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
