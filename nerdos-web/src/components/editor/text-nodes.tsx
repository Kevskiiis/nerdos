import type { ReactNode } from "react"
import { LightbulbIcon } from "lucide-react"
import { getLinkAttributes } from "@platejs/link"
import type { TLinkElement } from "platejs"
import {
  PlateElement,
  PlateLeaf,
  useEditorRef,
  useFocused,
  useSelected,
  type PlateElementProps,
  type PlateLeafProps,
} from "platejs/react"
import { cn } from "@/lib/utils"

export function ParagraphElement(props: PlateElementProps): ReactNode {
  return <PlateElement {...props} className="m-0 px-0 py-1" />
}

const HEADING_CLASSES = {
  h1: "mt-6 mb-1 text-3xl font-bold tracking-tight",
  h2: "mt-5 mb-1 text-2xl font-semibold tracking-tight",
  h3: "mt-4 mb-1 text-xl font-semibold",
  h4: "mt-3 mb-1 text-lg font-semibold",
} as const

function createHeading(tag: keyof typeof HEADING_CLASSES) {
  return function HeadingElement(props: PlateElementProps): ReactNode {
    return <PlateElement {...props} as={tag} className={HEADING_CLASSES[tag]} />
  }
}

export const H1Element = createHeading("h1")
export const H2Element = createHeading("h2")
export const H3Element = createHeading("h3")
export const H4Element = createHeading("h4")

export function BlockquoteElement(props: PlateElementProps): ReactNode {
  return (
    <PlateElement
      {...props}
      as="blockquote"
      className="my-1 border-l-4 border-primary/60 pl-5 text-muted-foreground italic"
    />
  )
}

export function HorizontalRuleElement({ children, ...props }: PlateElementProps): ReactNode {
  const selected = useSelected()
  const focused = useFocused()

  return (
    <PlateElement {...props}>
      <div contentEditable={false} className="py-4">
        <hr
          className={cn(
            "h-0.5 rounded-sm border-none bg-border bg-clip-content",
            selected && focused && "ring-2 ring-ring ring-offset-2 ring-offset-background"
          )}
        />
      </div>
      {children}
    </PlateElement>
  )
}

export function CalloutElement({ children, ...props }: PlateElementProps): ReactNode {
  return (
    <PlateElement {...props} className="my-2 flex gap-3 rounded-2xl bg-primary/15 p-4">
      <div contentEditable={false} className="mt-0.5 shrink-0 select-none">
        <LightbulbIcon className="size-5 text-primary-foreground dark:text-primary" />
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </PlateElement>
  )
}

export function LinkElement(props: PlateElementProps<TLinkElement>): ReactNode {
  const editor = useEditorRef()
  const { href, ...attributes } = getLinkAttributes(editor, props.element)

  return (
    <PlateElement
      {...props}
      as="a"
      className="cursor-text font-medium underline decoration-primary decoration-2 underline-offset-4 hover:bg-primary/15"
      attributes={{
        ...props.attributes,
        ...attributes,
        href,
        title: href ? `${href} (Ctrl+click to open)` : undefined,
        onClick: (event) => {
          if (href && (event.ctrlKey || event.metaKey)) {
            event.preventDefault()
            window.open(href, "_blank", "noopener,noreferrer")
          }
        },
      }}
    />
  )
}

export function BoldLeaf(props: PlateLeafProps): ReactNode {
  return <PlateLeaf {...props} as="strong" className="font-bold" />
}

export function ItalicLeaf(props: PlateLeafProps): ReactNode {
  return <PlateLeaf {...props} as="em" />
}

export function UnderlineLeaf(props: PlateLeafProps): ReactNode {
  return <PlateLeaf {...props} as="u" />
}

export function StrikethroughLeaf(props: PlateLeafProps): ReactNode {
  return <PlateLeaf {...props} as="s" />
}

export function SubscriptLeaf(props: PlateLeafProps): ReactNode {
  return <PlateLeaf {...props} as="sub" />
}

export function SuperscriptLeaf(props: PlateLeafProps): ReactNode {
  return <PlateLeaf {...props} as="sup" />
}

export function HighlightLeaf(props: PlateLeafProps): ReactNode {
  return <PlateLeaf {...props} as="mark" className="rounded-sm bg-primary/40 px-0.5 text-inherit" />
}

export function CodeLeaf(props: PlateLeafProps): ReactNode {
  return (
    <PlateLeaf
      {...props}
      as="code"
      className="rounded-md bg-muted px-[0.35em] py-[0.15em] font-mono text-[0.9em] whitespace-pre-wrap"
    />
  )
}
