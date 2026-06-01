"use client"

import { LayoutGrid, ChevronDown, Search, Headphones } from "lucide-react"

// Jomie logo — white text variant for dark header
// Logomark: 40×40 outer container, inner 35×35 #5D5EF4 rounded rect, #1C184E sparkle, white J paths
// Wordmark: white paths
function JomieLogo() {
  return (
    <a href="/" aria-label="Jomie" className="flex items-center no-underline shrink-0"
      style={{ width: "156.49px", height: 40 }}>
      {/* Logomark — 40×40 outer, 35×35 inner */}
      <div className="flex items-center justify-center shrink-0" style={{ width: 40, height: 40 }}>
        <svg width="35" height="35" viewBox="0 0 74 74" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="4.625" y="4.625" width="64.75" height="64.75" rx="20.0417" fill="#5D5EF4"/>
          <path d="M38.8849 21.522C37.9561 22.451 37.2416 23.5231 36.67 24.6665C35.5268 22.3081 33.5977 20.3785 31.2399 19.235C32.3831 18.6632 33.4548 17.9486 34.3837 17.0195C35.3125 16.0904 36.0984 15.0184 36.67 13.8749C37.2416 15.0184 37.9561 16.0189 38.8849 17.0195C39.8138 17.9486 40.8855 18.7347 42.0287 19.3064C40.8855 19.8067 39.8138 20.5929 38.8849 21.522Z" fill="#1C184E"/>
          <path d="M38.0991 57.0417V35.2439C38.0991 29.3121 42.8861 24.4523 48.8878 24.4523V46.25C48.8878 52.1818 44.0293 57.0417 38.0991 57.0417Z" fill="white"/>
          <path d="M30.0968 56.8269C27.0959 56.8269 24.6667 54.397 24.6667 51.3953C24.6667 48.3937 27.0959 45.9637 30.0968 45.9637C33.0976 45.9637 35.5269 48.3937 35.5269 51.3953C35.5269 54.4684 33.0976 56.8269 30.0968 56.8269Z" fill="white"/>
          <path d="M50.4596 24.4523H48.8877V24.9525H50.4596V24.4523Z" fill="white"/>
        </svg>
      </div>
      {/* Wordmark — white, 111.49×22.95px */}
      <svg width="112" height="23" viewBox="0 0 339 82" fill="none" xmlns="http://www.w3.org/2000/svg"
        className="ml-1.5" aria-hidden="true">
        <path d="M27.8 82C23 82 18.5 80.9 14.5 78.7C10.5 76.4 7.3 73.3 4.9 69.4C2.6 65.4 1.4 60.9 1.4 56C1.4 51.1 2.6 46.6 4.9 42.7C7.3 38.7 10.5 35.6 14.5 33.4C18.5 31.1 23 30 27.8 30C32.7 30 37.1 31.1 41.1 33.4C45.1 35.6 48.3 38.7 50.6 42.7C52.9 46.6 54.1 51.1 54.1 56C54.1 60.9 52.9 65.4 50.6 69.4C48.3 73.3 45.1 76.4 41.1 78.7C37.1 80.9 32.7 82 27.8 82ZM27.8 68.7C30.3 68.7 32.6 68.1 34.6 66.9C36.5 65.6 38 63.8 39.1 61.6C40.3 59.4 40.9 56.9 40.9 56C40.9 54.9 40.3 52.4 39.1 50.3C38 48.1 36.5 46.3 34.6 45.1C32.6 43.8 30.3 43.2 27.8 43.2C25.4 43.2 23.2 43.8 21.2 45.1C19.3 46.3 17.8 48.1 16.6 50.3C15.5 52.4 14.9 54.9 14.9 56C14.9 58.8 15.5 61.3 16.7 63.5C17.9 65.7 19.5 67.5 21.5 68.8C23.4 68.7 25.5 68.7 27.8 68.7Z" fill="white"/>
        <path d="M174.6 40.5C173.1 37.8 171.1 35.7 168.7 34.3C166.2 32.8 163.4 32 160.3 32C156.6 32 153.5 33 151 34.8C149.2 36.1 147.8 37.9 146.5 40.1C145.5 38.2 144.2 36.5 142.4 35.2C139.8 33.3 136.7 32.4 133.2 32.4C129.9 32.4 127 33.2 124.5 34.8C122.8 35.9 121.6 37.5 120.7 39.4V32.3C114.9 32.3 110.2 37.1 110.2 43V81H121.1V53.5C121.1 51.5 121.5 49.8 122.2 48.4C123 46.9 124 45.8 125.3 45.1C126.6 44.3 128.1 43.9 129.8 43.9C131.6 43.9 133.1 44.3 134.4 45.1C135.7 45.8 136.7 46.9 137.5 48.4C138.2 49.8 138.6 51.5 138.6 53.5V81H149.3V53.5C149.3 51.5 149.7 49.8 150.5 48.4C151.3 46.9 152.3 45.8 153.6 45.1C154.9 44.3 156.4 43.9 158.1 43.9C159.9 43.9 161.4 44.3 162.7 45.1C164 45.8 165 46.9 165.8 48.4C166.5 49.8 166.9 51.5 166.9 53.5V81H177.7V49C177.5 45.6 176.6 42.8 174.6 40.5Z" fill="white"/>
        <path d="M232.8 44.5C231.8 41.9 230.3 39.7 228.4 37.9C226.5 36 224.3 34.6 221.7 33.6C219.1 32.6 216.1 32.1 212.9 32.1C208.5 32.1 204.7 33.1 201.4 35.1C198.1 37.1 195.5 39.9 193.6 43.5C191.8 47.1 190.8 51.3 190.8 56C190.8 60.5 191.8 64.6 193.7 68.1C195.6 71.7 198.2 74.5 201.5 76.5C204.8 78.5 208.6 79.5 212.9 79.5C216 79.5 218.9 79.1 221.5 78.2C224.1 77.3 226.4 76 228.3 74.2C230.2 72.4 231.7 70.2 232.7 67.6L223.6 62.9C222.7 64.7 221.4 66.1 219.6 67.2C217.8 68.2 215.7 68.7 213.2 68.7C210.7 68.7 208.5 68.1 206.7 66.9C204.8 65.7 203.3 64 202.3 61.8C201.8 60.5 201.4 59.1 201.3 57.5H233.5C233.7 56.8 233.9 56 234 55.2C234.1 54.4 234.1 53.6 234.1 52.8C234 49.9 233.6 47 232.8 44.5ZM206.8 42.1C208.5 41 210.4 40.4 212.7 40.4C215 40.4 217 41 218.8 42.1C220.5 43.2 221.8 44.8 222.6 46.7C223 47.6 223.1 48.6 223.2 49.7H201.6C201.8 48.6 202 47.7 202.3 46.8C203.2 44.7 204.7 43.1 206.8 42.1Z" fill="white"/>
        <path d="M256.6 81H246V40.7C246 34.7 250.9 29.9 256.8 29.9V81H256.6Z" fill="white"/>
        <path d="M338.2 52.3C337.2 49.7 335.7 47.5 333.8 45.7C331.9 43.8 329.7 42.4 327.1 41.4C324.5 40.4 321.5 39.9 318.3 39.9C313.9 39.9 310.1 40.9 306.8 42.9C303.5 44.9 300.9 47.7 299 51.3C297.2 54.9 296.2 59.1 296.2 63.8C296.2 68.3 297.2 72.4 299.1 75.9C301 79.5 303.6 82.3 306.9 84.3C310.2 86.3 314 87.3 318.3 87.3C321.4 87.3 324.3 86.9 326.9 86C329.5 85.1 331.8 83.8 333.7 82C335.6 80.2 337.1 78 338.1 75.4L329 70.7C328.1 72.5 326.8 73.9 325 75C323.2 76 321.1 76.5 318.6 76.5C316.1 76.5 313.9 75.9 312.1 74.7C310.2 73.5 308.7 71.8 307.7 69.6C307.2 68.3 306.8 66.9 306.7 65.3H338.9C339.1 64.6 339.3 63.8 339.4 63C339.5 62.2 339.5 61.4 339.5 60.6C339.4 57.7 339 54.8 338.2 52.3ZM312.2 49.9C313.9 48.8 315.8 48.2 318.1 48.2C320.4 48.2 322.4 48.8 324.2 49.9C325.9 51 327.2 52.6 328 54.5C328.4 55.4 328.5 56.4 328.6 57.5H307C307.2 56.4 307.4 55.5 307.7 54.6C308.6 52.5 310.1 50.9 312.2 49.9Z" fill="white"/>
      </svg>
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
