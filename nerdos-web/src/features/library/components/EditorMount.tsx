import type { ReactNode } from "react"
import type { PlateValue } from "../types"
import { NoteEditor } from "./editor/NoteEditor"

interface EditorMountProps {
  /** Document the editor starts from; later edits are reported through `onChange`. */
  value: PlateValue
  onChange: (value: PlateValue) => void
}

/** Isolated editor boundary: the document view only knows this component's props. */
export function EditorMount({ value, onChange }: EditorMountProps): ReactNode {
  return (
    <div className="mt-6 flex flex-1 flex-col">
      <NoteEditor initialValue={value} onChange={onChange} />
    </div>
  )
}
