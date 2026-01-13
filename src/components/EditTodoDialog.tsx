import { useState, useEffect } from 'react'
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Loader2, Tag as TagIcon, Check, Plus, Palette, X, CheckSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { COLORS } from "@/lib/constants"
import { ImageUpload } from "@/components/ui/image-upload"
import { v4 as uuidv4 } from 'uuid'
import { supabase } from "@/lib/supabase"
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
import type { Todo, Tag, ChecklistItem } from "@/types"

interface EditTodoDialogProps {
  todo: Todo
  availableTags: Tag[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (id: string, updates: Partial<Todo> & { tags?: Tag[] }) => Promise<void>
  onTagCreated: () => void
}

export function EditTodoDialog({ todo, availableTags, open, onOpenChange, onSave, onTagCreated }: EditTodoDialogProps) {
  const [title, setTitle] = useState(todo.title)
  const [description, setDescription] = useState(todo.description || '')
  const [selectedTags, setSelectedTags] = useState<Tag[]>(todo.tags || [])
  const [selectedColor, setSelectedColor] = useState(todo.color || COLORS[0].value)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(todo.image_url || null)
  const [loading, setLoading] = useState(false)
  const [openCombobox, setOpenCombobox] = useState(false)
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(todo.checklist || [])
  const [newChecklistItem, setNewChecklistItem] = useState('')
  const [isChecklistOpen, setIsChecklistOpen] = useState(false)
  
  const { user } = useAuth()
  const isReadOnly = !user || user.id !== todo.user_id

  const [search, setSearch] = useState('')

  const [error, setError] = useState<string | null>(null)

  // Reset state when todo changes or dialog opens
  useEffect(() => {
    if (open) {
      setTitle(todo.title)
      setDescription(todo.description || '')
      setSelectedTags(todo.tags || [])
      setSelectedColor(todo.color || COLORS[0].value)
      setSelectedImage(null)
      setImagePreview(todo.image_url || null)
      setError(null)
      setChecklistItems(todo.checklist || [])
      setNewChecklistItem('')
      setIsChecklistOpen(false)
    }
  }, [open, todo])

  const toggleTag = (tag: Tag) => {
    if (selectedTags.some(t => t.id === tag.id)) {
        setSelectedTags(selectedTags.filter(t => t.id !== tag.id))
    } else {
        setSelectedTags([...selectedTags, tag])
    }
  }

  const handleCreateTag = async () => {
      if (!search.trim()) return
      
      const { data, error } = await supabase
        .from('tags')
        .insert([{ name: search.trim() }])
        .select()
        .single()
        
      if (data && !error) {
          onTagCreated()
          toggleTag(data)
          setSearch('')
      }
  }

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return
    const newItem: ChecklistItem = {
      id: uuidv4(),
      text: newChecklistItem.trim(),
      completed: false
    }
    setChecklistItems([...checklistItems, newItem])
    setNewChecklistItem('')
  }

  const removeChecklistItem = (id: string) => {
    setChecklistItems(checklistItems.filter(item => item.id !== id))
  }

  const toggleChecklistItem = (id: string) => {
    setChecklistItems(checklistItems.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    setError(null)
    
    try {
        let imageUrl = todo.image_url

        // Handle image upload if changed
        if (selectedImage) {
             const fileExt = selectedImage.name.split('.').pop()
             const fileName = `${uuidv4()}.${fileExt}`
             const { error: uploadError } = await supabase.storage
               .from('task-images')
               .upload(fileName, selectedImage)
     
             if (uploadError) throw uploadError
     
             const { data: { publicUrl } } = supabase.storage
               .from('task-images')
               .getPublicUrl(fileName)
             
             imageUrl = publicUrl
        } else if (imagePreview === null && todo.image_url) {
            // Image was removed
            imageUrl = null
        }

        await onSave(todo.id, {
            title: title.trim(),
            description: description.trim() || undefined,
            tags: selectedTags,
            color: selectedColor,
            image_url: imageUrl,
            checklist: checklistItems
        })
        onOpenChange(false)
    } catch (error) {
        console.error('Failed to update todo:', error)
        setError(error instanceof Error ? error.message : 'Failed to update todo')
    } finally {
        setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] transition-colors duration-200" style={{ backgroundColor: selectedColor }}>
        <DialogHeader>
          <DialogTitle>{isReadOnly ? "Task Details" : "Edit Task"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
                <Input
                    placeholder="Task title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={loading || isReadOnly}
                    className="text-base"
                />
            </div>
            <div className="space-y-2">
                <Textarea 
                    placeholder="Description (optional)" 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={loading || isReadOnly}
                    className="min-h-[100px] resize-none"
                />
            </div>

            {(isChecklistOpen || checklistItems.length > 0) && (
              <div className="space-y-2 p-2 bg-muted/30 rounded-md">
                {checklistItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 group">
                    <button
                      type="button"
                      onClick={() => !isReadOnly && toggleChecklistItem(item.id)}
                      disabled={isReadOnly}
                      className={cn(
                        "h-4 w-4 border rounded-sm flex items-center justify-center transition-colors",
                        item.completed ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground",
                         isReadOnly && "cursor-default"
                      )}
                    >
                      {item.completed && <Check className="h-3 w-3" />}
                    </button>
                    <span className={cn(
                      "flex-1 text-sm",
                      item.completed && "line-through text-muted-foreground"
                    )}>
                      {item.text}
                    </span>
                    {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => removeChecklistItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    )}
                  </div>
                ))}
                
                {!isReadOnly && (
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-muted-foreground" />
                  <Input
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addChecklistItem()
                      }
                    }}
                    placeholder="List item"
                    className="flex-1 h-8 text-sm border-0 bg-transparent focus-visible:ring-0 p-0 placeholder:text-muted-foreground"
                  />
                </div>
                )}
              </div>
            )}

            <div className="space-y-2">
                <ImageUpload 
                    value={imagePreview}
                    onChange={(file) => {
                        setSelectedImage(file)
                        setImagePreview(URL.createObjectURL(file))
                    }}
                    onRemove={() => {
                        setSelectedImage(null)
                        setImagePreview(null)
                    }}
                    disabled={loading || isReadOnly}
                />
            </div>

            <div className="flex flex-wrap gap-2 items-center min-h-[40px] p-2 bg-muted/30 rounded-md border">
                {!isReadOnly && (
                <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            role="combobox"
                            aria-expanded={openCombobox}
                            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                        >
                            <TagIcon className="h-3 w-3" />
                            Add tags...
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
                                        onClick={handleCreateTag}
                                        type="button"
                                    >
                                        Create "{search}"
                                    </Button>
                                </CommandEmpty>
                                <CommandGroup>
                                    {availableTags.map((tag) => (
                                        <CommandItem
                                            key={tag.id}
                                            value={tag.name}
                                            onSelect={() => toggleTag(tag)}
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
                )}

                {selectedTags.map(tag => (
                    <Badge key={tag.id} variant="secondary" className="px-1.5 py-0 h-5 text-xs gap-1 font-normal cursor-default">
                        {tag.name}
                        {!isReadOnly && (
                        <button type="button" onClick={() => toggleTag(tag)} className="hover:text-destructive transition-colors">
                             <Plus className="h-3 w-3 rotate-45" />
                        </button>
                        )}
                    </Badge>
                ))}

                {!isReadOnly && (
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
                                  onClick={() => setSelectedColor(color.value)}
                                  title={color.name}
                              />
                          ))}
                      </div>
                  </PopoverContent>
                </Popover>
                )}
            <Button 
                type="button"
                variant="ghost" 
                size="sm" 
                onClick={() => setIsChecklistOpen(!isChecklistOpen)}
                className={cn(
                  "h-6 w-6 p-0 rounded-full border shadow-sm hover:bg-muted",
                  (isChecklistOpen || checklistItems.length > 0) && "bg-muted"
                )}
            >
                <CheckSquare className="h-3 w-3 text-muted-foreground opacity-50" />
            </Button>
            </div>

            {error && (
              <div className="text-sm font-medium text-destructive px-1">
                {error}
              </div>
            )}
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                    {isReadOnly ? "Close" : "Cancel"}
                </Button>
                {!isReadOnly && (
                <Button type="submit" disabled={loading || !title.trim()}>
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving
                        </>
                    ) : (
                        'Save Changes'
                    )}
                </Button>
                )}
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
