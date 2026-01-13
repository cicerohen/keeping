import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"
import { supabase } from "@/lib/supabase"
import { LogOut, CheckSquare } from "lucide-react"

export function Header() {
  const { user } = useAuth()

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container flex h-14 max-w-7xl mx-auto items-center justify-between px-4 md:px-0">
        <div className="flex items-center space-x-2">
            <div className="bg-primary/10 p-1.5 rounded-lg">
                <CheckSquare className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-lg tracking-tight">Keeping</span>
        </div>
        
        <div className="flex items-center space-x-4">
            {user && (
                <>
                    <span className="text-sm text-muted-foreground hidden md:inline-block">
                        {user.email}
                    </span>
                    <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                        <LogOut className="h-4 w-4" />
                        <span className="sr-only">Logout</span>
                    </Button>
                </>
            )}
        </div>
      </div>
    </header>
  )
}
