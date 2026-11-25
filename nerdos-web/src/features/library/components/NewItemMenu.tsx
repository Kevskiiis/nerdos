import type { ReactNode } from "react"
import { ChevronDown, FileText, Layers, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CONTROL_HEIGHT } from "./LibraryControls"

interface NewItemMenuProps {
  onNewPage: () => void
  onNewCardSet: () => void
  disabled?: boolean
}

/** Primary "+ New" dropdown shared by the Library home. */
export function NewItemMenu({ onNewPage, onNewCardSet, disabled }: NewItemMenuProps): ReactNode {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button className={CONTROL_HEIGHT} disabled={disabled} />}>
        <Plus />
        New
        <ChevronDown />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onNewPage}>
          <FileText />
          New Page
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onNewCardSet}>
          <Layers />
          New Card Set
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
