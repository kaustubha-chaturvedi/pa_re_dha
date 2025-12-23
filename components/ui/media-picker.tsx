"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Upload, 
  Loader2, 
  Image as ImageIcon,
  X,
  Check
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface MediaItem {
  key: string
  url: string
  size: number
  contentType: string
  uploaded: string
  name: string
}

interface MediaPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (url: string) => void
  currentValue?: string
}

export function MediaPicker({ open, onOpenChange, onSelect, currentValue }: MediaPickerProps) {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [configured, setConfigured] = useState(false)
  const [selectedUrl, setSelectedUrl] = useState<string | null>(currentValue || null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      loadMedia()
      setSelectedUrl(currentValue || null)
    }
  }, [open, currentValue])

  const loadMedia = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/media/list")
      const data = await res.json()
      
      if (data.configured) {
        setMedia(data.media || [])
        setConfigured(true)
      } else {
        setConfigured(false)
        setMedia([])
      }
    } catch (error) {
      console.error("Error loading media:", error)
      setConfigured(false)
      setMedia([])
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file.",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 10MB.",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (data.error) {
        throw new Error(data.error)
      }

      toast({
        title: "Upload successful",
        description: "Image uploaded successfully.",
      })

      // Reload media list
      await loadMedia()

      // Auto-select the newly uploaded image
      if (data.url) {
        setSelectedUrl(data.url)
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error: any) {
      console.error("Error uploading:", error)
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleSelect = () => {
    if (selectedUrl) {
      onSelect(selectedUrl)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Image</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !configured ? (
            <div className="text-center py-12">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">R2 Storage Not Configured</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Please configure Cloudflare R2 credentials to use the media library.
              </p>
              <p className="text-xs text-muted-foreground">
                You can still enter an image URL manually in the input field.
              </p>
            </div>
          ) : media.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Images Found</h3>
              <p className="text-muted-foreground text-sm">
                Upload your first image to get started.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {media.map((item) => {
                const isSelected = selectedUrl === item.url
                return (
                  <div
                    key={item.key}
                    className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      isSelected 
                        ? "border-primary ring-2 ring-primary/20" 
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedUrl(item.url)}
                  >
                    <div className="aspect-square relative bg-muted">
                      <img
                        src={item.url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <div className="bg-primary text-primary-foreground rounded-full p-2">
                            <Check className="h-4 w-4" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-2 bg-background">
                      <p className="text-xs text-muted-foreground truncate" title={item.name}>
                        {item.name}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="border-t pt-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || !configured}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload New
                </>
              )}
            </Button>
            {selectedUrl && (
              <span className="text-sm text-muted-foreground">
                {media.find(m => m.url === selectedUrl)?.name || "Selected"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSelect}
              disabled={!selectedUrl}
            >
              Select Image
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

