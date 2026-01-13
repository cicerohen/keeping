import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ImagePlus, X } from 'lucide-react'

interface ImageUploadProps {
  value?: string | null
  onChange: (file: File) => void
  onRemove: () => void
  disabled?: boolean
}

export function ImageUpload({ value, onChange, onRemove, disabled }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onChange(file)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
        disabled={disabled}
      />
      
      {value ? (
        <div className="relative w-full h-[200px] rounded-md overflow-hidden border">
           <img 
             src={value} 
             alt="Task attachment" 
             className="object-cover w-full h-full"
           />
           <Button
             type="button"
             variant="destructive"
             size="icon"
             className="absolute top-2 right-2 h-6 w-6"
             onClick={onRemove}
             disabled={disabled}
           >
             <X className="h-4 w-4" />
           </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="w-full h-20 border-dashed"
        >
          <ImagePlus className="mr-2 h-4 w-4" />
          Add Image
        </Button>
      )}
    </div>
  )
}
