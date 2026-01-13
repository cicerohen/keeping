import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";


import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { EditTodoDialog } from "@/components/EditTodoDialog";

import { useState } from "react";
import type { Todo, Tag } from "@/types";

interface TodoListProps {
  todos: Todo[];
  availableTags: Tag[];
  onTodoUpdate: (
    id: string,
    updates: Partial<Todo> & { tags?: Tag[] }
  ) => Promise<void>;
  onTodoDelete: (id: string) => Promise<void>;
  onTagClick: (tag: string) => void;
  viewMode: "grid" | "list";
  onTagCreated: () => void;
}

export function TodoList({
  todos,
  availableTags,
  onTodoUpdate,
  onTodoDelete,
  onTagClick,
  viewMode,
  onTagCreated,
}: TodoListProps) {
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const { user } = useAuth();


  if (todos.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No tasks matched your criteria.
      </div>
    );
  }

  return (
    <div
      className={
        viewMode === "grid"
          ? "columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4"
          : "space-y-4 max-w-2xl mx-auto"
      }
    >
      {todos.map((todo) => (
        <Card
          key={todo.id}
          className="p-4 flex flex-col items-start justify-between transition-colors break-inside-avoid mb-4 cursor-pointer"
          style={{ backgroundColor: todo.color || "#ffffff" }}
          onClick={() => setEditingTodo(todo)}
        >
          {todo.image_url && (
            <div className="w-full h-32 mb-3 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
              <img
                src={todo.image_url}
                alt="Task attachment"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex items-start space-x-3 pt-1">
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor={`todo-${todo.id}`}
                className="text-sm font-medium leading-none"
              >
                {todo.title}
              </label>
              {todo.description && (
                <p className="text-xs text-gray-500">{todo.description}</p>
              )}
              {todo.tags && todo.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap pt-0.5">
                  {todo.tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 h-4 font-normal text-muted-foreground bg-muted hover:bg-muted-foreground/20 cursor-pointer transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTagClick(tag.name);
                      }}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-gray-400 pt-0.5">
                {new Date(todo.created_at).toLocaleDateString()} at{" "}
                {new Date(todo.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
          {user && user.id === todo.user_id && (
            <div className="flex gap-1 items-start w-full justify-end mt-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onTodoDelete(todo.id);
                }}
                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </Card>
      ))}

      {editingTodo && (
        <EditTodoDialog
          todo={editingTodo}
          availableTags={availableTags}
          open={!!editingTodo}
          onOpenChange={(open) => !open && setEditingTodo(null)}
          onSave={onTodoUpdate}
          onTagCreated={onTagCreated}
        />
      )}
    </div>
  );
}
