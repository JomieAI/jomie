"use client"
import { ChevronLeft } from "lucide-react"
import { useRouter } from "next/navigation"

interface PageBackButtonProps {
  href: string
  label: string
}

export function PageBackButton({ href, label }: PageBackButtonProps) {
  const router = useRouter()
  return (
    <button
      onClick={() => router.push(href)}
      className="group flex items-center gap-1.5 cursor-pointer">
      <div className="size-6 rounded-lg flex items-center justify-center transition-colors group-hover:bg-white/15">
        <ChevronLeft size={16} color="#FFFFFF" strokeWidth={1.67} />
      </div>
      <span className="text-[12px] font-light text-white/70 group-hover:text-white/100 transition-opacity">
        {label}
      </span>
    </button>
  )
}
