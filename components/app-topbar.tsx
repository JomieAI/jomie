"use client"

import { LayoutGrid, ChevronDown, Search, HelpCircle } from "lucide-react"

// Primary logo — white text variant (for dark gradient header)
// Icon: #5D5EF4 container, #1C184E sparkle, white J paths + white wordmark
function JomieLogo() {
  return (
    <a href="/" aria-label="Jomie" className="flex items-center" style={{ height: 24 }}>
      {/* Favicon icon at 24×24 */}
      <svg width="24" height="24" viewBox="0 0 74 74" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="4.625" y="4.625" width="64.75" height="64.75" rx="20.0417" fill="#5D5EF4"/>
        <path d="M38.8849 21.522C37.9561 22.451 37.2416 23.5231 36.67 24.6665C35.5268 22.3081 33.5977 20.3785 31.2399 19.235C32.3831 18.6632 33.4548 17.9486 34.3837 17.0195C35.3125 16.0904 36.0984 15.0184 36.67 13.8749C37.2416 15.0184 37.9561 16.0189 38.8849 17.0195C39.8138 17.9486 40.8855 18.7347 42.0287 19.3064C40.8855 19.8067 39.8138 20.5929 38.8849 21.522Z" fill="#1C184E"/>
        <path d="M38.0991 57.0417V35.2439C38.0991 29.3121 42.8861 24.4523 48.8878 24.4523V46.25C48.8878 52.1818 44.0293 57.0417 38.0991 57.0417Z" fill="white"/>
        <path d="M30.0968 56.8269C27.0959 56.8269 24.6667 54.397 24.6667 51.3953C24.6667 48.3937 27.0959 45.9637 30.0968 45.9637C33.0976 45.9637 35.5269 48.3937 35.5269 51.3953C35.5269 54.4684 33.0976 56.8269 30.0968 56.8269Z" fill="white"/>
        <path d="M50.4596 24.4523H48.8877V24.9525H50.4596V24.4523Z" fill="white"/>
      </svg>
      {/* White wordmark — "omie" paths */}
      <svg width="56" height="16" viewBox="0 0 280 82" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-2" aria-hidden="true">
        <path d="M27.8 82C23 82 18.5 80.9 14.5 78.7C10.5 76.4 7.3 73.3 4.9 69.4C2.6 65.4 1.4 60.9 1.4 56C1.4 51.1 2.6 46.6 4.9 42.7C7.3 38.7 10.5 35.6 14.5 33.4C18.5 31.1 23 30 27.8 30C32.7 30 37.1 31.1 41.1 33.4C45.1 35.6 48.3 38.7 50.6 42.7C52.9 46.6 54.1 51.1 54.1 56C54.1 60.9 52.9 65.4 50.6 69.4C48.3 73.3 45.1 76.4 41.1 78.7C37.1 80.9 32.7 82 27.8 82ZM27.8 68.7C30.3 68.7 32.6 68.1 34.6 66.9C36.5 65.6 38 63.8 39.1 61.6C40.3 59.4 40.9 56.9 40.9 56C40.9 54.9 40.3 52.4 39.1 50.3C38 48.1 36.5 46.3 34.6 45.1C32.6 43.8 30.3 43.2 27.8 43.2C25.4 43.2 23.2 43.8 21.2 45.1C19.3 46.3 17.8 48.1 16.6 50.3C15.5 52.4 14.9 54.9 14.9 56C14.9 58.8 15.5 61.3 16.7 63.5C17.9 65.7 19.5 67.5 21.5 68.8C23.4 68.7 25.5 68.7 27.8 68.7Z" fill="white"/>
        <path d="M135.6 40.5C134.1 37.8 132.1 35.7 129.7 34.3C127.2 32.8 124.4 32 121.3 32C117.6 32 114.5 33 112 34.8C110.2 36.1 108.8 37.9 107.5 40.1C106.5 38.2 105.2 36.5 103.4 35.2C100.8 33.3 97.7 32.4 94.2 32.4C90.9 32.4 88 33.2 85.5 34.8C83.8 35.9 82.6 37.5 81.7 39.4V32.3C75.9 32.3 71.2 37.1 71.2 43V81H82.1V53.5C82.1 51.5 82.5 49.8 83.2 48.4C84 46.9 85 45.8 86.3 45.1C87.6 44.3 89.1 43.9 90.8 43.9C92.6 43.9 94.1 44.3 95.4 45.1C96.7 45.8 97.7 46.9 98.5 48.4C99.2 49.8 99.6 51.5 99.6 53.5V81H110.3V53.5C110.3 51.5 110.7 49.8 111.5 48.4C112.3 46.9 113.3 45.8 114.6 45.1C115.9 44.3 117.4 43.9 119.1 43.9C120.9 43.9 122.4 44.3 123.7 45.1C125 45.8 126 46.9 126.8 48.4C127.5 49.8 127.9 51.5 127.9 53.5V81H138.7V49C138.5 45.6 137.6 42.8 135.6 40.5Z" fill="white"/>
        <path d="M193.8 44.5C192.8 41.9 191.3 39.7 189.4 37.9C187.5 36 185.3 34.6 182.7 33.6C180.1 32.6 177.1 32.1 173.9 32.1C169.5 32.1 165.7 33.1 162.4 35.1C159.1 37.1 156.5 39.9 154.6 43.5C152.8 47.1 151.8 51.3 151.8 56C151.8 60.5 152.8 64.6 154.7 68.1C156.6 71.7 159.2 74.5 162.5 76.5C165.8 78.5 169.6 79.5 173.9 79.5C177 79.5 179.9 79.1 182.5 78.2C185.1 77.3 187.4 76 189.3 74.2C191.2 72.4 192.7 70.2 193.7 67.6L184.6 62.9C183.7 64.7 182.4 66.1 180.6 67.2C178.8 68.2 176.7 68.7 174.2 68.7C171.7 68.7 169.5 68.1 167.7 66.9C165.8 65.7 164.3 64 163.3 61.8C162.8 60.5 162.4 59.1 162.3 57.5H194.5C194.7 56.8 194.9 56 195 55.2C195.1 54.4 195.1 53.6 195.1 52.8C195 49.9 194.6 47 193.8 44.5ZM167.8 42.1C169.5 41 171.4 40.4 173.7 40.4C176 40.4 178 41 179.8 42.1C181.5 43.2 182.8 44.8 183.6 46.7C184 47.6 184.1 48.6 184.2 49.7H162.6C162.8 48.6 163 47.7 163.3 46.8C164.2 44.7 165.7 43.1 167.8 42.1Z" fill="white"/>
        <path d="M217.6 81H207V40.7C207 34.7 211.9 29.9 217.8 29.9V81H217.6Z" fill="white"/>
      </svg>
    </a>
  )
}

// Sidebar toggle button — 32×32, #1C184E bg
function SidebarToggle() {
  return (
    <button
      className="flex items-center justify-center rounded-lg"
      style={{
        width: 32, height: 32,
        background: "#1C184E",
        border: "1px solid #1C184E",
        borderRadius: 8,
        boxShadow: "0px 1px 2px rgba(16,24,40,0.05)",
      }}
      aria-label="Toggle sidebar"
    >
      <LayoutGrid size={16} color="white" strokeWidth={1.5} />
    </button>
  )
}

// Icon action button — 40×40, #1C184E bg
function ActionButton({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <button
      className="flex items-center justify-center"
      style={{
        width: 40, height: 40,
        background: "#1C184E",
        border: "1px solid #1C184E",
        borderRadius: 8,
        boxShadow: "0px 1px 2px rgba(16,24,40,0.05)",
        padding: 10,
      }}
      aria-label={label}
    >
      <Icon size={20} color="white" strokeWidth={1.67} />
    </button>
  )
}

export function AppTopbar() {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex flex-row items-center justify-between"
      style={{ height: 64, padding: "0 16px", gap: 10 }}
    >
      {/* LEFT — Logo + sidebar toggle */}
      <div className="flex flex-row items-center gap-4" style={{ width: "157.89px", height: 32 }}>
        <JomieLogo />
        <SidebarToggle />
      </div>

      {/* CENTER — Entity / company switcher (246×40px, rgba white 5%) */}
      <div
        className="flex flex-row items-center gap-[10px] cursor-pointer"
        style={{
          background: "rgba(255,255,255,0.05)",
          borderRadius: 8,
          padding: "8px 16px",
          width: 246,
          height: 40,
        }}
      >
        {/* Company avatar — primary-25 bg, primary-500 initials */}
        <div
          className="flex items-center justify-center rounded-full shrink-0 text-[12px] font-bold"
          style={{
            width: 24, height: 24,
            background: "#F7F7FE",
            color: "#5D5EF4",
            fontFamily: "var(--font-inter)",
          }}
        >
          A
        </div>
        <span
          className="flex-1 truncate"
          style={{ fontSize: 14, fontWeight: 600, color: "#FFFFFF", fontFamily: "var(--font-inter)" }}
        >
          ABC Retails Sdn Bhd
        </span>
        {/* Chevron button */}
        <button
          className="flex items-center justify-center shrink-0"
          style={{
            width: 24, height: 24,
            background: "#1C184E",
            border: "1px solid #1C184E",
            borderRadius: 8,
          }}
          aria-label="Switch company"
        >
          <ChevronDown size={16} color="white" strokeWidth={1.5} />
        </button>
      </div>

      {/* RIGHT — Action buttons (80×40px) */}
      <div className="flex flex-row items-center" style={{ width: 80, height: 40 }}>
        <ActionButton icon={Search} label="Search" />
        <ActionButton icon={HelpCircle} label="Help" />
      </div>
    </header>
  )
}
