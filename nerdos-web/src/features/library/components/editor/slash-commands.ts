import {
  Columns3Icon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  LightbulbIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  ListTodoIcon,
  MinusIcon,
  QuoteIcon,
  Rows3Icon,
  SigmaIcon,
  TableIcon,
  Trash2Icon,
  TypeIcon,
  CodeIcon,
  type LucideIcon,
} from "lucide-react"
import { toggleCodeBlock, unwrapCodeBlock } from "@platejs/code-block"
import { toggleList } from "@platejs/list"
import { insertEquation, insertInlineEquation } from "@platejs/math"
import { validateUrl } from "@platejs/link"
import {
  deleteColumn,
  deleteRow,
  deleteTable,
  insertTable,
  insertTableColumn,
  insertTableRow,
} from "@platejs/table"
import { KEYS, PathApi, type SlateEditor } from "platejs"

export type SlashGroup = "Blocks" | "Lists" | "Insert" | "Table"

export const SLASH_GROUPS: readonly SlashGroup[] = ["Blocks", "Lists", "Insert", "Table"]

export interface SlashCommand {
  id: string
  label: string
  keywords: string
  group: SlashGroup
  icon: LucideIcon
  run?: (editor: SlateEditor) => void
  /** Asks for a URL in the menu instead of running right away. */
  prompt?: boolean
}

type BlockKind = "p" | "h1" | "h2" | "h3" | "h4" | "blockquote" | "callout" | "code_block"

function setBlockKind(editor: SlateEditor, kind: BlockKind): void {
  editor.tf.withoutNormalizing(() => {
    if (kind === "code_block") {
      toggleCodeBlock(editor)
      return
    }
    if (editor.api.some({ match: { type: editor.getType(KEYS.codeBlock) } })) unwrapCodeBlock(editor)

    if (kind === "blockquote" || kind === "callout") {
      editor.tf.toggleBlock(kind, { wrap: true })
      return
    }
    editor.tf.unwrapNodes({ match: { type: [editor.getType(KEYS.blockquote), editor.getType(KEYS.callout)] } })
    editor.tf.setNodes({ type: editor.getType(kind) }, { match: (node) => editor.api.isBlock(node) })
  })
}

/** Inserts a divider followed by an empty paragraph so typing can continue below it. */
function insertDivider(editor: SlateEditor): void {
  const entry = editor.api.block()
  const nodes = [
    editor.api.create.block({ type: editor.getType(KEYS.hr) }),
    editor.api.create.block({ type: editor.getType(KEYS.p) }),
  ]
  if (!entry) {
    editor.tf.insertNodes(nodes, { select: true })
    return
  }
  const [, path] = entry
  const replaceEmpty = editor.api.isEmpty(editor.selection, { block: true })
  editor.tf.withoutNormalizing(() => {
    if (replaceEmpty) editor.tf.removeNodes({ at: path })
    editor.tf.insertNodes(nodes, { at: replaceEmpty ? path : PathApi.next(path), select: true })
  })
}

/** Returns a normalized URL, or null when the input is empty or not a valid link. */
export function resolveLinkUrl(editor: SlateEditor, input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const normalized = /^([a-z][a-z0-9+.-]*:|\/|#)/i.test(trimmed) ? trimmed : `https://${trimmed}`
  return validateUrl(editor, normalized) ? normalized : null
}

const BLOCK_COMMANDS: SlashCommand[] = [
  {
    id: "text",
    label: "Text",
    keywords: "paragraph normal p",
    group: "Blocks",
    icon: TypeIcon,
    run: (editor) => setBlockKind(editor, "p"),
  },
  {
    id: "h1",
    label: "Heading 1",
    keywords: "h1 title large",
    group: "Blocks",
    icon: Heading1Icon,
    run: (editor) => setBlockKind(editor, "h1"),
  },
  {
    id: "h2",
    label: "Heading 2",
    keywords: "h2 subtitle",
    group: "Blocks",
    icon: Heading2Icon,
    run: (editor) => setBlockKind(editor, "h2"),
  },
  {
    id: "h3",
    label: "Heading 3",
    keywords: "h3",
    group: "Blocks",
    icon: Heading3Icon,
    run: (editor) => setBlockKind(editor, "h3"),
  },
  {
    id: "h4",
    label: "Heading 4",
    keywords: "h4",
    group: "Blocks",
    icon: Heading4Icon,
    run: (editor) => setBlockKind(editor, "h4"),
  },
  {
    id: "quote",
    label: "Quote",
    keywords: "blockquote citation",
    group: "Blocks",
    icon: QuoteIcon,
    run: (editor) => setBlockKind(editor, "blockquote"),
  },
  {
    id: "callout",
    label: "Callout",
    keywords: "note tip info highlight box",
    group: "Blocks",
    icon: LightbulbIcon,
    run: (editor) => setBlockKind(editor, "callout"),
  },
  {
    id: "code",
    label: "Code block",
    keywords: "code snippet pre",
    group: "Blocks",
    icon: CodeIcon,
    run: (editor) => setBlockKind(editor, "code_block"),
  },
  {
    id: "divider",
    label: "Divider",
    keywords: "hr line separator rule",
    group: "Blocks",
    icon: MinusIcon,
    run: insertDivider,
  },
  {
    id: "bulleted",
    label: "Bulleted list",
    keywords: "ul unordered bullet",
    group: "Lists",
    icon: ListIcon,
    run: (editor) => toggleList(editor, { listStyleType: KEYS.ul }),
  },
  {
    id: "numbered",
    label: "Numbered list",
    keywords: "ol ordered number",
    group: "Lists",
    icon: ListOrderedIcon,
    run: (editor) => toggleList(editor, { listStyleType: KEYS.ol }),
  },
  {
    id: "todo",
    label: "To-do list",
    keywords: "task checkbox check",
    group: "Lists",
    icon: ListTodoIcon,
    run: (editor) => toggleList(editor, { listStyleType: KEYS.listTodo }),
  },
  {
    id: "equation",
    label: "Block equation",
    keywords: "math latex formula tex",
    group: "Insert",
    icon: SigmaIcon,
    run: (editor) => insertEquation(editor, { select: true }),
  },
  {
    id: "inline-equation",
    label: "Inline equation",
    keywords: "math latex formula tex inline",
    group: "Insert",
    icon: SigmaIcon,
    run: (editor) => insertInlineEquation(editor, "", { select: true }),
  },
  {
    id: "link",
    label: "Link",
    keywords: "url href hyperlink web",
    group: "Insert",
    icon: LinkIcon,
    prompt: true,
  },
]

const TABLE_INSERT_COMMAND: SlashCommand = {
  id: "table",
  label: "Table",
  keywords: "grid rows columns 3x3",
  group: "Insert",
  icon: TableIcon,
  run: (editor) => insertTable(editor, { rowCount: 3, colCount: 3, header: true }, { select: true }),
}

const TABLE_EDIT_COMMANDS: SlashCommand[] = [
  {
    id: "row-above",
    label: "Add row above",
    keywords: "table insert",
    group: "Table",
    icon: Rows3Icon,
    run: (editor) => insertTableRow(editor, { before: true }),
  },
  {
    id: "row-below",
    label: "Add row below",
    keywords: "table insert",
    group: "Table",
    icon: Rows3Icon,
    run: (editor) => insertTableRow(editor),
  },
  {
    id: "column-left",
    label: "Add column left",
    keywords: "table insert",
    group: "Table",
    icon: Columns3Icon,
    run: (editor) => insertTableColumn(editor, { before: true }),
  },
  {
    id: "column-right",
    label: "Add column right",
    keywords: "table insert",
    group: "Table",
    icon: Columns3Icon,
    run: (editor) => insertTableColumn(editor),
  },
  {
    id: "delete-row",
    label: "Delete row",
    keywords: "table remove",
    group: "Table",
    icon: Trash2Icon,
    run: deleteRow,
  },
  {
    id: "delete-column",
    label: "Delete column",
    keywords: "table remove",
    group: "Table",
    icon: Trash2Icon,
    run: deleteColumn,
  },
  {
    id: "delete-table",
    label: "Delete table",
    keywords: "table remove",
    group: "Table",
    icon: Trash2Icon,
    run: deleteTable,
  },
]

/** Commands for the caret position; table commands appear only inside a table. */
export function getSlashCommands(inTable: boolean, query: string): SlashCommand[] {
  const commands = [...BLOCK_COMMANDS, ...(inTable ? TABLE_EDIT_COMMANDS : [TABLE_INSERT_COMMAND])]
  const needle = query.trim().toLowerCase()
  if (!needle) return commands
  return commands.filter((command) => `${command.label} ${command.keywords}`.toLowerCase().includes(needle))
}
