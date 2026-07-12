"use client"

import { createContext, useContext, useState } from "react"

interface SidebarContextValue {
  l2Open: boolean
  toggleL2: () => void
  setL2: (open: boolean) => void
}

const SidebarContext = createContext<SidebarContextValue>({
  l2Open: true,
  toggleL2: () => {},
  setL2: () => {},
})

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [l2Open, setL2Open] = useState(true)
  return (
    <SidebarContext.Provider value={{ l2Open, toggleL2: () => setL2Open((v) => !v), setL2: setL2Open }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  return useContext(SidebarContext)
}
