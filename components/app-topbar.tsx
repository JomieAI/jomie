"use client"

import { LayoutGrid, ChevronDown, Search, Headphones } from "lucide-react"

// Jomie logo — favicon icon + Fredoka 700 wordmark
// Brand spec: Fredoka 700 is the ONLY font for the wordmark — never recreate as SVG paths
function JomieLogo() {
  return (
    <a href="/" aria-label="Jomie"
      className="flex items-center gap-1.5 no-underline shrink-0 select-none"
      style={{ height: 40 }}
    >
      {/* Favicon icon — production SVG, 35×35 inner in 40×40 outer */}
      <svg width="35" height="35" viewBox="0 0 74 74" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="4.625" y="4.625" width="64.75" height="64.75" rx="20.0417" fill="#5D5EF4"/>
        <path d="M38.8849 21.522C37.9561 22.451 37.2416 23.5231 36.67 24.6665C35.5268 22.3081 33.5977 20.3785 31.2399 19.235C32.3831 18.6632 33.4548 17.9486 34.3837 17.0195C35.3125 16.0904 36.0984 15.0184 36.67 13.8749C37.2416 15.0184 37.9561 16.0189 38.8849 17.0195C39.8138 17.9486 40.8855 18.7347 42.0287 19.3064C40.8855 19.8067 39.8138 20.5929 38.8849 21.522Z" fill="#1C184E"/>
        <path d="M38.0991 57.0417V35.2439C38.0991 29.3121 42.8861 24.4523 48.8878 24.4523V46.25C48.8878 52.1818 44.0293 57.0417 38.0991 57.0417Z" fill="white"/>
        <path d="M30.0968 56.8269C27.0959 56.8269 24.6667 54.397 24.6667 51.3953C24.6667 48.3937 27.0959 45.9637 30.0968 45.9637C33.0976 45.9637 35.5269 48.3937 35.5269 51.3953C35.5269 54.4684 33.0976 56.8269 30.0968 56.8269Z" fill="white"/>
        <path d="M50.4596 24.4523H48.8877V24.9525H50.4596V24.4523Z" fill="white"/>
      </svg>
      {/* Wordmark — Fredoka 700, white, brand spec font */}
      <span style={{
        fontFamily: "var(--font-fredoka), 'Fredoka', sans-serif",
        fontWeight: 700,
        fontSize: 22,
        color: "#FFFFFF",
        lineHeight: 1,
        letterSpacing: "-0.2px",
      }}>
        Jomie
      </span>
    </a>
  )
}

// Ghost button — no background fill (header actions spec)
function GhostBtn({ icon: Icon, label, size = 40 }: {
  icon: React.ElementType; label: string; size?: number
}) {
  return (
    <button
      aria-label={label}
      className="flex items-center justify-center shrink-0 rounded-lg hover:bg-white/5 transition-colors"
      style={{ width: size, height: size, padding: 10,
        filter: "drop-shadow(0px 1px 2px rgba(16,24,40,0.05))" }}
    >
      <Icon size={20} color="white" strokeWidth={1.67} />
    </button>
  )
}

export function AppTopbar() {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between"
      style={{ height: 64, padding: "0 16px" }}
    >
      {/* LEFT — logo + sidebar toggle + entity switcher */}
      <div className="flex items-center gap-4" style={{ height: 40 }}>
        <JomieLogo />

        {/* Sidebar toggle — ghost, 40×40 */}
        <GhostBtn icon={LayoutGrid} label="Toggle sidebar" />

        {/* Entity / company switcher */}
        <div
          className="flex items-center gap-[10px] cursor-pointer rounded-lg shrink-0"
          style={{ padding: "8px 16px", background: "rgba(255,255,255,0.05)", width: 246, height: 40 }}
        >
          {/* Avatar — primary-25 bg, primary-500 initials */}
          <div className="flex items-center justify-center rounded-full shrink-0"
            style={{ width: 24, height: 24, background: "#F7F7FE",
              fontFamily: "var(--font-inter)", fontSize: 12, fontWeight: 700, color: "#5D5EF4" }}>
            A
          </div>
          <span className="flex-1 truncate"
            style={{ fontFamily: "var(--font-inter)", fontSize: 12, fontWeight: 600, color: "#fff" }}>
            ABC Retails Sdn Bhd
          </span>
          {/* Chevron — ghost, 24×24 */}
          <button className="flex items-center justify-center shrink-0 rounded-lg hover:bg-white/5"
            style={{ width: 24, height: 24, padding: 4,
              filter: "drop-shadow(0px 1px 2px rgba(16,24,40,0.05))" }}
            aria-label="Switch company">
            <ChevronDown size={16} color="white" strokeWidth={1.67} />
          </button>
        </div>
      </div>

      {/* RIGHT — ghost icons + user photo avatar */}
      <div className="flex items-center gap-1" style={{ height: 40 }}>
        <GhostBtn icon={Search} label="Search" />
        <GhostBtn icon={Headphones} label="Support" />
        {/* User photo avatar — 40×40 circle with violet shadow */}
        <div
          className="rounded-full shrink-0 overflow-hidden cursor-pointer"
          style={{
            width: 40, height: 40,
            background: "#F7F7FE",
            boxShadow: "0px 12px 16px -4px rgba(99,86,228,0.08), 0px 4px 6px -2px rgba(99,86,228,0.03)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-inter)", fontSize: 14, fontWeight: 700, color: "#5D5EF4",
          }}
          aria-label="User menu"
        >
          T
        </div>
      </div>
    </header>
  )
}
