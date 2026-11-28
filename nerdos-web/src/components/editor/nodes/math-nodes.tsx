import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import katex from "katex"
import "katex/dist/katex.min.css"
import { RadicalIcon } from "lucide-react"
import { PathApi, type TEquationElement } from "platejs"
import { PlateElement, useEditorRef, useSelected, type PlateElementProps } from "platejs/react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

function renderTex(expression: string, displayMode: boolean): string {
  return katex.renderToString(expression, { displayMode, throwOnError: false, output: "htmlAndMathml" })
}

interface EquationEditorProps {
  value: string
  onChange: (value: string) => void
  onClose: () => void
}

function EquationEditor({ value, onChange, onClose }: EquationEditorProps): ReactNode {
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Slate re-focuses the editor right after inserting a void node, which beats the popover's own initial focus.
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <PopoverContent
      align="start"
      className="w-[min(30rem,calc(100vw-2rem))]"
      initialFocus={inputRef}
      finalFocus={false}
    >
      <label htmlFor="equation-input" className="px-1 text-xs font-medium text-muted-foreground">
        LaTeX
      </label>
      <Textarea
        ref={inputRef}
        id="equation-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault()
            onClose()
          }
        }}
        placeholder="e.g. \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}"
        spellCheck={false}
        className="min-h-20 font-mono text-sm"
      />
      <p className="px-1 text-xs text-muted-foreground">Enter to finish · Shift+Enter for a new line</p>
    </PopoverContent>
  )
}

function useEquationEditing(element: TEquationElement, inline: boolean) {
  const editor = useEditorRef()
  // New, empty equations open their editor straight away.
  const [open, setOpen] = useState(element.texExpression.length === 0)

  const setExpression = (texExpression: string) => {
    const at = editor.api.findPath(element)
    if (at) editor.tf.setNodes({ texExpression }, { at })
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) return
    // Put the caret after the equation so typing can continue.
    const at = editor.api.findPath(element)
    const caret = at && (inline ? editor.api.after(at) : editor.api.start(PathApi.next(at)))
    if (caret) editor.tf.select(caret)
    editor.tf.focus()
  }

  return { open, handleOpenChange, setExpression }
}

export function EquationElement({ children, ...props }: PlateElementProps<TEquationElement>): ReactNode {
  const { element } = props
  const selected = useSelected()
  const { open, handleOpenChange, setExpression } = useEquationEditing(element, false)
  const html = useMemo(() => renderTex(element.texExpression, true), [element.texExpression])

  return (
    <PlateElement {...props} className="my-1">
      <div contentEditable={false}>
        <Popover open={open} onOpenChange={handleOpenChange}>
          <PopoverTrigger
            className={cn(
              "flex min-h-12 w-full cursor-pointer items-center justify-center overflow-x-auto rounded-2xl px-4 py-2 text-foreground hover:bg-muted/60",
              (selected || open) && "bg-muted/60"
            )}
          >
            {element.texExpression ? (
              <span dangerouslySetInnerHTML={{ __html: html }} />
            ) : (
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <RadicalIcon className="size-4" /> Add a math equation
              </span>
            )}
          </PopoverTrigger>
          <EquationEditor
            value={element.texExpression}
            onChange={setExpression}
            onClose={() => handleOpenChange(false)}
          />
        </Popover>
      </div>
      {children}
    </PlateElement>
  )
}

export function InlineEquationElement({ children, ...props }: PlateElementProps<TEquationElement>): ReactNode {
  const { element } = props
  const selected = useSelected()
  const { open, handleOpenChange, setExpression } = useEquationEditing(element, true)
  const html = useMemo(() => renderTex(element.texExpression, false), [element.texExpression])

  return (
    <PlateElement {...props} as="span" className="mx-0.5 inline-block align-baseline">
      <span contentEditable={false}>
        <Popover open={open} onOpenChange={handleOpenChange}>
          <PopoverTrigger
            nativeButton={false}
            render={<span />}
            className={cn(
              "inline-block cursor-pointer rounded-md px-1 hover:bg-muted",
              (selected || open) && "bg-muted"
            )}
          >
            {element.texExpression ? (
              <span dangerouslySetInnerHTML={{ __html: html }} />
            ) : (
              <span className="text-sm text-muted-foreground">New equation</span>
            )}
          </PopoverTrigger>
          <EquationEditor
            value={element.texExpression}
            onChange={setExpression}
            onClose={() => handleOpenChange(false)}
          />
        </Popover>
      </span>
      {children}
    </PlateElement>
  )
}
