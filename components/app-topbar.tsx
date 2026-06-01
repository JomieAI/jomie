"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bell, Search, Sparkles, ChevronDown, Eye } from "lucide-react"
import { cn } from "@/lib/utils"

function JomieFavicon() {
  return (
    <a href="/" className="select-none" aria-label="Jomie home">
      {/* jomie-favicon.svg — primary-500 #5D5EF4 rounded square, white J paths */}
      <svg width="28" height="28" viewBox="0 0 74 74" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="4.625" y="4.625" width="64.75" height="64.75" rx="20.0417" fill="#5D5EF4"/>
        <path d="M38.8849 21.522C37.9561 22.451 37.2416 23.5231 36.67 24.6665C35.5268 22.3081 33.5977 20.3785 31.2399 19.235C32.3831 18.6632 33.4548 17.9486 34.3837 17.0195C35.3125 16.0904 36.0984 15.0184 36.67 13.8749C37.2416 15.0184 37.9561 16.0189 38.8849 17.0195C39.8138 17.9486 40.8855 18.7347 42.0287 19.3064C40.8855 19.8067 39.8138 20.5929 38.8849 21.522Z" fill="#1C184E"/>
        <path d="M38.0991 57.0417V35.2439C38.0991 29.3121 42.8861 24.4523 48.8878 24.4523V46.25C48.8878 52.1818 44.0293 57.0417 38.0991 57.0417Z" fill="white"/>
        <path d="M30.0968 56.8269C27.0959 56.8269 24.6667 54.397 24.6667 51.3953C24.6667 48.3937 27.0959 45.9637 30.0968 45.9637C33.0976 45.9637 35.5269 48.3937 35.5269 51.3953C35.5269 54.4684 33.0976 56.8269 30.0968 56.8269Z" fill="white"/>
        <path d="M50.4596 24.4523H48.8877V24.9525H50.4596V24.4523Z" fill="white"/>
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
          <div className="size-4 rounded-sm bg-primary/20 flex items-center justify-center flex-shrink-0">
            <span className="text-[7px] font-bold text-accent-foreground">BR</span>
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
