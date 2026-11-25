import type { ReactNode } from "react"
import { Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { StudyDirection, StudyMode, StudyOptions } from "../../lib/study-session"

const MODES: readonly { value: StudyMode; label: string }[] = [
  { value: "flip", label: "Standard flip" },
  { value: "type", label: "Type the answer" },
]

const DIRECTIONS: readonly { value: StudyDirection; label: string }[] = [
  { value: "forward", label: "Front → Back" },
  { value: "reverse", label: "Back → Front" },
  { value: "mixed", label: "Mixed" },
]

interface OptionGroupProps<T extends string> {
  label: string
  value: T
  options: readonly { value: T; label: string }[]
  onChange: (value: T) => void
}

function OptionGroup<T extends string>({ label, value, options, onChange }: OptionGroupProps<T>): ReactNode {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <ToggleGroup
        value={[value]}
        onValueChange={(values) => {
          const next = options.find((option) => option.value === values[0])
          if (next) onChange(next.value)
        }}
        variant="outline"
        spacing={0}
        aria-label={label}
        className="w-full"
      >
        {options.map((option) => (
          <ToggleGroupItem key={option.value} value={option.value} className="min-h-11 flex-1 px-2 text-xs md:min-h-9">
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}

interface StudyOptionsPopoverProps {
  options: StudyOptions
  onChange: (options: StudyOptions) => void
}

/** Study mode, direction and shuffle toggles. Mode and direction apply to the very next card. */
export function StudyOptionsPopover({ options, onChange }: StudyOptionsPopoverProps): ReactNode {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" className="min-h-11 shrink-0 md:min-h-8" />}>
        <Settings2 />
        <span className="hidden sm:inline">Options</span>
        <span className="sr-only sm:hidden">Options</span>
      </PopoverTrigger>
      <PopoverContent align="end" className="flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-4">
        <OptionGroup label="Study mode" value={options.mode} options={MODES} onChange={(mode) => onChange({ ...options, mode })} />
        <OptionGroup
          label="Direction"
          value={options.direction}
          options={DIRECTIONS}
          onChange={(direction) => onChange({ ...options, direction })}
        />
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Shuffle queue</p>
            <p className="text-xs text-muted-foreground">Applies when a session starts.</p>
          </div>
          <Switch
            checked={options.shuffle}
            onCheckedChange={(shuffle) => onChange({ ...options, shuffle })}
            aria-label="Shuffle queue"
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
