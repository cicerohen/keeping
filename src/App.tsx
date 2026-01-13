
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import Login from '@/pages/Login'
import SignUp from '@/pages/SignUp'
import { AddTodo } from '@/components/AddTodo'
import { TodoList } from '@/components/TodoList'
import { Header } from '@/components/Header'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Todo, Tag } from '@/types'

import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"
import { X, LayoutGrid, List } from "lucide-react"

import { TagManager } from "@/components/TagManager"

function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [filterTag, setFilterTag] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const { user } = useAuth()

  const fetchTags = async () => {
    const { data } = await supabase.from('tags').select('*').order('name')
    if (data) setAvailableTags(data)
  }

  const fetchTodos = async () => {
    
    // Fetch todos with their tags
    // Supabase join syntax: todos(*, tags:todo_tags(tags(*))) 
    // But since todo_tags is a join table, we might need a simpler approach or a view. 
    // Standard approach:
    
    // We can use a query that selects todos and their tag relations.
    // Assuming we have FK policies set up correctly. 
    // Let's try deep select: select *, tags:todo_tags(tag:tags(*))
    
    const { data, error } = await supabase
      .from('todos')
      .select(`
        *,
        todo_tags (
          tag:tags (*)
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching todos:', error)
        setLoading(false)
        return
    }

    // data structure will be todo & { todo_tags: { tag: Tag }[] }
    // We need to map it to our Todo interface which expects tags: Tag[]
    
    const formattedTodos: Todo[] = (data || []).map((t: any) => ({
      ...t,
      tags: t.todo_tags?.map((tt: any) => tt.tag).filter(Boolean) || []
    }))

    setTodos(formattedTodos)
    setLoading(false)
  }

  const fetchAll = () => {
      fetchTags()
      fetchTodos()
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const handleUpdateTodo = async (id: string, updates: Partial<Todo> & { tags?: Tag[] }) => {
    // 1. Optimistic Update
    setTodos(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))

    // 2. Network Request
    // Note: We are only updating simplified columns here (is_complete, title, description)
    // Tags update is separate or needs more complex logic if passed here. 
    // The TodoList only toggles completion, which is fine.
    
    const { tags, ...simpleUpdates } = updates 

    const { error } = await supabase
      .from('todos')
      .update(simpleUpdates)
      .eq('id', id)

    // Handle tags update if provided
    if (!error && tags) {
        // 1. Delete existing tags
        await supabase.from('todo_tags').delete().eq('todo_id', id)
        
        // 2. Insert new tags
        if (tags.length > 0) {
            const todoTags = tags.map(tag => ({
                todo_id: id,
                tag_id: tag.id
            }))
            await supabase.from('todo_tags').insert(todoTags)
        }
        
        // Refetch to ensure sync/consistency esp with relations
        // Or we could manually construct the new todo object but refetch is safer for relations
        fetchTodos()
    } else if (error) {
       console.error('Error updating todo:', error)
       fetchTodos() // Revert to server state
    }
  }

  const handleDeleteTodo = async (id: string) => {
    // 1. Optimistic Update
    setTodos(prev => prev.filter(t => t.id !== id))

    // 2. Network Request
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id)

    // 3. Rollback on Error
    if (error) {
       console.error('Error deleting todo:', error)
       fetchTodos() // Revert to server state
    }
  }

  const filteredTodos = filterTag 
    ? todos.filter(todo => todo.tags?.some(tag => tag.name === filterTag))
    : todos

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      <Header />
      <main className="flex-1 container max-w-7xl mx-auto py-8 px-4 md:px-0">
        <div className="space-y-6">
            <div className="space-y-1 relative">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">My Notes</h1>

                    </div>

                    <div className="flex items-center gap-2">
                        <div className="border rounded-md p-1 flex gap-1 bg-white">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1 rounded-sm transition-colors ${viewMode === 'grid' ? 'bg-secondary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                title="Grid View"
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1 rounded-sm transition-colors ${viewMode === 'list' ? 'bg-secondary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                title="List View"
                            >
                                <List className="h-4 w-4" />
                            </button>
                        </div>
                        {user && <TagManager onTagsChange={fetchAll} />}
                    </div>
                </div>
                
                {filterTag && (
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">Filtering by:</span>
                        <Badge variant="secondary" className="gap-1 pr-1">
                            {filterTag}
                            <button onClick={() => setFilterTag(null)} className="hover:bg-muted-foreground/20 rounded-full p-0.5">
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    </div>
                )}
            </div>
            
            {user && (
                <div className="max-w-2xl mx-auto w-full">
                    <AddTodo onTodoAdded={fetchTodos} onTagCreated={fetchAll} availableTags={availableTags} />
                </div>
            )}
            
            <div className="pt-2">
                {loading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i} className="p-4 flex items-start justify-between">
                          <div className="flex items-start space-x-3 pt-1 w-full">
                            <Skeleton className="h-4 w-4 rounded-sm mt-1" />
                            <div className="space-y-2 w-full pr-4">
                              <Skeleton className="h-4 w-3/4" />
                              <Skeleton className="h-3 w-1/2" />
                              <div className="flex gap-1 pt-1">
                                <Skeleton className="h-4 w-12" />
                                <Skeleton className="h-4 w-12" />
                              </div>
                            </div>
                          </div>
                          <Skeleton className="h-8 w-8 rounded-md" />
                        </Card>
                      ))}
                    </div>
                ) : (
                    <TodoList 
                        todos={filteredTodos} 
                        availableTags={availableTags}
                        onTodoUpdate={handleUpdateTodo} 
                        onTodoDelete={handleDeleteTodo}
                        onTagClick={setFilterTag}
                        viewMode={viewMode}
                        onTagCreated={fetchAll}
                    />
                )}
            </div>
        </div>
      </main>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/" element={<TodoApp />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
    </AuthProvider>
  )
}

export default App
