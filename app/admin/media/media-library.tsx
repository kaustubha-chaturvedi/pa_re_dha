"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Upload, 
  Loader2, 
  Trash2, 
  Copy, 
  Check, 
  Image as ImageIcon,
  X,
  Eye
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

export function MediaLibrary() {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [configured, setConfigured] = useState(false)
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadMedia()
  }, [])

  const loadMedia = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/media/list", {
        credentials: 'include',
      })
      const data = await res.json()
      
      if (data.configured) {
        setMedia(data.media || [])
        setConfigured(true)
      } else {
        setConfigured(false)
        toast({
          title: "R2 Not Configured",
          description: data.message || "Please configure Cloudflare R2 credentials.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error loading media:", error)
      toast({
        title: "Error",
        description: "Failed to load media library.",
        variant: "destructive",
      })
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
        credentials: 'include',
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

  const handleDelete = async (key: string) => {
    if (!confirm("Are you sure you want to delete this image?")) {
      return
    }

    try {
      const res = await fetch(`/api/media/delete?key=${encodeURIComponent(key)}`, {
        method: "DELETE",
        credentials: 'include',
      })

      const data = await res.json()

      if (data.error) {
        throw new Error(data.error)
      }

      toast({
        title: "Deleted",
        description: "Image deleted successfully.",
      })

      // Reload media list
      await loadMedia()
    } catch (error: any) {
      console.error("Error deleting:", error)
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete image.",
        variant: "destructive",
      })
    }
  }

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(key)
      toast({
        title: "Copied!",
        description: "Link copied to clipboard.",
      })
      setTimeout(() => setCopiedKey(null), 2000)
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!configured) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">R2 Storage Not Configured</h2>
          <p className="text-muted-foreground mb-4">
            Please configure the following environment variables:
          </p>
          <div className="text-left max-w-md mx-auto bg-muted p-4 rounded-md">
            <code className="text-sm">
              CLOUDFLARE_R2_ACCOUNT_ID<br />
              CLOUDFLARE_R2_ACCESS_KEY_ID<br />
              CLOUDFLARE_R2_SECRET_ACCESS_KEY<br />
              CLOUDFLARE_R2_BUCKET_NAME<br />
              CLOUDFLARE_R2_PUBLIC_URL
            </code>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Media Library</h2>
              <p className="text-muted-foreground">Upload and manage images</p>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
                id="file-upload"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Image
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Media Grid */}
      {media.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-bold mb-2">No images yet</h3>
            <p className="text-muted-foreground mb-4">
              Upload your first image to get started
            </p>
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Image
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {media.map((item) => (
            <Card key={item.key} className="group relative overflow-hidden">
              <div className="aspect-square relative bg-muted">
                <img
                  src={item.url}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23ddd"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999">Image</text></svg>'
                  }}
                />
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPreviewItem(item)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => copyToClipboard(item.url, item.key)}
                  >
                    {copiedKey === item.key ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(item.key)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-3">
                <p className="text-sm font-medium truncate" title={item.name}>
                  {item.name}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                  <span>{formatFileSize(item.size)}</span>
                  <span>{formatDate(item.uploaded)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewItem?.name}</DialogTitle>
          </DialogHeader>
          {previewItem && (
            <div className="space-y-4">
              <div className="relative bg-muted rounded-lg overflow-hidden">
                <img
                  src={previewItem.url}
                  alt={previewItem.name}
                  className="w-full h-auto max-h-[60vh] object-contain mx-auto"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Size</p>
                  <p className="text-muted-foreground">{formatFileSize(previewItem.size)}</p>
                </div>
                <div>
                  <p className="font-medium">Uploaded</p>
                  <p className="text-muted-foreground">{formatDate(previewItem.uploaded)}</p>
                </div>
                <div className="col-span-2">
                  <p className="font-medium mb-2">URL</p>
                  <div className="flex gap-2">
                    <Input
                      value={previewItem.url}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(previewItem.url, previewItem.key)}
                    >
                      {copiedKey === previewItem.key ? (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

