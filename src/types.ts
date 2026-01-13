export interface Tag {
  id: string
  name: string
  user_id: string
}

export interface Todo {
  id: string
  title: string
  description?: string
  tags?: Tag[] // Updated to use Tag relation
  color?: string
  image_url?: string | null

  created_at: string
  user_id: string
}
