import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { Command } from "cmdk"
import { upsertLink } from "@platejs/link"
import { KEYS, PathApi, RangeApi, type Point, type SlateEditor } from "platejs"
import { useEditorRef, useEditorVersion } from "platejs/react"
import { CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { getSlashCommands, resolveLinkUrl, SLASH_GROUPS, type SlashCommand } from "./slash-commands"

type PointRef = ReturnType<SlateEditor["api"]["pointRef"]>

/** Text typed after the opening "/", or null once the caret has left that spot. */
function readQuery(editor: SlateEditor, slash: PointRef | null): string | null {
  const selection = editor.selection
  const start = slash?.current
  if (!selection || !start || !RangeApi.isCollapsed(selection)) return null
  const caret = selection.focus
  if (!PathApi.equals(start.path, caret.path) || caret.offset <= start.offset) return null
  const text = editor.api.string({ anchor: start, focus: caret })
  return text.startsWith("/") ? text.slice(1) : null
}

/** A "/" opens the menu only at the start of a block or after whitespace, and never inside code. */
function canOpenAtCaret(editor: SlateEditor): boolean {
  const selection = editor.selection
  if (!selection || !RangeApi.isCollapsed(selection)) return false
  if (editor.api.some({ match: { type: editor.getType(KEYS.codeBlock) } })) return false
  const block = editor.api.block()
  const start = block ? editor.api.start(block[1]) : undefined
  if (!start) return false
  const before = editor.api.string({ anchor: start, focus: selection.focus })
  return before === "" || /\s$/.test(before)
}

function isInsideEditor(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest("[data-slate-editor]") !== null
}

/**
 * Slash command menu. The "/query" text lives in the document itself, so typing stays native
 * and the menu only reads the text after the "/" to filter commands.
 */
export function SlashMenu(): ReactNode {
  const editor = useEditorRef()
  const version = useEditorVersion()
  const slashRef = useRef<PointRef | null>(null)
  const linkAtRef = useRef<Point | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [linkMode, setLinkMode] = useState(false)
  const [query, setQuery] = useState<string | null>(null)
  const [active, setActive] = useState("")
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(null)
  const [linkText, setLinkText] = useState("")
  const [invalid, setInvalid] = useState(false)

  const inTable = editor.api.some({ match: { type: editor.getType(KEYS.table) } })
  const commands = useMemo(() => (query === null ? [] : getSlashCommands(inTable, query)), [inTable, query])
  const activeId = commands.some((command) => command.id === active) ? active : (commands[0]?.id ?? "")

  const closeMenu = useCallback(() => {
    slashRef.current?.unref()
    slashRef.current = null
    linkAtRef.current = null
    setOpen(false)
    setLinkMode(false)
    setQuery(null)
    setActive("")
    setAnchor(null)
    setLinkText("")
    setInvalid(false)
  }, [])

  /** Removes the "/query" text, then runs the command or switches to the link prompt. */
  const runCommand = useCallback(
    (command: SlashCommand) => {
      const slash = slashRef.current?.current
      const caret = editor.selection?.focus
      if (!slash || !caret) {
        closeMenu()
        return
      }
      const at = { ...slash }
      slashRef.current?.unref()
      slashRef.current = null
      editor.tf.delete({ at: { anchor: at, focus: caret } })
      editor.tf.select(at)
      if (command.prompt) {
        linkAtRef.current = at
        setLinkMode(true)
        setActive("")
        return
      }
      command.run?.(editor)
      closeMenu()
    },
    [editor, closeMenu]
  )

  const submitLink = () => {
    const url = resolveLinkUrl(editor, linkText)
    if (!url) {
      setInvalid(true)
      return
    }
    const at = linkAtRef.current
    closeMenu()
    if (at) editor.tf.select(at)
    editor.tf.focus()
    upsertLink(editor, { url, text: url })
  }

  const cancelLink = () => {
    closeMenu()
    editor.tf.focus()
  }

  // Refresh the query after each edit; close if the caret left the "/query" text.
  useEffect(() => {
    if (!open || linkMode || !slashRef.current) return
    const next = readQuery(editor, slashRef.current)
    if (next === null) closeMenu()
    else setQuery(next)
  }, [editor, version, open, linkMode, closeMenu])

  // Position the menu under the caret once the "/" is in the DOM.
  useEffect(() => {
    if (!open) return
    const frame = requestAnimationFrame(() => {
      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0) return
      const rect = selection.getRangeAt(0).getBoundingClientRect()
      setAnchor({ top: rect.bottom + 6, left: rect.left })
    })
    return () => cancelAnimationFrame(frame)
  }, [open])

  // Clicking anywhere outside the menu closes it; the typed text stays in the document.
  useEffect(() => {
    if (!open) return
    const onMouseDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) closeMenu()
    }
    window.addEventListener("mousedown", onMouseDown, true)
    return () => window.removeEventListener("mousedown", onMouseDown, true)
  }, [open, closeMenu])

  // Capture phase runs before Slate's handlers, so keys the menu consumes never reach the editor.
  useEffect(() => {
    if (linkMode) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing) return

      if (!open) {
        if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey) return
        if (!isInsideEditor(event.target)) return
        const caret = editor.selection?.focus
        if (!caret || !canOpenAtCaret(editor)) return
        event.preventDefault()
        event.stopPropagation()
        editor.tf.insertText("/")
        slashRef.current = editor.api.pointRef(caret)
        setQuery("")
        setOpen(true)
        return
      }

      if (event.key === "Escape") {
        event.preventDefault()
        event.stopPropagation()
        closeMenu()
        return
      }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault()
        event.stopPropagation()
        if (commands.length === 0) return
        const index = commands.findIndex((command) => command.id === activeId)
        const step = event.key === "ArrowDown" ? 1 : -1
        setActive(commands[(index + step + commands.length) % commands.length].id)
        return
      }
      if (event.key === "Enter") {
        event.preventDefault()
        event.stopPropagation()
        const command = commands.find((item) => item.id === activeId)
        if (command) runCommand(command)
        else closeMenu()
      }
    }
    window.addEventListener("keydown", onKeyDown, true)
    return () => window.removeEventListener("keydown", onKeyDown, true)
  }, [editor, open, linkMode, activeId, commands, closeMenu, runCommand])

  if (!open || !anchor) return null

  return (
    <div
      ref={menuRef}
      style={{ top: anchor.top, left: anchor.left }}
      className="fixed z-50 w-72 rounded-2xl border border-border bg-popover p-1 text-popover-foreground shadow-md"
    >
      {linkMode ? (
        <div className="px-2 py-2">
          <input
            autoFocus
            value={linkText}
            onChange={(event) => {
              setLinkText(event.target.value)
              setInvalid(false)
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                submitLink()
              } else if (event.key === "Escape") {
                event.preventDefault()
                cancelLink()
              }
            }}
            aria-label="Link URL"
            placeholder="Paste or type a link"
            autoComplete="off"
            spellCheck={false}
            className="w-full bg-transparent text-sm outline-none"
          />
          <p className="mt-1 text-xs text-muted-foreground">Enter to add link · Esc to cancel</p>
          {invalid && <p className="mt-1 text-xs text-destructive">Enter a valid web, email or phone link.</p>}
        </div>
      ) : (
        <div onMouseDown={(event) => event.preventDefault()}>
          <Command shouldFilter={false} loop value={activeId} onValueChange={setActive}>
            <CommandList>
              {SLASH_GROUPS.map((group) => {
                const groupCommands = commands.filter((command) => command.group === group)
                if (groupCommands.length === 0) return null
                return (
                  <CommandGroup key={group} heading={group}>
                    {groupCommands.map((command) => {
                      const Icon = command.icon
                      return (
                        <CommandItem key={command.id} value={command.id} onSelect={() => runCommand(command)}>
                          <Icon />
                          {command.label}
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                )
              })}
              {commands.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">No matching commands</p>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  )
}
