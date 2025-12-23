"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, Eye, Edit, Loader2, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import matter from "gray-matter"

const PAGES = [
  { id: "home", name: "Home", path: "apps/site/src/content/pages/home.md", url: "/" },
  { id: "about", name: "About", path: "apps/site/src/content/pages/about.md", url: "/about" },
  { id: "contact", name: "Contact", path: "apps/site/src/content/pages/contact.md", url: "/contact" },
  { id: "careers", name: "Careers", path: "apps/site/src/content/pages/careers.md", url: "/careers" },
  { id: "blog-list", name: "Blog List", path: "apps/site/src/content/pages/blog-list.md", url: "/blog" },
  { id: "services-list", name: "Services List", path: "apps/site/src/content/pages/services-list.md", url: "/services" },
  { id: "portfolio", name: "Portfolio", path: "apps/site/src/content/pages/portfolio.md", url: "/portfolio" },
]

export function PageBuilder() {
  const [selectedPage, setSelectedPage] = useState<string>("home")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pageData, setPageData] = useState<any>(null)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState("")
  const [siteBaseUrl, setSiteBaseUrl] = useState("http://localhost:4321")
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const { toast } = useToast()

  const currentPage = PAGES.find(p => p.id === selectedPage)

  useEffect(() => {
    if (currentPage) {
      loadPageData()
      setPreviewUrl(`${siteBaseUrl}${currentPage.url}`)
    }
  }, [selectedPage, siteBaseUrl])

  const loadPageData = async () => {
    if (!currentPage) return
    
    setLoading(true)
    try {
      const res = await fetch("/api/fetch-file", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ path: currentPage.path }),
      })

      if (!res.ok) {
        throw new Error("Failed to fetch page data")
      }

      const data = await res.json()
      
      if (data.exists && data.content) {
        const parsed = matter(data.content)
        setPageData({
          frontmatter: parsed.data,
          content: parsed.content,
        })
      } else {
        setPageData({
          frontmatter: { title: currentPage.name },
          content: "",
        })
      }
    } catch (error) {
      console.error("Load error:", error)
      toast({
        title: "Failed to load page",
        description: error instanceof Error ? error.message : "Failed to fetch page data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateField = (path: string[], value: any) => {
    if (!pageData) return

    const newData = { ...pageData }
    let current: any = newData.frontmatter

    // Navigate to the nested field
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) {
        current[path[i]] = {}
      }
      current = current[path[i]]
    }

    // Set the value
    current[path[path.length - 1]] = value
    setPageData(newData)
  }

  const handleSave = async () => {
    if (!currentPage || !pageData) return

    setSaving(true)
    try {
      const markdown = matter.stringify(pageData.content, pageData.frontmatter)

      const res = await fetch("/api/commit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path: currentPage.path,
          content: markdown,
          message: `Update ${currentPage.name} page via builder`,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to save")
      }

      toast({
        title: "Saved successfully",
        description: "Your changes have been committed to the repository.",
      })

      // Reload preview
      if (iframeRef.current) {
        iframeRef.current.src = iframeRef.current.src
      }
    } catch (error) {
      console.error("Save error:", error)
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Failed to save changes",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const renderEditableFields = (data: any, path: string[] = []): React.ReactElement[] => {
    if (!data || typeof data !== "object") return []

    const fields: React.ReactElement[] = []

    for (const [key, value] of Object.entries(data)) {
      const currentPath = [...path, key]
      const fieldId = currentPath.join(".")

      if (typeof value === "string") {
        const isLongText = value.length > 100 || key.toLowerCase().includes("description") || key.toLowerCase().includes("content")
        fields.push(
          <div key={fieldId} className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1")}
            </label>
            {editingField === fieldId ? (
              <div className="space-y-2">
                {isLongText ? (
                  <textarea
                    value={value}
                    onChange={(e) => updateField(currentPath, e.target.value)}
                    onBlur={() => setEditingField(null)}
                    className="w-full px-3 py-2 border rounded-md min-h-[100px] font-mono text-sm"
                    autoFocus
                  />
                ) : (
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => updateField(currentPath, e.target.value)}
                    onBlur={() => setEditingField(null)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        setEditingField(null)
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-md"
                    autoFocus
                  />
                )}
                <div className="flex justify-end">
                  <Button size="sm" onClick={() => setEditingField(null)}>Done</Button>
                </div>
              </div>
            ) : (
              <div
                className={`px-3 py-2 border rounded-md bg-background cursor-pointer hover:bg-muted transition-colors ${isLongText ? "min-h-[60px]" : ""}`}
                onClick={() => setEditingField(fieldId)}
              >
                {value || <span className="text-muted-foreground italic">Click to edit</span>}
              </div>
            )}
          </div>
        )
      } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        fields.push(
          <Card key={fieldId} className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">
                {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderEditableFields(value, currentPath)}
            </CardContent>
          </Card>
        )
      } else if (Array.isArray(value)) {
        const addItem = () => {
          const newData = { ...pageData }
          let current: any = newData.frontmatter
          for (let i = 0; i < currentPath.length; i++) {
            current = current[currentPath[i]]
          }
          current.push({})
          setPageData(newData)
        }

        const removeItem = (index: number) => {
          const newData = { ...pageData }
          let current: any = newData.frontmatter
          for (let i = 0; i < currentPath.length; i++) {
            current = current[currentPath[i]]
          }
          current.splice(index, 1)
          setPageData(newData)
        }

        fields.push(
          <Card key={fieldId} className="mt-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1")}
                </CardTitle>
                <Button size="sm" variant="outline" onClick={addItem}>
                  + Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {value.map((item: any, index: number) => (
                <Card key={index} className="border-dashed relative">
                  <div className="absolute top-2 right-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeItem(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      Remove
                    </Button>
                  </div>
                  <CardContent className="pt-6 space-y-4">
                    {renderEditableFields(item, [...currentPath, index.toString()])}
                  </CardContent>
                </Card>
              ))}
              {value.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No items. Click "Add Item" to add one.
                </p>
              )}
            </CardContent>
          </Card>
        )
      }
    }

    return fields
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/">
              <h1 className="text-2xl font-bold">Page Builder</h1>
            </Link>
            <Select value={selectedPage} onValueChange={setSelectedPage}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGES.map((page) => (
                  <SelectItem key={page.id} value={page.id}>
                    {page.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadPageData}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reload
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Content Editor */}
        <div className="w-96 border-r bg-background overflow-y-auto">
          <div className="p-4 space-y-4">
            <h2 className="text-lg font-semibold">Page Content</h2>
            {pageData && (
              <div className="space-y-4">
                {renderEditableFields(pageData.frontmatter)}
                
                {/* Markdown Content Editor */}
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg">Markdown Content</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {editingField === "content" ? (
                      <div className="space-y-2">
                        <textarea
                          value={pageData.content}
                          onChange={(e) => setPageData({ ...pageData, content: e.target.value })}
                          onBlur={() => setEditingField(null)}
                          className="w-full px-3 py-2 border rounded-md min-h-[200px] font-mono text-sm"
                          autoFocus
                        />
                        <div className="flex justify-end">
                          <Button size="sm" onClick={() => setEditingField(null)}>Done</Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="px-3 py-2 border rounded-md bg-background cursor-pointer hover:bg-muted transition-colors min-h-[100px]"
                        onClick={() => setEditingField("content")}
                      >
                        {pageData.content ? (
                          <pre className="text-xs text-muted-foreground whitespace-pre-wrap">{pageData.content.substring(0, 200)}{pageData.content.length > 200 ? "..." : ""}</pre>
                        ) : (
                          <span className="text-muted-foreground italic">Click to edit markdown content</span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 flex flex-col bg-muted">
          <div className="border-b bg-background px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Live Preview</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={siteBaseUrl}
                onChange={(e) => {
                  setSiteBaseUrl(e.target.value)
                  if (currentPage) {
                    setPreviewUrl(`${e.target.value}${currentPage.url}`)
                  }
                }}
                className="text-xs px-2 py-1 border rounded w-48"
                placeholder="http://localhost:4321"
              />
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                Open in new tab
              </a>
            </div>
          </div>
          <div className="flex-1 relative">
            <iframe
              ref={iframeRef}
              src={previewUrl}
              className="w-full h-full border-0"
              title="Page Preview"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

