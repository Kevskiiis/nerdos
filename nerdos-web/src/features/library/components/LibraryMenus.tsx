import type { ReactNode } from "react"
import { Copy, FolderInput, MoreHorizontal, Pencil, Pin, PinOff, Trash2, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { FolderAction, ItemAction } from "../hooks/use-library-actions"
import { displayTitle } from "../lib/format"
import type { LibraryItem } from "../types"

function MenuTrigger({ label, className }: { label: string; className?: string }): ReactNode {
  return (
    <DropdownMenuTrigger
      render={
        <Button
          variant="ghost"
          size="icon-sm"
          className={cn("relative z-10 size-11 shrink-0 md:size-8", className)}
          aria-label={label}
        />
      }
    >
      <MoreHorizontal />
    </DropdownMenuTrigger>
  )
}

interface FolderMenuProps {
  folderName: string
  isPinned: boolean
  onAction: (action: FolderAction) => void
  className?: string
}

export function FolderMenu({ folderName, isPinned, onAction, className }: FolderMenuProps): ReactNode {
  return (
    <DropdownMenu>
      <MenuTrigger label={`Actions for folder ${folderName}`} className={className} />
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onAction("toggle-pin")}>
          {isPinned ? <PinOff /> : <Pin />}
          {isPinned ? "Unpin" : "Pin"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction("rename")}>
          <Pencil />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction("move")}>
          <FolderInput />
          Move to folder
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => onAction("delete")}>
          <Trash2 />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

type ListMenuAction = Extract<ItemAction, "move" | "duplicate" | "rename">

const ITEM_ACTIONS: Record<LibraryItem["kind"], readonly ListMenuAction[]> = {
  page: ["move", "duplicate"],
  cardSet: ["move", "rename"],
}

const ACTION_VIEW: Record<ListMenuAction, { label: string; icon: LucideIcon }> = {
  move: { label: "Move to folder", icon: FolderInput },
  duplicate: { label: "Duplicate", icon: Copy },
  rename: { label: "Rename", icon: Pencil },
}

interface ItemMenuProps {
  entry: LibraryItem
  onAction: (entry: LibraryItem, action: ItemAction) => void
  className?: string
}

/** Actions differ by kind: pages can be duplicated, card sets can be renamed. */
export function ItemMenu({ entry, onAction, className }: ItemMenuProps): ReactNode {
  return (
    <DropdownMenu>
      <MenuTrigger label={`Actions for ${displayTitle(entry.item.title)}`} className={className} />
      <DropdownMenuContent align="end">
        {ITEM_ACTIONS[entry.kind].map((action) => {
          const { label, icon: Icon } = ACTION_VIEW[action]
          return (
            <DropdownMenuItem key={action} onClick={() => onAction(entry, action)}>
              <Icon />
              {label}
            </DropdownMenuItem>
          )
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => onAction(entry, "delete")}>
          <Trash2 />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
