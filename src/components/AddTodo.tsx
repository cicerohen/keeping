import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { supabase } from '@/lib/supabase'
import { Plus, Loader2, Tag as TagIcon, Check, Palette, PenTool, X, CheckSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { COLORS } from "@/lib/constants"
import { ImageUpload } from "@/components/ui/image-upload"
import { DrawingCanvas } from "@/components/ui/drawing-canvas"
import { v4 as uuidv4 } from 'uuid'
import type { Tag, ChecklistItem } from "@/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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


export function AddTodo({ onTodoAdded, onTagCreated, availableTags }: { onTodoAdded: () => void, onTagCreated: () => void, availableTags: Tag[] }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedTags, setSelectedTags] = useState<Tag[]>([])
  const [selectedColor, setSelectedColor] = useState(COLORS[0].value)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [openCombobox, setOpenCombobox] = useState(false)
  const [isDrawingOpen, setIsDrawingOpen] = useState(false)
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([])
  const [newChecklistItem, setNewChecklistItem] = useState('')
  const [isChecklistOpen, setIsChecklistOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  // Close form when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (formRef.current && !formRef.current.contains(event.target as Node) && !title && !description && selectedTags.length === 0 && !openCombobox) {
        setIsExpanded(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [title, description, selectedTags, openCombobox, checklistItems])

  const toggleTag = (tag: Tag) => {
    if (selectedTags.some(t => t.id === tag.id)) {
        setSelectedTags(selectedTags.filter(t => t.id !== tag.id))
    } else {
        setSelectedTags([...selectedTags, tag])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    
    try {
      let imageUrl = null

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
      }

      // 1. Insert Todo
      const { data: todoData, error: todoError } = await supabase
      .from('todos')
      .insert([{ 
        title: title.trim(), 
        description: description.trim() || null,

        color: selectedColor,
        image_url: imageUrl,
        checklist: checklistItems
      }])
      .select()
      .single()

    if (todoError || !todoData) {
      console.error('Error adding todo:', todoError)
      setLoading(false)
      return
    }

    // 2. Insert TodoTags Relations
    if (selectedTags.length > 0) {
        const todoTags = selectedTags.map(tag => ({
            todo_id: todoData.id,
            tag_id: tag.id
        }))
        
        const { error: tagError } = await supabase
            .from('todo_tags')
            .insert(todoTags)

        if (tagError) console.error('Error adding tags:', tagError)
    }

    } catch (error) {
        console.error('Operation failed:', error)
        setLoading(false)
        return
    }

    setLoading(false)
    setTitle('')
    setDescription('')
    setSelectedTags([])
    setSelectedColor(COLORS[0].value)
    setSelectedImage(null)
    setImagePreview(null)
    setIsExpanded(false)
    setChecklistItems([])
    setNewChecklistItem('')
    setIsChecklistOpen(false)
    onTodoAdded()
  }

  const handleCancel = () => {
      setTitle('')
      setDescription('')
      setSelectedTags([])
      setSelectedColor(COLORS[0].value)
      setSelectedImage(null)
      setImagePreview(null)
      setIsExpanded(false)
      setChecklistItems([])
      setNewChecklistItem('')
      setIsChecklistOpen(false)
  }
  
  const handleDrawingSave = (blob: Blob) => {
    const file = new File([blob], "drawing.png", { type: "image/png" })
    setSelectedImage(file)
    setImagePreview(URL.createObjectURL(file))
    setIsDrawingOpen(false)
  }

  const [search, setSearch] = useState('')

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

  return (
    <form 
        ref={formRef}
        onSubmit={handleSubmit} 
        className={cn(
            "w-full transition-all duration-200 ease-in-out border rounded-lg bg-white overflow-hidden",
            isExpanded ? "shadow-md ring-1 ring-black/5" : "border-transparent shadow-none"
        )}
        style={{ backgroundColor: isExpanded ? selectedColor : undefined }}
    >
      <div className={cn(
          "flex items-center transition-all px-1",
          isExpanded ? "p-3 pb-0" : ""
      )}>
        <div className={cn(
            "flex items-center justify-center transition-all bg-primary/5 rounded-full", 
             isExpanded ? "w-0 h-0 opacity-0 overflow-hidden" : "w-8 h-8 opacity-100 mr-2"
        )}>
             <Plus className="h-4 w-4 text-primary" />
        </div>
        <Input
          type="text"
          placeholder={isExpanded ? "What needs to be done?" : "Add a new note..."}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setIsExpanded(true)}
          disabled={loading}
          className={cn(
              "flex-1 border-0 focus-visible:ring-0 px-2 py-2 h-auto text-base placeholder:text-muted-foreground/70",
              isExpanded ? "font-medium" : "bg-transparent shadow-none"
          )}
        />
      </div>
      
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <Textarea 
                placeholder="Description (optional)" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                className="min-h-[80px] border-0 focus-visible:ring-0 p-2 resize-none text-sm bg-muted/30"
            />

            {(isChecklistOpen || checklistItems.length > 0) && (
              <div className="space-y-2 p-2 bg-muted/30 rounded-md">
                {checklistItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 group">
                    <button
                      type="button"
                      onClick={() => toggleChecklistItem(item.id)}
                      className={cn(
                        "h-4 w-4 border rounded-sm flex items-center justify-center transition-colors",
                        item.completed ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground"
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
                    <button
                      type="button"
                      onClick={() => removeChecklistItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                
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
              </div>
            )}

            <div className="px-1">
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
                    disabled={loading}
                />
            </div>
            
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
                                        onClick={handleCreateTag}
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

                {selectedTags.map(tag => (
                    <Badge key={tag.id} variant="secondary" className="px-1.5 py-0 h-5 text-xs gap-1 font-normal cursor-default">
                        {tag.name}
                        <button type="button" onClick={() => toggleTag(tag)} className="hover:text-destructive transition-colors">
                             <Plus className="h-3 w-3 rotate-45" />
                        </button>
                    </Badge>
                ))}

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
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsDrawingOpen(true)}
                className="h-6 w-6 p-0 rounded-full border shadow-sm hover:bg-muted"
            >
                <PenTool className="h-3 w-3 text-muted-foreground" />
            </Button>
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsChecklistOpen(!isChecklistOpen)}
                className={cn(
                  "h-6 w-6 p-0 rounded-full border shadow-sm hover:bg-muted",
                  (isChecklistOpen || checklistItems.length > 0) && "bg-muted"
                )}
            >
                <CheckSquare className="h-3 w-3 text-muted-foreground" />
            </Button>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-1 border-t border-border/40">
                <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleCancel}
                    disabled={loading}
                    className="text-muted-foreground hover:text-foreground"
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={loading || !title.trim()} size="sm">
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding
                    </>
                ) : (
                    <>
                        Add Note
                    </>
                )}
                </Button>
            </div>
        </div>
      )}
      <Dialog open={isDrawingOpen} onOpenChange={setIsDrawingOpen}>
        <DialogContent className="max-w-3xl w-full h-[80vh] p-0 overflow-hidden sm:max-w-[90vw]">
          <DialogHeader className="px-4 py-2 border-b hidden">
            <DialogTitle>Draw</DialogTitle>
          </DialogHeader>
          <div className="flex-1 h-full w-full bg-white">
            <DrawingCanvas 
                onSave={handleDrawingSave} 
                onCancel={() => setIsDrawingOpen(false)} 
            />
          </div>
        </DialogContent>
      </Dialog>
    </form>
  )
}
