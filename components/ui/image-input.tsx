"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Image as ImageIcon } from "lucide-react"
import { MediaPicker } from "./media-picker"

interface ImageInputProps {
  id?: string
  label?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  description?: string
}

export function ImageInput({ 
  id, 
  label, 
  value, 
  onChange, 
  placeholder = "https://example.com/image.jpg",
  description 
}: ImageInputProps) {
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <div className="space-y-2">
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="flex gap-2">
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => setPickerOpen(true)}
          className="shrink-0"
        >
          <ImageIcon className="h-4 w-4 mr-2" />
          Browse
        </Button>
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      )}
      {value && (
        <div className="mt-2 rounded-lg overflow-hidden border border-border">
          <img
            src={value}
            alt="Preview"
            className="w-full h-32 object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        </div>
      )}
      <MediaPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={onChange}
        currentValue={value}
      />
    </div>
  )
}

