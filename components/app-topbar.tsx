"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Bell, Eye, Search, Sparkles, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

// Real Jomie SVG logo paths from brand assets
function JomieLogo() {
  return (
    <a href="/" className="flex items-center gap-2 no-underline">
      {/* Icon mark */}
      <svg width="18" height="30" viewBox="0 0 58 98" fill="none" aria-hidden="true">
        <path d="M32.2185 17.463C30.0363 19.6459 28.3677 21.9572 27.084 24.6537C24.5168 19.2607 20.1526 14.8949 14.7614 12.3268C17.3287 11.0428 19.7675 9.37354 21.9496 7.19066C24.0034 5.00778 25.8004 2.56809 27.084 0C28.3677 2.56809 30.0363 5.00778 32.2185 7.19066C34.2722 9.37354 36.7111 11.0428 39.4067 12.3268C36.7111 13.6109 34.2722 15.2802 32.2185 17.463Z" fill="hsl(var(--primary) / 1)" style={{fill: 'oklch(0.488 0.243 264)'}}/>
        <path d="M30.2931 97.8443V48.4085C30.2931 34.9261 41.2037 24.0117 54.6816 24.0117V73.4475C54.8099 86.9299 43.7709 97.8443 30.2931 97.8443Z" fill="oklch(0.488 0.243 264)"/>
        <path d="M12.1942 97.5875C5.5195 97.5875 0 92.0661 0 85.2607C0 78.4553 5.5195 73.0623 12.1942 73.0623C18.9973 73.0623 24.3885 78.5837 24.3885 85.2607C24.5168 92.0661 18.9973 97.5875 12.1942 97.5875Z" fill="oklch(0.488 0.243 264)"/>
        <path d="M57.5941 24H54V25.1556H57.5941V24Z" fill="oklch(0.488 0.243 264)"/>
      </svg>
      {/* Wordmark */}
      <svg width="66" height="19" viewBox="0 0 339 99" fill="none" aria-label="Jomie">
        <path d="M99.4794 99C93.4464 99 87.7986 97.5875 82.7925 94.7626C77.7864 91.8093 73.8073 87.9572 70.855 83.0778C67.7743 78.1984 66.3624 72.5486 66.3624 66.2568C66.3624 59.965 67.9027 54.3152 70.855 49.4358C73.8073 44.5564 77.7864 40.7043 82.7925 37.751C87.7986 34.9261 93.4464 33.3852 99.4794 33.3852C105.769 33.3852 111.289 34.7977 116.295 37.6226C121.301 40.4475 125.28 44.2996 128.232 49.179C131.184 54.0584 132.725 59.7082 132.725 66.1284C132.725 72.4202 131.184 78.07 128.232 82.9494C125.28 87.9572 121.301 91.8093 116.295 94.7626C111.289 97.5875 105.641 99 99.4794 99ZM99.4794 85.1323C102.945 85.1323 105.897 84.3619 108.593 82.6926C111.16 81.0233 113.214 78.8405 114.754 75.8871C116.295 72.9338 117.065 69.7237 117.065 66.1284C117.065 62.5331 116.295 59.323 114.754 56.3696C113.214 53.6731 111.16 51.4903 108.593 49.821C106.026 48.1517 102.945 47.3813 99.4794 47.3813C96.142 47.3813 93.0613 48.1517 90.4941 49.821C87.9269 51.4903 85.8732 53.6731 84.3328 56.4981C82.9209 59.323 82.1507 62.5331 82.1507 66.2568C82.1507 69.8521 82.9209 73.0623 84.4612 76.0156C86.0015 78.8405 88.0553 81.1517 90.6225 82.821C93.1897 84.3619 96.142 85.1323 99.4794 85.1323Z" fill="currentColor"/>
        <path d="M235.028 44.8132C232.974 41.2179 230.279 38.393 226.813 36.4669C223.347 34.5409 219.368 33.5136 214.875 33.5136C209.741 33.3852 205.377 34.6693 201.526 37.2374C198.959 38.9066 197.033 41.3463 195.236 44.1712C193.824 41.6031 192.027 39.4202 189.46 37.6226C185.609 34.7977 181.117 33.3852 175.854 33.3852C171.105 33.3852 167.125 34.5409 163.66 36.7237C161.221 38.2646 159.68 40.5759 158.397 43.2724V34.7977C150.438 34.7977 144.149 41.2179 144.149 49.0506V97.5875H159.424V60.7354C159.424 57.9105 159.937 55.5992 160.964 53.5447C161.991 51.6187 163.403 49.9494 165.2 48.9222C166.997 47.8949 169.179 47.2529 171.49 47.2529C173.928 47.2529 176.111 47.7665 177.908 48.9222C179.705 49.9494 181.117 51.4903 182.144 53.5447C183.17 55.5992 183.684 57.9105 183.684 60.7354V97.5875H198.83V60.7354C198.83 57.9105 199.344 55.5992 200.371 53.5447C201.398 51.6187 202.81 49.9494 204.607 48.9222C206.404 47.8949 208.586 47.2529 210.896 47.2529C213.335 47.2529 215.517 47.7665 217.314 48.9222C219.111 49.9494 220.523 51.4903 221.55 53.5447C222.577 55.5992 223.09 57.9105 223.09 60.7354V97.5875H238.237V57.2685C237.98 52.5175 236.953 48.4086 235.028 44.8132Z" fill="currentColor"/>
        <path d="M336.946 52.2607C335.534 48.537 333.609 45.3268 330.913 42.5019C328.346 39.677 325.137 37.4942 321.415 35.8249C317.692 34.1556 313.328 33.3852 308.45 33.3852C302.546 33.3852 297.283 34.7977 292.534 37.6226C287.784 40.4475 284.062 44.2996 281.366 49.179C278.542 54.1868 277.259 59.8366 277.259 66.1284C277.259 72.1634 278.542 77.8132 281.238 82.6926C283.933 87.7004 287.656 91.6809 292.534 94.6342C297.411 97.5875 303.059 99 309.606 99C313.841 99 317.821 98.358 321.415 97.0739C325.009 95.7899 328.089 93.9922 330.785 91.6809C333.352 89.3696 335.278 86.6731 336.561 83.7198L324.367 77.6848C322.955 80.1245 321.03 82.0506 318.591 83.5914C316.152 85.0039 313.2 85.7743 309.734 85.7743C306.268 85.7743 303.187 85.0039 300.62 83.3346C297.925 81.6654 295.999 79.4825 294.587 76.5292C293.817 74.7315 293.304 72.8054 293.175 70.6226H338.23C338.487 69.7237 338.743 68.6965 338.872 67.5409C339 66.3852 339 65.358 339 64.2023C339 59.965 338.358 55.9844 336.946 52.2607ZM300.107 48.2802C302.546 46.6109 305.37 45.8405 308.579 45.8405C311.916 45.8405 314.74 46.6109 317.05 48.2802C319.361 49.9494 321.03 52.1323 322.185 54.8288C322.698 56.1128 322.827 57.3969 322.955 58.8093H293.56C293.817 57.5253 294.074 56.2412 294.587 55.0856C295.743 52.2607 297.54 49.9494 300.107 48.2802Z" fill="currentColor"/>
        <path d="M266.861 97.716H251.587V50.0778C251.587 41.6031 258.39 34.7977 266.861 34.7977V97.716Z" fill="currentColor"/>
      </svg>
    </a>
  )
}

export function AppTopbar() {
  return (
    <header className="flex h-13 shrink-0 items-center gap-2 border-b border-border bg-sidebar px-4 relative z-50">
      {/* Left zone */}
      <div className="flex flex-1 items-center gap-2">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
        <Separator orientation="vertical" className="h-4 opacity-30" />
        {/* Entity switcher */}
        <button className="flex items-center gap-2 rounded-md border border-border/60 bg-white/[0.03] px-2.5 py-1.5 text-left transition-colors hover:bg-white/[0.06]">
          <div>
            <div className="text-xs font-semibold text-foreground/80 leading-none">Berjaya Retail Sdn Bhd</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Ahmad Zaki &amp; Associates · MYR</div>
          </div>
          <ChevronDown size={11} className="text-muted-foreground ml-1" />
        </button>
      </div>

      {/* Centre — logo */}
      <div className="absolute left-1/2 -translate-x-1/2 text-foreground">
        <JomieLogo />
      </div>

      {/* Right zone */}
      <div className="flex flex-1 items-center justify-end gap-1.5">
        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" aria-label="Hide figures">
          <Eye size={15} />
        </Button>
        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" aria-label="Search">
          <Search size={15} />
        </Button>
        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground relative" aria-label="Notifications">
          <Bell size={15} />
          <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-destructive border border-sidebar" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 rounded-md border border-primary/25 bg-primary/8 text-[11px] font-semibold text-primary/90 hover:bg-primary/15 hover:text-primary px-3 h-7"
        >
          <Sparkles size={11} />
          Ask Jomie
        </Button>
        <Avatar className="size-7 border border-primary">
          <AvatarFallback className="text-[10px] font-bold bg-primary/20 text-primary">LW</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
