import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Tag as TagIcon, Check, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Tag } from "@/types"

interface TagSelectorProps {
  availableTags: Tag[]
  selectedTags: Tag[]
  onToggleTag: (tag: Tag) => void
  onCreateTag: (name: string) => void
}

export function TagSelector({ availableTags, selectedTags, onToggleTag, onCreateTag }: TagSelectorProps) {
  const [openCombobox, setOpenCombobox] = useState(false)
  const [search, setSearch] = useState('')

  const handleCreate = () => {
      if (!search.trim()) return
      onCreateTag(search)
      setSearch('')
  }

  return (
    <div className="flex flex-wrap gap-2 items-center min-h-[32px] p-2 bg-muted/30 rounded-md">
        <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    role="combobox"
                    aria-expanded={openCombobox}
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                >
                    <TagIcon className="h-3 w-3" />
                    {selectedTags.length > 0 ? `${selectedTags.length} tags` : "Add tags..."}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
                <Command>
                    <CommandInput 
                        placeholder="Search tags..." 
                        className="h-8" 
                        value={search}
                        onValueChange={setSearch}
                    />
                    <CommandList>
                        <CommandEmpty className="py-2 px-2 text-center text-sm">
                            <p className="text-muted-foreground mb-2">No tags found.</p>
                            <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-7 w-full text-xs"
                                onClick={handleCreate}
                            >
                                Create "{search}"
                            </Button>
                        </CommandEmpty>
                        <CommandGroup>
                            {availableTags.map((tag) => (
                                <CommandItem
                                    key={tag.id}
                                    value={tag.name}
                                    onSelect={() => onToggleTag(tag)}
                                >
                                    <div className="mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary">
                                        <Check
                                            className={cn(
                                                "h-3 w-3",
                                                selectedTags.some(t => t.id === tag.id) ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                    </div>
                                    {tag.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>

        {selectedTags.map(tag => (
            <Badge key={tag.id} variant="secondary" className="px-1.5 py-0 h-5 text-xs gap-1 font-normal cursor-default">
                {tag.name}
                <button type="button" onClick={() => onToggleTag(tag)} className="hover:text-destructive transition-colors">
                        <Plus className="h-3 w-3 rotate-45" />
                </button>
            </Badge>
        ))}
    </div>
  )
}
