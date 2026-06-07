"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

interface InlineEditableTitleProps {
  value: string
  onSave: (next: string) => void
  className?: string
  inputClassName?: string
  placeholder?: string
  style?: React.CSSProperties
}

export function InlineEditableTitle({
  value,
  onSave,
  className,
  inputClassName,
  placeholder = "Untitled",
  style,
}: InlineEditableTitleProps) {
  const [editing, setEditing] = React.useState(false)
  const [draft,   setDraft]   = React.useState(value)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Sync draft when value changes externally
  React.useEffect(() => {
    if (!editing) setDraft(value)
  }, [value, editing])

  const open = () => {
    setDraft(value)
    setEditing(true)
    // Focus + select-all after render
    requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
  }

  const commit = () => {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== value) onSave(trimmed)
    setEditing(false)
  }

  const cancel = () => {
    setDraft(value)
    setEditing(false)
  }

  if (editing) {
    return (
      <Input
        ref={inputRef}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === "Enter")  { e.preventDefault(); commit() }
          if (e.key === "Escape") { e.preventDefault(); cancel() }
        }}
        placeholder={placeholder}
        className={cn(
          // Match the Claude-style pill input — transparent bg, subtle border, auto-width
          "h-auto py-0.5 px-2 text-inherit font-inherit rounded-md",
          "bg-transparent border border-white/30 focus-visible:border-white/60",
          "focus-visible:ring-0 focus-visible:ring-offset-0",
          "min-w-[8ch] w-auto",
          inputClassName,
        )}
        style={{ width: `${Math.max(draft.length, 8)}ch`, ...style }}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={open}
      style={style}
      className={cn(
        "group flex items-center gap-1.5 rounded-md px-1 -mx-1",
        "hover:bg-white/5 transition-colors cursor-text text-left",
        className,
      )}
    >
      <span className="truncate">{value || placeholder}</span>
      {/* Pencil affordance — fades in on hover */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="12" height="12" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
        className="opacity-0 group-hover:opacity-50 transition-opacity shrink-0 mt-px"
        aria-hidden
      >
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
      </svg>
    </button>
  )
}
