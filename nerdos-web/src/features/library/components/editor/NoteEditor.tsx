import type { ReactNode } from "react"
import type { Value } from "platejs"
import { Plate, PlateContent, usePlateEditor } from "platejs/react"
import type { PlateValue } from "../../types"
import { editorPlugins } from "@/components/editor/editor-plugins"
import { SlashMenu } from "@/components/editor/slash-menu"

interface NoteEditorProps {
  /** Initial document. The editor owns the live value after mount. */
  initialValue: PlateValue
  onChange: (value: PlateValue) => void
}

const EMPTY_DOCUMENT: Value = [{ type: "p", children: [{ text: "" }] }]

export function NoteEditor({ initialValue, onChange }: NoteEditorProps): ReactNode {
  const editor = usePlateEditor(
    {
      plugins: editorPlugins,
      value: initialValue.length > 0 ? (initialValue as Value) : EMPTY_DOCUMENT,
    },
    []
  )

  return (
    <Plate editor={editor} onValueChange={({ value }) => onChange(value as PlateValue)}>
      <PlateContent
        placeholder="Type / for commands"
        aria-label="Page content"
        className="mt-4 min-h-[50dvh] flex-1 pb-24 text-base leading-relaxed outline-none"
      />
      <SlashMenu />
    </Plate>
  )
}
