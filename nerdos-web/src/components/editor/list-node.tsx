import type { ReactNode } from "react"
import { isOrderedList } from "@platejs/list"
import { KEYS, type TListElement } from "platejs"
import {
  useEditorRef,
  useReadOnly,
  type PlateElementProps,
  type RenderNodeWrapper,
} from "platejs/react"
import { cn } from "@/lib/utils"

function TodoMarker({ element }: PlateElementProps): ReactNode {
  const editor = useEditorRef()
  const readOnly = useReadOnly()

  return (
    <div contentEditable={false} className="absolute top-1.5 -left-6 flex w-5 justify-center select-none">
      <input
        type="checkbox"
        aria-label="Completed"
        className="size-4 cursor-pointer accent-primary"
        checked={Boolean(element.checked)}
        disabled={readOnly}
        onChange={(event) => {
          const at = editor.api.findPath(element)
          if (at) editor.tf.setNodes({ checked: event.target.checked }, { at })
        }}
      />
    </div>
  )
}

function ListBlock(props: PlateElementProps): ReactNode {
  const { listStart, listStyleType } = props.element as TListElement
  const isTodo = listStyleType === KEYS.listTodo
  const className = "relative m-0 p-0"
  const item = (
    <li className={cn(isTodo && "list-none", isTodo && Boolean(props.element.checked) && "text-muted-foreground line-through")}>
      {props.children}
    </li>
  )

  if (isTodo) {
    return (
      <ul className={className} style={{ listStyleType: "none" }}>
        <TodoMarker {...props} />
        {item}
      </ul>
    )
  }
  if (isOrderedList(props.element)) {
    return (
      <ol className={className} style={{ listStyleType }} start={listStart}>
        {item}
      </ol>
    )
  }
  return (
    <ul className={className} style={{ listStyleType }}>
      {item}
    </ul>
  )
}

/** Renders list semantics (marker, checkbox) around the children of any block that carries `listStyleType`. */
export const BlockList: RenderNodeWrapper = (props) => {
  if (!props.element.listStyleType) return
  return (wrapperProps) => <ListBlock {...wrapperProps} />
}
