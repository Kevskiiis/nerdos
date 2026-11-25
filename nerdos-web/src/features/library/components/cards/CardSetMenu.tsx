import type { ReactNode } from "react"
import { FolderInput, MoreHorizontal, Pencil, RotateCcw, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { ItemAction } from "../../hooks/use-library-actions"

interface CardSetMenuProps {
  onAction: (action: ItemAction) => void
}

/** Set-level actions shown in the sticky header. */
export function CardSetMenu({ onAction }: CardSetMenuProps): ReactNode {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon-sm" className="size-11 md:size-8" aria-label="Set actions" />}
      >
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onAction("rename")}>
          <Pencil />
          Rename set
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction("move")}>
          <FolderInput />
          Move to folder
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction("reset")}>
          <RotateCcw />
          Reset progress
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => onAction("delete")}>
          <Trash2 />
          Delete set
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
