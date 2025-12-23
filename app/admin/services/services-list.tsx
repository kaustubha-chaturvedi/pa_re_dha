"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Edit, Trash2, Plus, Loader2 } from "lucide-react"
import { MarkdownEditor } from "@/components/editor/markdown-editor"

interface Service {
  slug: string
  title: string
  description: string
  date: string
  price: string
  tags: string[]
  order: number
  modified: string
}

export function ServicesList() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSlug, setEditingSlug] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const { toast } = useToast()

  const loadServices = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/list-services")
      if (!res.ok) {
        throw new Error("Failed to load services")
      }
      const data = await res.json()
      setServices(data.services || [])
    } catch (error) {
      console.error("Error loading services:", error)
      toast({
        title: "Error",
        description: "Failed to load services",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadServices()
  }, [])

  const handleDelete = async (slug: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return
    }

    try {
      const res = await fetch("/api/delete-service", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ slug }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to delete service")
      }

      toast({
        title: "Deleted",
        description: "Service has been deleted",
      })

      loadServices()
      if (editingSlug === slug) {
        setEditingSlug(null)
      }
    } catch (error) {
      console.error("Error deleting service:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete service",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (slug: string) => {
    setEditingSlug(slug)
    setShowCreate(false)
  }

  const handleCreate = () => {
    setShowCreate(true)
    setEditingSlug(null)
  }

  const handleSave = () => {
    loadServices()
    setEditingSlug(null)
    setShowCreate(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (showCreate || editingSlug) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => {
            setShowCreate(false)
            setEditingSlug(null)
          }}>
            ← Back to List
          </Button>
        </div>
        <MarkdownEditor
          key={editingSlug || 'new'}
          filePathTemplate="apps/site/src/content/services/{slug}.md"
          initialSlug={editingSlug || ""}
          initialContent=""
          initialFrontmatter={{
            order: 0,
          }}
          editorTitle="Service"
          editorDescription="Create or edit services"
          onSave={handleSave}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">All Services ({services.length})</h3>
          <p className="text-sm text-muted-foreground">Manage your services</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Service
        </Button>
      </div>

      {services.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No services yet. Create your first service!</p>
            <Button onClick={handleCreate} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Create Service
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {services.map((service) => (
            <Card key={service.slug}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{service.title}</CardTitle>
                    </div>
                    {service.description && (
                      <CardDescription className="mt-1">{service.description}</CardDescription>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      {service.price && (
                        <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-semibold">
                          {service.price}
                        </span>
                      )}
                      {service.order !== 999 && (
                        <span className="text-xs">Order: {service.order}</span>
                      )}
                      {service.date && (
                        <span>{new Date(service.date).toLocaleDateString()}</span>
                      )}
                      {service.tags && service.tags.length > 0 && (
                        <span className="text-xs">
                          {service.tags.slice(0, 3).join(", ")}
                          {service.tags.length > 3 && ` +${service.tags.length - 3} more`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(service.slug)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(service.slug, service.title)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

