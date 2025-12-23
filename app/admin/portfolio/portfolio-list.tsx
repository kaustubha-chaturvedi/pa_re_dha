"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useSession } from "next-auth/react"
import { Edit, Trash2, Plus, Eye, EyeOff, Loader2 } from "lucide-react"
import { MarkdownEditor } from "@/components/editor/markdown-editor"

interface CaseStudy {
  slug: string
  title: string
  description: string
  date: string
  draft: boolean
  category: string
  tags: string[]
  client: string
  modified: string
}

export function PortfolioList() {
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSlug, setEditingSlug] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const { toast } = useToast()
  const { data: session } = useSession()

  const loadCaseStudies = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/list-portfolio")
      if (!res.ok) {
        throw new Error("Failed to load case studies")
      }
      const data = await res.json()
      setCaseStudies(data.portfolio || [])
    } catch (error) {
      console.error("Error loading case studies:", error)
      toast({
        title: "Error",
        description: "Failed to load case studies",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCaseStudies()
  }, [])

  const handleDelete = async (slug: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return
    }

    try {
      const res = await fetch("/api/delete-portfolio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ slug }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to delete case study")
      }

      toast({
        title: "Deleted",
        description: "Case study has been deleted",
      })

      loadCaseStudies()
      if (editingSlug === slug) {
        setEditingSlug(null)
      }
    } catch (error) {
      console.error("Error deleting case study:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete case study",
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
    loadCaseStudies()
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
          filePathTemplate="apps/site/src/content/portfolio/{slug}.md"
          initialSlug={editingSlug || ""}
          initialContent=""
          initialFrontmatter={{
            date: new Date().toISOString().split("T")[0],
            draft: false,
            ...(session?.user?.name && { author: session.user.name }),
            ...(session?.user?.image && { authorImage: session.user.image }),
          }}
          editorTitle="Portfolio Case Study"
          editorDescription="Create or edit portfolio case studies"
          onSave={handleSave}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">All Case Studies ({caseStudies.length})</h3>
          <p className="text-sm text-muted-foreground">Manage your portfolio case studies</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Case Study
        </Button>
      </div>

      {caseStudies.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No case studies yet. Create your first case study!</p>
            <Button onClick={handleCreate} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Create Case Study
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {caseStudies.map((caseStudy) => (
            <Card key={caseStudy.slug}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{caseStudy.title}</CardTitle>
                      {caseStudy.draft && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                          <EyeOff className="h-3 w-3" />
                          Draft
                        </span>
                      )}
                    </div>
                    {caseStudy.description && (
                      <CardDescription className="mt-1">{caseStudy.description}</CardDescription>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      {caseStudy.client && (
                        <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-semibold">
                          {caseStudy.client}
                        </span>
                      )}
                      {caseStudy.category && (
                        <span className="px-2 py-0.5 rounded bg-secondary/10 text-secondary text-xs">
                          {caseStudy.category}
                        </span>
                      )}
                      {caseStudy.date && (
                        <span>{new Date(caseStudy.date).toLocaleDateString()}</span>
                      )}
                      {caseStudy.tags && caseStudy.tags.length > 0 && (
                        <span className="text-xs">
                          {caseStudy.tags.slice(0, 3).join(", ")}
                          {caseStudy.tags.length > 3 && ` +${caseStudy.tags.length - 3} more`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(caseStudy.slug)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(caseStudy.slug, caseStudy.title)}
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

