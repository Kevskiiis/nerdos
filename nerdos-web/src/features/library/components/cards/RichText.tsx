import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface RichTextProps {
  text: string
  className?: string
}

/** Renders card text, turning `backtick` spans into inline code. Newlines are preserved. */
export function RichText({ text, className }: RichTextProps): ReactNode {
  const parts = text.split(/(`[^`\n]+`)/g)

  return (
    <span className={cn("break-words whitespace-pre-wrap", className)}>
      {parts.map((part, index) =>
        part.length > 2 && part.startsWith("`") && part.endsWith("`") ? (
          <code key={index} className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.9em] text-foreground">
            {part.slice(1, -1)}
          </code>
        ) : (
          part
        )
      )}
    </span>
  )
}
