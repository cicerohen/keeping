import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Pencil, Trash2, Plus, Settings2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { Tag } from "@/types"

export function TagManager({ onTagsChange }: { onTagsChange: () => void }) {
  const [tags, setTags] = useState<Tag[]>([])
  const [newTag, setNewTag] = useState('')
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [open, setOpen] = useState(false)

  const fetchTags = async () => {
    const { data } = await supabase.from('tags').select('*').order('name')
    if (data) setTags(data)
  }

  useEffect(() => {
    if (open) fetchTags()
  }, [open])

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTag.trim()) return

    const { error } = await supabase.from('tags').insert([{ name: newTag.trim() }])
    
    if (!error) {
        setNewTag('')
        fetchTags()
        onTagsChange()
    }
  }

  const handleUpdateTag = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTag || !editingTag.name.trim()) return

    const { error } = await supabase
        .from('tags')
        .update({ name: editingTag.name.trim() })
        .eq('id', editingTag.id)

    if (!error) {
        setEditingTag(null)
        fetchTags()
        onTagsChange()
    }
  }

  const handleDeleteTag = async (id: string) => {
      const { error } = await supabase.from('tags').delete().eq('id', id)
      if (!error) {
          fetchTags()
          onTagsChange()
      }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Settings2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manage Tags</DialogTitle>
          <DialogDescription>
            Create, rename, or delete your tags here.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
             {/* Create New */}
            <form onSubmit={handleAddTag} className="flex gap-2">
                <Input 
                    placeholder="Create new tag..." 
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                />
                <Button type="submit" size="icon" disabled={!newTag.trim()}>
                    <Plus className="h-4 w-4" />
                </Button>
            </form>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {tags.map(tag => (
                    <div key={tag.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted group">
                        {editingTag?.id === tag.id ? (
                            <form onSubmit={handleUpdateTag} className="flex-1 flex gap-2">
                                <Input 
                                    value={editingTag.name}
                                    onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                                    className="h-8"
                                    autoFocus
                                />
                                <Button type="submit" size="sm" className="h-8">Save</Button>
                                <Button type="button" variant="ghost" size="sm" className="h-8" onClick={() => setEditingTag(null)}>Cancel</Button>
                            </form>
                        ) : (
                            <>
                                <span className="flex-1 text-sm font-medium">{tag.name}</span>
                                <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingTag(tag)}>
                                        <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => handleDeleteTag(tag.id)}>
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
