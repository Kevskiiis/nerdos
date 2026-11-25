import {
  BlockquoteRules,
  BoldRules,
  CodeRules,
  HeadingRules,
  HighlightRules,
  HorizontalRuleRules,
  ItalicRules,
  StrikethroughRules,
} from "@platejs/basic-nodes"
import {
  BlockquotePlugin,
  BoldPlugin,
  CodePlugin,
  H1Plugin,
  H2Plugin,
  H3Plugin,
  H4Plugin,
  HighlightPlugin,
  HorizontalRulePlugin,
  ItalicPlugin,
  StrikethroughPlugin,
  SubscriptPlugin,
  SuperscriptPlugin,
  UnderlinePlugin,
} from "@platejs/basic-nodes/react"
import { CalloutPlugin } from "@platejs/callout/react"
import { CodeBlockRules } from "@platejs/code-block"
import { CodeBlockPlugin, CodeLinePlugin, CodeSyntaxPlugin } from "@platejs/code-block/react"
import { IndentPlugin } from "@platejs/indent/react"
import { LinkRules } from "@platejs/link"
import { LinkPlugin } from "@platejs/link/react"
import { BulletedListRules, OrderedListRules, TaskListRules } from "@platejs/list"
import { ListPlugin } from "@platejs/list/react"
import { MathRules } from "@platejs/math"
import { EquationPlugin, InlineEquationPlugin } from "@platejs/math/react"
import { getNextTableCell, getPreviousTableCell, insertTableRow } from "@platejs/table"
import {
  TableCellHeaderPlugin,
  TableCellPlugin,
  TablePlugin,
  TableRowPlugin,
} from "@platejs/table/react"
import { common, createLowlight } from "lowlight"
import { KEYS, PathApi, TrailingBlockPlugin, type AnyPluginConfig, type SlateEditor } from "platejs"
import { ParagraphPlugin } from "platejs/react"
import { CodeBlockElement, CodeLineElement, CodeSyntaxLeaf } from "./nodes/code-block-node"
import { BlockList } from "./nodes/list-node"
import { EquationElement, InlineEquationElement } from "./nodes/math-nodes"
import {
  BlockquoteElement,
  BoldLeaf,
  CalloutElement,
  CodeLeaf,
  H1Element,
  H2Element,
  H3Element,
  H4Element,
  HighlightLeaf,
  HorizontalRuleElement,
  ItalicLeaf,
  LinkElement,
  ParagraphElement,
  StrikethroughLeaf,
  SubscriptLeaf,
  SuperscriptLeaf,
  UnderlineLeaf,
} from "./nodes/text-nodes"
import {
  TableCellElement,
  TableCellHeaderElement,
  TableElement,
  TableRowElement,
} from "./nodes/table-nodes"

const lowlight = createLowlight(common)

/** Blocks that can carry list/indent attributes. */
const LIST_TARGETS = [...KEYS.heading, KEYS.p, KEYS.blockquote, KEYS.codeBlock]

const headingRules = [HeadingRules.markdown()]

/** Tab / Shift+Tab move between cells; Tab in the last cell appends a row. */
function moveBetweenCells(editor: SlateEditor, reverse: boolean): boolean {
  const cell = editor.api.above({ match: { type: [editor.getType(KEYS.td), editor.getType(KEYS.th)] } })
  const row = cell && editor.api.parent(cell[1])
  if (!cell || !row) return false

  const target = reverse
    ? getPreviousTableCell(editor, cell, cell[1], row)
    : getNextTableCell(editor, cell, cell[1], row)
  if (target) {
    editor.tf.select(editor.api.start(target[1])!)
  } else if (!reverse) {
    insertTableRow(editor)
    const start = editor.api.start(PathApi.next(row[1]))
    if (start) editor.tf.select(start)
  }
  return true
}

/** Extension seam: register custom block plugins here (e.g. a future /draw block). */
const extensionPlugins: AnyPluginConfig[] = []

/**
 * Plugin set for note pages. Nothing here talks to a network or third-party app, so a page
 * stays a self-contained JSON document.
 */
export const editorPlugins = [
  ParagraphPlugin.withComponent(ParagraphElement),

  H1Plugin.configure({ inputRules: headingRules }).withComponent(H1Element),
  H2Plugin.configure({ inputRules: headingRules }).withComponent(H2Element),
  H3Plugin.configure({ inputRules: headingRules }).withComponent(H3Element),
  H4Plugin.configure({ inputRules: headingRules }).withComponent(H4Element),
  BlockquotePlugin.configure({ inputRules: [BlockquoteRules.markdown()] }).withComponent(BlockquoteElement),
  HorizontalRulePlugin.configure({
    inputRules: [HorizontalRuleRules.markdown({ variant: "-" }), HorizontalRuleRules.markdown({ variant: "_" })],
  }).withComponent(HorizontalRuleElement),
  CalloutPlugin.withComponent(CalloutElement),

  BoldPlugin.configure({ inputRules: [BoldRules.markdown()] }).withComponent(BoldLeaf),
  ItalicPlugin.configure({ inputRules: [ItalicRules.markdown()] }).withComponent(ItalicLeaf),
  UnderlinePlugin.withComponent(UnderlineLeaf),
  StrikethroughPlugin.configure({ inputRules: [StrikethroughRules.markdown()] }).withComponent(StrikethroughLeaf),
  CodePlugin.configure({ inputRules: [CodeRules.markdown()] }).withComponent(CodeLeaf),
  HighlightPlugin.configure({ inputRules: [HighlightRules.markdown()] }).withComponent(HighlightLeaf),
  SubscriptPlugin.withComponent(SubscriptLeaf),
  SuperscriptPlugin.withComponent(SuperscriptLeaf),

  CodeBlockPlugin.configure({
    options: { lowlight, defaultLanguage: null },
    inputRules: [CodeBlockRules.markdown({ on: "match" })],
  }).withComponent(CodeBlockElement),
  CodeLinePlugin.withComponent(CodeLineElement),
  CodeSyntaxPlugin.withComponent(CodeSyntaxLeaf),

  EquationPlugin.configure({ inputRules: [MathRules.markdown({ variant: "$$", on: "match" })] }).withComponent(
    EquationElement
  ),
  InlineEquationPlugin.configure({ inputRules: [MathRules.markdown({ variant: "$" })] }).withComponent(
    InlineEquationElement
  ),

  LinkPlugin.configure({
    inputRules: [
      LinkRules.markdown(),
      LinkRules.autolink({ variant: "space" }),
      LinkRules.autolink({ variant: "break" }),
      LinkRules.autolink({ variant: "paste" }),
    ],
  }).withComponent(LinkElement),

  IndentPlugin.configure({
    inject: { targetPlugins: LIST_TARGETS },
    options: { offset: 24, indentMax: 8 },
  }),
  ListPlugin.configure({
    inject: { targetPlugins: LIST_TARGETS },
    inputRules: [
      BulletedListRules.markdown({ variant: "-" }),
      BulletedListRules.markdown({ variant: "*" }),
      OrderedListRules.markdown(),
      TaskListRules.markdown({ checked: false }),
      TaskListRules.markdown({ checked: true }),
    ],
    render: { belowNodes: BlockList },
  }),

  // Registered after IndentPlugin so its Tab handling wins inside cells.
  TablePlugin.configure({ options: { disableMerge: true } })
    .overrideEditor(({ editor, tf: { tab } }) => ({
      transforms: {
        tab: (options) => moveBetweenCells(editor, Boolean(options.reverse)) || tab(options),
      },
    }))
    .withComponent(TableElement),
  TableRowPlugin.withComponent(TableRowElement),
  TableCellPlugin.withComponent(TableCellElement),
  TableCellHeaderPlugin.withComponent(TableCellHeaderElement),

  ...extensionPlugins,

  TrailingBlockPlugin,
]
