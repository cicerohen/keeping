import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Palette } from "lucide-react"
import { cn } from "@/lib/utils"
import { COLORS } from "@/lib/constants"

interface ColorPickerProps {
  selectedColor: string
  onSelectColor: (color: string) => void
}

export function ColorPicker({ selectedColor, onSelectColor }: ColorPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full border shadow-sm" style={{ backgroundColor: selectedColor }}>
            <Palette className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
          <div className="flex gap-1">
              {COLORS.map(color => (
                  <button
                      key={color.value}
                      type="button"
                      className={cn(
                          "w-6 h-6 rounded-full border transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                          selectedColor === color.value ? "ring-2 ring-ring ring-offset-2" : ""
                      )}
                      style={{ backgroundColor: color.value }}
                      onClick={() => onSelectColor(color.value)}
                      title={color.name}
                  />
              ))}
          </div>
      </PopoverContent>
    </Popover>
  )
}
