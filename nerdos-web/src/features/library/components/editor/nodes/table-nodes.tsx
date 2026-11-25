import type { ReactNode } from "react"
import { getRowSpan } from "@platejs/table"
import { useTableCellElement, useTableElement } from "@platejs/table/react"
import type { TTableCellElement } from "platejs"
import { PlateElement, type PlateElementProps } from "platejs/react"
import { cn } from "@/lib/utils"

export function TableElement({ children, ...props }: PlateElementProps): ReactNode {
  const { marginLeft, props: tableProps } = useTableElement()

  return (
    <PlateElement {...props} className="my-3 overflow-x-auto" style={{ paddingLeft: marginLeft }}>
      <table className="w-full min-w-max table-fixed border-collapse text-sm" {...tableProps}>
        <tbody>{children}</tbody>
      </table>
    </PlateElement>
  )
}

export function TableRowElement(props: PlateElementProps): ReactNode {
  return <PlateElement {...props} as="tr" />
}

function Cell({ as, ...props }: PlateElementProps<TTableCellElement> & { as: "td" | "th" }): ReactNode {
  const { colSpan, selected } = useTableCellElement()

  return (
    <PlateElement
      {...props}
      as={as}
      className={cn(
        "relative min-w-28 border border-border px-3 py-2 text-left align-top",
        as === "th" && "bg-muted/60 font-semibold",
        selected && "bg-primary/20"
      )}
      attributes={{ ...props.attributes, colSpan, rowSpan: getRowSpan(props.element) }}
    >
      {props.children}
    </PlateElement>
  )
}

export function TableCellElement(props: PlateElementProps<TTableCellElement>): ReactNode {
  return <Cell {...props} as="td" />
}

export function TableCellHeaderElement(props: PlateElementProps<TTableCellElement>): ReactNode {
  return <Cell {...props} as="th" />
}
