import type { ReactNode } from "react"
import { Textarea } from "@/components/ui/textarea"

interface PageTitleInputProps {
  value: string
  onChange: (value: string) => void
}

/** Borderless, auto-growing title. Enter is blocked so titles stay single-paragraph. */
export function PageTitleInput({ value, onChange }: PageTitleInputProps): ReactNode {
  return (
    <Textarea
      value={value}
      rows={1}
      placeholder="Untitled"
      aria-label="Page title"
      onChange={(event) => onChange(event.target.value.replace(/\s*\n+\s*/g, " "))}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.preventDefault()
      }}
      className="min-h-0 rounded-none border-0 bg-transparent p-0 text-2xl font-bold tracking-tight shadow-none focus-visible:ring-0 sm:text-3xl md:text-3xl"
    />
  )
}
