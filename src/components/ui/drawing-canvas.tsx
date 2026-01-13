import { useRef, useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Check, X, RotateCcw } from 'lucide-react'

interface DrawingCanvasProps {
  onSave: (blob: Blob) => void
  onCancel: () => void
}

export function DrawingCanvas({ onSave, onCancel }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isEmpty, setIsEmpty] = useState(true)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to match parent
    const resizeCanvas = () => {
      const parent = canvas.parentElement
      if (parent) {
        canvas.width = parent.clientWidth
        canvas.height = parent.clientHeight
        
        // Reset context properties after resize
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.lineWidth = 3
        ctx.strokeStyle = '#000000'
      }
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    return () => window.removeEventListener('resize', resizeCanvas)
  }, [])

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    setIsDrawing(true)
    setIsEmpty(false)
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { x, y } = getCoordinates(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return
    
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { x, y } = getCoordinates(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      }
    }
    
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top
    }
  }

  const handleClear = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setIsEmpty(true)
  }

  const handleSave = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.toBlob((blob) => {
      if (blob) onSave(blob)
    }, 'image/png')
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="flex items-center justify-between p-2 border-b bg-gray-50">
        <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={onCancel} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4 mr-1" /> Cancel
            </Button>
        </div>
        <div className="flex gap-2">
             <Button size="sm" variant="outline" onClick={handleClear} disabled={isEmpty}>
                <RotateCcw className="h-4 w-4 mr-1" /> Clear
             </Button>
            <Button size="sm" onClick={handleSave} disabled={isEmpty}>
                <Check className="h-4 w-4 mr-1" /> Save
            </Button>
        </div>
      </div>
      
      <div className="flex-1 relative cursor-crosshair touch-none bg-white">
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
        />
      </div>
    </div>
  )
}
