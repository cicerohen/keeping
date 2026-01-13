export interface Tag {
  id: string
  name: string
  user_id: string
}

export interface ChecklistItem {
  id: string
  text: string
  completed: boolean
}

export interface Todo {
  id: string
  title: string
  description?: string
  tags?: Tag[] // Updated to use Tag relation
  checklist?: ChecklistItem[]
  color?: string
  image_url?: string | null

  created_at: string
  user_id: string
}
