"use client"

import { PanelLeft, ChevronDown, Search, Headphones, User, RefreshCcw, LogOut, Settings } from "lucide-react"
import { useSidebar } from "@/components/sidebar-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// jomie-primary-logo-white-text.svg — production asset, exact paths from H:\My Drive\Jomie\Product\
// 318×76px source, scaled to 40px height in header (width ~166px)
function JomieLogo() {
  return (
    <a href="/" aria-label="Jomie" className="flex items-center no-underline shrink-0 select-none"
      style={{ height: 40 }}>
      <svg
        width="166" height="40"
        viewBox="0 0 318 76"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Jomie"
      >
        {/* Icon mark — #5D5EF4 container, #1C184E sparkle, white J paths */}
        <rect x="4.75" y="4.75" width="66.5" height="66.5" rx="20.5833" fill="#5D5EF4"/>
        <path d="M39.9359 22.1038C38.9819 23.0579 38.2481 24.1589 37.6611 25.3333C36.487 22.9111 34.5058 20.9294 32.0842 19.755C33.2583 19.1678 34.359 18.4338 35.313 17.4796C36.2669 16.5254 37.0741 15.4244 37.6611 14.25C38.2481 15.4244 38.9819 16.452 39.9359 17.4796C40.8898 18.4338 41.9905 19.2412 43.1646 19.8284C41.9905 20.3422 40.8898 21.1496 39.9359 22.1038Z" fill="#1C184E"/>
        <path d="M39.1288 58.5834V36.1965C39.1288 30.1043 44.0452 25.1132 50.2091 25.1132V47.5C50.2091 53.5922 45.2193 58.5834 39.1288 58.5834Z" fill="white"/>
        <path d="M30.9102 58.3628C27.8283 58.3628 25.3333 55.8672 25.3333 52.7844C25.3333 49.7016 27.8283 47.2061 30.9102 47.2061C33.9921 47.2061 36.4871 49.7016 36.4871 52.7844C36.4871 55.9406 33.9921 58.3628 30.9102 58.3628Z" fill="white"/>
        <path d="M51.8233 25.1132H50.209V25.627H51.8233V25.1132Z" fill="white"/>
        {/* Wordmark — J o m i e — white vector paths */}
        <g clipPath="url(#wt)">
          <path d="M96.9221 41.5601C96.9221 43.9336 96.1804 45.7878 94.697 47.197C93.2136 48.6062 91.2852 49.3479 88.8376 49.3479H85.5V58.9158H88.9118C92.6944 58.9158 95.9579 58.1741 98.7763 56.6907C101.595 55.2073 103.746 53.1306 105.229 50.4605C106.712 47.7904 107.528 44.6753 107.528 41.1893V17.0842C101.743 17.0842 96.9963 21.8311 96.9963 27.6163V41.5601H96.9221Z" fill="white"/>
          <path d="M149.063 19.0127C145.726 17.1584 141.943 16.1942 137.79 16.1942C133.71 16.1942 130.002 17.1584 126.664 19.0127C123.326 20.9411 120.656 23.537 118.654 26.8004C116.651 30.0639 115.687 33.8465 115.687 38C115.687 42.1535 116.651 45.9362 118.654 49.1996C120.656 52.5372 123.401 55.1332 126.738 56.9874C130.076 58.9158 133.784 59.8058 137.864 59.8058C141.943 59.8058 145.651 58.8416 148.989 56.9874C152.253 55.1332 154.923 52.5372 156.925 49.1996C158.928 45.9362 159.892 42.1535 159.892 38C159.892 33.7724 158.928 29.9897 156.925 26.7263C154.923 23.4628 152.401 20.9411 149.063 19.0127ZM147.951 44.5269C146.912 46.4553 145.577 47.9387 143.871 48.9771C142.166 50.0897 140.163 50.6088 137.864 50.6088C135.639 50.6088 133.636 50.0897 131.856 48.9771C130.076 47.9387 128.741 46.4553 127.702 44.5269C126.738 42.5985 126.219 40.4476 126.219 38C126.219 35.6266 126.738 33.4757 127.702 31.5473C128.667 29.6189 130.076 28.1355 131.782 27.0971C133.488 25.9846 135.49 25.4654 137.79 25.4654C140.089 25.4654 142.091 25.9846 143.797 27.0971C145.503 28.2097 146.838 29.6931 147.877 31.5473C148.915 33.4015 149.36 35.6266 149.36 38C149.434 40.4476 148.915 42.5985 147.951 44.5269Z" fill="white"/>
          <path d="M222.491 18.1968C220.192 16.8617 217.522 16.1942 214.555 16.1942C211.217 16.1942 208.25 17.0101 205.729 18.716C204.023 19.8285 202.688 21.4602 201.575 23.3145C200.685 21.6086 199.498 20.1252 197.718 18.9385C195.122 17.0842 192.081 16.1942 188.67 16.1942C185.554 16.1942 182.81 16.9359 180.511 18.4193C178.953 19.4577 177.841 20.9411 176.951 22.7211V17.0842C171.685 17.0842 167.457 21.3861 167.457 26.5779V58.8416H177.618V34.3657C177.618 32.5115 177.989 30.9539 178.583 29.6189C179.25 28.2838 180.214 27.2455 181.401 26.5779C182.662 25.8362 184.071 25.4654 185.629 25.4654C187.26 25.4654 188.67 25.8362 189.856 26.5779C191.043 27.3196 192.007 28.2838 192.675 29.6189C193.342 30.9539 193.639 32.5115 193.639 34.3657V58.8416H203.726V34.3657C203.726 32.5115 204.023 30.9539 204.69 29.6189C205.358 28.2838 206.322 27.2455 207.509 26.5779C208.77 25.8362 210.179 25.4654 211.736 25.4654C213.368 25.4654 214.777 25.8362 216.038 26.5779C217.225 27.3196 218.189 28.2838 218.857 29.6189C219.524 30.9539 219.821 32.5115 219.821 34.3657V58.8416H229.908V31.9923C229.908 28.8772 229.24 26.1329 227.905 23.7595C226.719 21.3861 224.864 19.5318 222.491 18.1968Z" fill="white"/>
          <path d="M238.437 58.9158H248.599V17.0842C243.036 17.0842 238.437 21.6086 238.437 27.2454V58.9158Z" fill="white"/>
          <path d="M295.919 28.7289C295.029 26.2813 293.694 24.1303 291.914 22.2019C290.134 20.2735 288.057 18.7901 285.609 17.7518C283.162 16.7134 280.195 16.1942 276.931 16.1942C273 16.1942 269.44 17.1584 266.325 19.0127C263.21 20.9411 260.688 23.4628 258.908 26.7263C257.054 29.9897 256.164 33.6982 256.164 37.9259C256.164 42.0052 257.054 45.6395 258.834 48.9771C260.614 52.3147 263.136 54.9107 266.399 56.9132C269.663 58.8416 273.445 59.8058 277.747 59.8058C280.566 59.8058 283.162 59.3608 285.609 58.4708C287.983 57.5808 290.059 56.3941 291.839 54.8365C293.62 53.2789 294.88 51.4989 295.696 49.4963L287.538 45.4911C286.648 47.1229 285.313 48.4579 283.755 49.4221C282.123 50.3863 280.195 50.9055 277.896 50.9055C275.596 50.9055 273.52 50.3863 271.814 49.2738C270.034 48.1612 268.699 46.6779 267.809 44.6753C267.289 43.4886 266.993 42.1535 266.844 40.8185H296.883C297.105 40.2251 297.254 39.5576 297.328 38.8159C297.402 38.0742 297.476 37.3325 297.476 36.5166C297.328 33.8465 296.883 31.1764 295.919 28.7289ZM266.993 33.179C267.141 32.289 267.364 31.4731 267.66 30.7314C268.476 28.7289 269.737 27.1713 271.369 26.1329C273 25.0204 274.855 24.5012 277.006 24.5012C279.231 24.5012 281.085 25.0204 282.642 26.1329C284.2 27.2455 285.313 28.6547 286.054 30.5089C286.351 31.3248 286.499 32.289 286.573 33.179H266.993Z" fill="white"/>
        </g>
        <defs>
          <clipPath id="wt">
            <rect width="211.828" height="43.6116" fill="white" transform="translate(85.5 16.1942)"/>
          </clipPath>
        </defs>
      </svg>
    </a>
  )
}

// Ghost button — no background fill (header actions spec)
function GhostBtn({ icon: Icon, label, size = 40, onClick, active = false }: {
  icon: React.ElementType; label: string; size?: number
  onClick?: () => void; active?: boolean
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className="flex items-center justify-center shrink-0 rounded-lg transition-colors hover:bg-white/5 active:bg-white/10"
      style={{
        width: size, height: size, padding: 10, border: "none", cursor: "pointer",
        background: active ? "rgba(255,255,255,0.08)" : "transparent",
        filter: "drop-shadow(0px 1px 2px rgba(16,24,40,0.05))",
      }}
    >
      <Icon size={20} color="white" strokeWidth={1.67} />
    </button>
  )
}

export function AppTopbar() {
  const { l2Open, toggleL2 } = useSidebar()

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between"
      style={{ height: 64, padding: "0 16px" }}
    >
      {/* LEFT — logo + sidebar toggle + entity switcher */}
      <div className="flex items-center gap-4" style={{ height: 40 }}>
        <JomieLogo />

        {/* L2 collapse/expand — same GhostBtn style, active when L2 is closed */}
        <GhostBtn icon={PanelLeft} label="Toggle navigation panel" onClick={toggleL2} active={!l2Open} />

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

      {/* RIGHT — ghost icons + user avatar with dropdown */}
      <div className="flex items-center gap-1" style={{ height: 40 }}>
        <GhostBtn icon={Search} label="Search" />
        <GhostBtn icon={Headphones} label="Support" />

        <DropdownMenu>
          {/* Trigger — avatar button rendered directly by the primitive */}
          <DropdownMenuTrigger
            aria-label="User menu"
            className="flex items-center justify-center rounded-full shrink-0 transition-all hover:ring-2 hover:ring-white/20 focus:outline-none"
            style={{
              width: 32, height: 32, marginLeft: 4,
              background: "#F7F7FE", border: "none", cursor: "pointer",
              fontFamily: "var(--font-inter)", fontSize: 12, fontWeight: 700, color: "#5D5EF4",
              boxShadow: "0px 4px 8px -2px rgba(99,86,228,0.15)",
            }}
          >
            T
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-52 p-0 overflow-hidden"
            style={{
              background: "#101828",
              border: "0.5px solid rgba(255,255,255,0.1)",
              borderRadius: 10,
              boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
            }}
          >
            {/* User info header — plain div, not a menu item */}
            <div style={{ padding: "10px 12px 8px", borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#fff", fontFamily: "var(--font-inter)" }}>Thony</p>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-inter)" }}>thony@jurifytepro.com</p>
            </div>

            <div style={{ padding: "4px" }}>
              <DropdownMenuItem
                className="flex items-center gap-2 rounded-lg cursor-pointer"
                style={{ padding: "8px 10px", fontSize: 13, fontWeight: 500, color: "#fff", fontFamily: "var(--font-inter)" }}
                onClick={() => { window.location.href = "/settings/profile" }}
              >
                <User size={14} strokeWidth={1.6} />
                Profile
              </DropdownMenuItem>

              <DropdownMenuItem
                className="flex items-center gap-2 rounded-lg cursor-pointer"
                style={{ padding: "8px 10px", fontSize: 13, fontWeight: 500, color: "#fff", fontFamily: "var(--font-inter)" }}
                onClick={() => { window.location.href = "/settings/company" }}
              >
                <RefreshCcw size={14} strokeWidth={1.6} />
                Switch Entity
              </DropdownMenuItem>

              <DropdownMenuItem
                className="flex items-center gap-2 rounded-lg cursor-pointer"
                style={{ padding: "8px 10px", fontSize: 13, fontWeight: 500, color: "#fff", fontFamily: "var(--font-inter)" }}
                onClick={() => { window.location.href = "/settings" }}
              >
                <Settings size={14} strokeWidth={1.6} />
                Settings
              </DropdownMenuItem>

              <DropdownMenuSeparator style={{ background: "rgba(255,255,255,0.08)", margin: "4px 0" }} />

              <DropdownMenuItem
                className="flex items-center gap-2 rounded-lg cursor-pointer"
                style={{ padding: "8px 10px", fontSize: 13, fontWeight: 500, color: "#F87171", fontFamily: "var(--font-inter)" }}
                onClick={() => { window.location.href = "/logout" }}
              >
                <LogOut size={14} strokeWidth={1.6} />
                Sign Out
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
