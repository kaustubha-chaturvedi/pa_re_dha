"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ImageInput } from "@/components/ui/image-input"
import { Save, Loader2, RefreshCw, Plus, Minus, ChevronDown, ChevronRight } from "lucide-react"
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

export function VisualEditor() {
  const [selectedPage, setSelectedPage] = useState<string>("home")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pageData, setPageData] = useState<any>(null)
  const [previewUrl, setPreviewUrl] = useState("")
  const [siteBaseUrl, setSiteBaseUrl] = useState("http://localhost:4321")
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  const currentPage = PAGES.find(p => p.id === selectedPage)

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  const renderCollapsibleSection = (title: string, sectionKey: string, children: React.ReactNode) => {
    const isExpanded = expandedSections.has(sectionKey)
    return (
      <Card>
        <CardHeader 
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => toggleSection(sectionKey)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{title}</CardTitle>
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        {isExpanded && (
          <CardContent className="space-y-4">
            {children}
          </CardContent>
        )}
      </Card>
    )
  }

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
      // Use local fetch in development (when on localhost), GitHub API in production
      const isDevelopment = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      const apiEndpoint = isDevelopment ? "/api/fetch-local" : "/api/fetch-file"
      
      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ path: currentPage.path }),
      })

      const data = await res.json()
      
      if (!res.ok) {
        // If it's a 404, use minimal structure
        if (res.status === 404 || !data.exists) {
          setPageData({
            frontmatter: { title: currentPage?.name || "Page" },
            content: "",
          })
          return
        }
        // For other errors, show the error message
        throw new Error(data.error || data.details || "Failed to fetch page data")
      }

      if (data.exists && data.content && data.content.trim()) {
        try {
          const parsed = matter(data.content)
          // Convert old format clientLogos to new format if needed
          const frontmatter = { ...parsed.data }
          if (Array.isArray(frontmatter.clientLogos)) {
            frontmatter.clientLogos = {
              title: "Trusted by Industry Leaders",
              logos: frontmatter.clientLogos
            }
          }
          setPageData({
            frontmatter: frontmatter,
            content: parsed.content || "",
          })
        } catch (parseError) {
          console.error("Parse error:", parseError)
          // If parsing fails, use empty structure
          setPageData({
            frontmatter: { title: currentPage?.name || "Page" },
            content: data.content || "",
          })
          toast({
            title: "Parse warning",
            description: "File loaded but had parsing issues. Please check the file format.",
            variant: "destructive",
          })
        }
      } else {
        // File doesn't exist or is empty - use minimal structure
        setPageData({
          frontmatter: { title: currentPage?.name || "Page" },
          content: "",
        })
      }
    } catch (error) {
      console.error("Load error:", error)
      // On error, use minimal structure
      setPageData({
        frontmatter: { title: currentPage?.name || "Page" },
        content: "",
      })
      toast({
        title: "Failed to load",
        description: error instanceof Error ? error.message : "Could not load page data.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateField = (path: string[], value: any) => {
    if (!pageData) return

    const newData = JSON.parse(JSON.stringify(pageData))
    let current: any = newData.frontmatter

    // Special handling for old format clientLogos (direct array access)
    if (path[0] === 'clientLogos' && path.length === 2 && !isNaN(Number(path[1]))) {
      // Updating clientLogos[index] in old format
      if (!Array.isArray(current.clientLogos)) {
        // Convert to new format
        current.clientLogos = {
          title: "Trusted by Industry Leaders",
          logos: current.clientLogos || []
        }
      }
      const index = Number(path[1])
      if (!Array.isArray(current.clientLogos.logos)) {
        current.clientLogos.logos = []
      }
      if (current.clientLogos.logos[index] === undefined) {
        current.clientLogos.logos[index] = ""
      }
      current.clientLogos.logos[index] = value
      setPageData(newData)
      return
    }

    // Navigate to the nested field, handling array indices
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i]
      const isArrayIndex = !isNaN(Number(key))
      
      if (isArrayIndex) {
        const index = Number(key)
        if (!Array.isArray(current)) {
          current = []
        }
        if (current[index] === undefined || current[index] === null) {
          // For string arrays, use empty string; for object arrays, use empty object
          const nextKey = path[i + 1]
          current[index] = !isNaN(Number(nextKey)) ? "" : {}
        }
        current = current[index]
      } else {
        if (!current || typeof current !== 'object' || Array.isArray(current)) {
          current = {}
        }
        if (current[key] === undefined || current[key] === null) {
          current[key] = {}
        }
        current = current[key]
      }
    }

    // Set the value
    const lastKey = path[path.length - 1]
    const isLastArrayIndex = !isNaN(Number(lastKey))
    
    if (isLastArrayIndex) {
      const index = Number(lastKey)
      if (!Array.isArray(current)) {
        current = []
      }
      current[index] = value
    } else {
      if (!current || typeof current !== 'object' || Array.isArray(current)) {
        current = {}
      }
      current[lastKey] = value
    }
    
    setPageData(newData)
  }

  const addArrayItem = (path: string[], template: any = {}) => {
    if (!pageData) return

    const newData = JSON.parse(JSON.stringify(pageData))
    let current: any = newData.frontmatter

    for (const key of path) {
      if (!current[key]) {
        current[key] = []
      }
      current = current[key]
    }

    if (!Array.isArray(current)) {
      current = []
    }

    current.push(template)
    setPageData(newData)
  }

  const removeArrayItem = (path: string[], index: number) => {
    if (!pageData) return

    const newData = JSON.parse(JSON.stringify(pageData))
    let current: any = newData.frontmatter

    for (const key of path) {
      current = current[key]
    }

    if (Array.isArray(current)) {
      current.splice(index, 1)
      setPageData(newData)
    }
  }

  const getFieldValue = (path: string[]): any => {
    if (!pageData) return ""
    let current: any = pageData.frontmatter
    for (const key of path) {
      if (current && typeof current === 'object') {
        const isArrayIndex = !isNaN(Number(key))
        if (isArrayIndex && Array.isArray(current)) {
          current = current[Number(key)]
        } else if (!isArrayIndex) {
          current = current[key]
        } else {
          return ""
        }
      } else {
        return ""
      }
    }
    return current || ""
  }

  const handleSave = async () => {
    if (!currentPage || !pageData) return

    setSaving(true)
    try {
      const markdown = matter.stringify(pageData.content, pageData.frontmatter)

      // Use local save in development (when on localhost), GitHub commit in production
      const isDevelopment = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      const apiEndpoint = isDevelopment ? "/api/save-local" : "/api/commit"
      
      const requestBody = isDevelopment 
        ? {
            path: currentPage.path,
            content: markdown,
          }
        : {
            path: currentPage.path,
            content: markdown,
            message: `Update ${currentPage.name} page via visual editor`,
          }

      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || error.details || "Failed to save")
      }

      const result = await res.json()
      toast({
        title: "Saved successfully",
        description: isDevelopment 
          ? `File saved to ${currentPage.path}. If changes don't appear: 1) Restart Astro dev server, or 2) Hard refresh browser (Ctrl+Shift+R)`
          : "Your changes have been committed to the repository.",
        duration: 5000,
      })

      // Reload preview after a delay to allow Astro to process the file change
      // Note: Astro may need a manual restart to pick up content collection changes
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = iframeRef.current.src + '?t=' + Date.now()
        }
      }, 2000)
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

  const renderFieldEditor = (label: string, path: string[], type: 'text' | 'textarea' | 'url' | 'number' | 'image' = 'text') => {
    const value = getFieldValue(path)
    return (
      <div className="space-y-2">
        {type === 'image' ? (
          <ImageInput
            label={label}
            value={value}
            onChange={(val) => updateField(path, val)}
            placeholder="https://example.com/image.jpg"
            description="Click 'Browse' to select from media library or upload a new image."
          />
        ) : (
          <>
            <Label>{label}</Label>
            {type === 'textarea' ? (
              <Textarea
                value={value}
                onChange={(e) => updateField(path, e.target.value)}
                rows={4}
                className="font-mono text-sm"
              />
            ) : type === 'number' ? (
              <Input
                type="number"
                value={value}
                onChange={(e) => updateField(path, e.target.value ? Number(e.target.value) : undefined)}
              />
            ) : (
              <Input
                type={type === 'url' ? 'url' : 'text'}
                value={value}
                onChange={(e) => updateField(path, e.target.value)}
              />
            )}
          </>
        )}
      </div>
    )
  }

  const renderArrayEditor = (label: string, path: string[], itemTemplate: any, renderItem: (item: any, index: number) => React.ReactNode) => {
    const items = getFieldValue(path) || []
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{label}</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addArrayItem(path, itemTemplate)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.isArray(items) && items.map((item, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Item {index + 1}</CardTitle>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeArrayItem(path, index)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {renderItem(item, index)}
              </CardContent>
            </Card>
          ))}
          {(!Array.isArray(items) || items.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-4">No items yet. Click "Add Item" to create one.</p>
          )}
        </CardContent>
      </Card>
    )
  }

  const iframeRef = useRef<HTMLIFrameElement>(null)

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
            {selectedPage === 'home' && pageData && (
              <>
                {renderCollapsibleSection("Hero Section", "hero", (
                  <>
                    {renderFieldEditor("Badge", ["hero", "badge"])}
                    {renderFieldEditor("Title", ["hero", "title"])}
                    {renderFieldEditor("Subtitle", ["hero", "subtitle"], "textarea")}
                    {renderFieldEditor("Primary Button Text", ["hero", "primaryButton", "text"])}
                    {renderFieldEditor("Primary Button Link", ["hero", "primaryButton", "link"], "url")}
                    {renderFieldEditor("Secondary Button Text", ["hero", "secondaryButton", "text"])}
                    {renderFieldEditor("Secondary Button Link", ["hero", "secondaryButton", "link"], "url")}
                  </>
                ))}

                {renderCollapsibleSection("Features Section", "features", (
                  <>
                    {renderFieldEditor("Section Title", ["features", "title"])}
                    {renderFieldEditor("Section Description", ["features", "description"], "textarea")}
                  </>
                ))}

                {expandedSections.has("features") && renderArrayEditor(
                  "Feature Items",
                  ["features", "items"],
                  { icon: "star", title: "", description: "" },
                  (item, index) => (
                    <div className="space-y-4">
                      {renderFieldEditor("Icon", ["features", "items", index.toString(), "icon"])}
                      {renderFieldEditor("Title", ["features", "items", index.toString(), "title"])}
                      {renderFieldEditor("Description", ["features", "items", index.toString(), "description"], "textarea")}
                    </div>
                  )
                )}

                {renderCollapsibleSection("About Section", "about", (
                  <>
                    {renderFieldEditor("Title", ["about", "title"])}
                    {renderFieldEditor("Description", ["about", "description"], "textarea")}
                    {renderFieldEditor("Image URL", ["about", "image"], "image")}
                    {renderFieldEditor("Primary Button Text", ["about", "primaryButton", "text"])}
                    {renderFieldEditor("Primary Button Link", ["about", "primaryButton", "link"], "url")}
                    {renderFieldEditor("Secondary Button Text", ["about", "secondaryButton", "text"])}
                    {renderFieldEditor("Secondary Button Link", ["about", "secondaryButton", "link"], "url")}
                  </>
                ))}

                {renderCollapsibleSection("Services Section", "services", (
                  <>
                    {renderFieldEditor("Section Title", ["services", "title"])}
                    {renderFieldEditor("Section Description", ["services", "description"], "textarea")}
                    {renderFieldEditor("Limit", ["services", "limit"], "number")}
                    {renderFieldEditor("Button Text", ["services", "button", "text"])}
                    {renderFieldEditor("Button Link", ["services", "button", "link"], "url")}
                  </>
                ))}

                {renderCollapsibleSection("Process Section", "process", (
                  <>
                    {renderFieldEditor("Section Title", ["process", "title"])}
                    {renderFieldEditor("Section Description", ["process", "description"], "textarea")}
                    {renderFieldEditor("Button Text", ["process", "button", "text"])}
                    {renderFieldEditor("Button Link", ["process", "button", "link"], "url")}
                  </>
                ))}

                {expandedSections.has("process") && renderArrayEditor(
                  "Process Steps",
                  ["process", "steps"],
                  { icon: "star", title: "", description: "" },
                  (item, index) => (
                    <div className="space-y-4">
                      {renderFieldEditor("Icon", ["process", "steps", index.toString(), "icon"])}
                      {renderFieldEditor("Title", ["process", "steps", index.toString(), "title"])}
                      {renderFieldEditor("Description", ["process", "steps", index.toString(), "description"], "textarea")}
                    </div>
                  )
                )}

                {renderCollapsibleSection("Client Logos Section", "clientLogos", (
                  <>
                    {(() => {
                      // Handle both old format (array) and new format (object with title + logos)
                      const clientLogosData = getFieldValue(["clientLogos"])
                      const isOldFormat = Array.isArray(clientLogosData)
                      const logos = isOldFormat ? clientLogosData : (getFieldValue(["clientLogos", "logos"]) || [])
                      const title = isOldFormat ? undefined : getFieldValue(["clientLogos", "title"])
                      
                      return (
                        <>
                          {!isOldFormat && renderFieldEditor("Section Title", ["clientLogos", "title"])}
                          {expandedSections.has("clientLogos") && (
                            <Card>
                              <CardHeader>
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-lg">Client Logos</CardTitle>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      // Convert old format to new format if needed
                                      if (isOldFormat && pageData) {
                                        const newData = JSON.parse(JSON.stringify(pageData))
                                        newData.frontmatter.clientLogos = {
                                          title: "Trusted by Industry Leaders",
                                          logos: [...clientLogosData, ""]
                                        }
                                        setPageData(newData)
                                      } else {
                                        addArrayItem(["clientLogos", "logos"], "")
                                      }
                                    }}
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Logo
                                  </Button>
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                {Array.isArray(logos) && logos.map((logo: string, index: number) => (
                                  <Card key={index}>
                                    <CardHeader>
                                      <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm">Logo {index + 1}</CardTitle>
                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          onClick={() => {
                                            if (isOldFormat) {
                                              // Handle old format removal
                                              const newData = JSON.parse(JSON.stringify(pageData))
                                              const logosArray = [...newData.frontmatter.clientLogos]
                                              logosArray.splice(index, 1)
                                              newData.frontmatter.clientLogos = logosArray
                                              setPageData(newData)
                                            } else {
                                              removeArrayItem(["clientLogos", "logos"], index)
                                            }
                                          }}
                                        >
                                          <Minus className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </CardHeader>
                                    <CardContent>
                                      {isOldFormat ? (
                                        renderFieldEditor(`Logo URL`, ["clientLogos", index.toString()], "image")
                                      ) : (
                                        renderFieldEditor(`Logo URL`, ["clientLogos", "logos", index.toString()], "image")
                                      )}
                                    </CardContent>
                                  </Card>
                                ))}
                                {(!Array.isArray(logos) || logos.length === 0) && (
                                  <p className="text-sm text-muted-foreground text-center py-4">No logos yet. Click "Add Logo" to create one.</p>
                                )}
                              </CardContent>
                            </Card>
                          )}
                        </>
                      )
                    })()}
                  </>
                ))}

                {renderCollapsibleSection("FAQ Section", "faq", (
                  <>
                    {renderFieldEditor("Section Title", ["faq", "title"])}
                    {renderFieldEditor("Section Description", ["faq", "description"], "textarea")}
                  </>
                ))}

                {expandedSections.has("faq") && renderArrayEditor(
                  "FAQ Items",
                  ["faq", "items"],
                  { question: "", answer: "" },
                  (item, index) => (
                    <div className="space-y-4">
                      {renderFieldEditor("Question", ["faq", "items", index.toString(), "question"])}
                      {renderFieldEditor("Answer", ["faq", "items", index.toString(), "answer"], "textarea")}
                    </div>
                  )
                )}

                {renderCollapsibleSection("CTA Section", "cta", (
                  <>
                    {renderFieldEditor("Title", ["cta", "title"])}
                    {renderFieldEditor("Description", ["cta", "description"], "textarea")}
                  </>
                ))}
              </>
            )}

            {selectedPage === 'about' && pageData && (
              <>
                {renderCollapsibleSection("Hero Section", "hero", (
                  <>
                    {renderFieldEditor("Badge", ["hero", "badge"])}
                    {renderFieldEditor("Title", ["hero", "title"])}
                    {renderFieldEditor("Subtitle", ["hero", "subtitle"], "textarea")}
                    {renderFieldEditor("Primary Button Text", ["hero", "primaryButton", "text"])}
                    {renderFieldEditor("Primary Button Link", ["hero", "primaryButton", "link"], "url")}
                    {renderFieldEditor("Secondary Button Text", ["hero", "secondaryButton", "text"])}
                    {renderFieldEditor("Secondary Button Link", ["hero", "secondaryButton", "link"], "url")}
                  </>
                ))}
                {renderCollapsibleSection("Mission Section", "mission", (
                  <>
                    {renderFieldEditor("Title", ["mission", "title"])}
                    {renderFieldEditor("Description", ["mission", "description"], "textarea")}
                    {renderFieldEditor("Image URL", ["mission", "image"], "image")}
                    {renderFieldEditor("Button Text", ["mission", "button", "text"])}
                    {renderFieldEditor("Button Link", ["mission", "button", "link"], "url")}
                  </>
                ))}
                {expandedSections.has("mission") && renderArrayEditor(
                  "Mission Highlights",
                  ["mission", "highlights"],
                  { icon: "star", title: "", description: "" },
                  (item, index) => (
                    <div className="space-y-4">
                      {renderFieldEditor("Icon", ["mission", "highlights", index.toString(), "icon"])}
                      {renderFieldEditor("Title", ["mission", "highlights", index.toString(), "title"])}
                      {renderFieldEditor("Description", ["mission", "highlights", index.toString(), "description"], "textarea")}
                    </div>
                  )
                )}
                {renderCollapsibleSection("Values Section", "values", (
                  <>
                    {renderFieldEditor("Title", ["values", "title"])}
                    {renderFieldEditor("Description", ["values", "description"], "textarea")}
                  </>
                ))}
                {expandedSections.has("values") && renderArrayEditor(
                  "Value Items",
                  ["values", "items"],
                  { icon: "star", title: "", description: "" },
                  (item, index) => (
                    <div className="space-y-4">
                      {renderFieldEditor("Icon", ["values", "items", index.toString(), "icon"])}
                      {renderFieldEditor("Title", ["values", "items", index.toString(), "title"])}
                      {renderFieldEditor("Description", ["values", "items", index.toString(), "description"], "textarea")}
                    </div>
                  )
                )}
                {renderCollapsibleSection("Team Section", "team", (
                  <>
                    {renderFieldEditor("Title", ["team", "title"])}
                    {renderFieldEditor("Description", ["team", "description"], "textarea")}
                    {renderFieldEditor("Button Text", ["team", "button", "text"])}
                    {renderFieldEditor("Button Link", ["team", "button", "link"], "url")}
                  </>
                ))}
                {expandedSections.has("team") && renderArrayEditor(
                  "Team Members",
                  ["team", "members"],
                  { name: "", role: "", image: "", bio: "" },
                  (item, index) => (
                    <div className="space-y-4">
                      {renderFieldEditor("Name", ["team", "members", index.toString(), "name"])}
                      {renderFieldEditor("Role", ["team", "members", index.toString(), "role"])}
                      {renderFieldEditor("Image URL", ["team", "members", index.toString(), "image"], "image")}
                      {renderFieldEditor("Bio", ["team", "members", index.toString(), "bio"], "textarea")}
                    </div>
                  )
                )}
                {renderCollapsibleSection("Journey Section", "journey", (
                  <>
                    {renderFieldEditor("Title", ["journey", "title"])}
                    {renderFieldEditor("Description", ["journey", "description"], "textarea")}
                  </>
                ))}
                {expandedSections.has("journey") && renderArrayEditor(
                  "Milestones",
                  ["journey", "milestones"],
                  { year: "", title: "", description: "" },
                  (item, index) => (
                    <div className="space-y-4">
                      {renderFieldEditor("Year", ["journey", "milestones", index.toString(), "year"])}
                      {renderFieldEditor("Title", ["journey", "milestones", index.toString(), "title"])}
                      {renderFieldEditor("Description", ["journey", "milestones", index.toString(), "description"], "textarea")}
                    </div>
                  )
                )}
                {renderCollapsibleSection("CTA Section", "cta", (
                  <>
                    {renderFieldEditor("Title", ["cta", "title"])}
                    {renderFieldEditor("Description", ["cta", "description"], "textarea")}
                    {renderFieldEditor("Primary Button Text", ["cta", "primaryButton", "text"])}
                    {renderFieldEditor("Primary Button Link", ["cta", "primaryButton", "link"], "url")}
                    {renderFieldEditor("Secondary Button Text", ["cta", "secondaryButton", "text"])}
                    {renderFieldEditor("Secondary Button Link", ["cta", "secondaryButton", "link"], "url")}
                  </>
                ))}
                {renderCollapsibleSection("FAQ Section", "faq", (
                  <>
                    {renderFieldEditor("Title", ["faq", "title"])}
                    {renderFieldEditor("Description", ["faq", "description"], "textarea")}
                  </>
                ))}
                {expandedSections.has("faq") && renderArrayEditor(
                  "FAQ Items",
                  ["faq", "items"],
                  { question: "", answer: "" },
                  (item, index) => (
                    <div className="space-y-4">
                      {renderFieldEditor("Question", ["faq", "items", index.toString(), "question"])}
                      {renderFieldEditor("Answer", ["faq", "items", index.toString(), "answer"], "textarea")}
                    </div>
                  )
                )}
              </>
            )}

            {selectedPage === 'contact' && pageData && (
              <>
                {renderCollapsibleSection("Hero Section", "hero", (
                  <>
                    {renderFieldEditor("Badge", ["hero", "badge"])}
                    {renderFieldEditor("Title", ["hero", "title"])}
                    {renderFieldEditor("Subtitle", ["hero", "subtitle"], "textarea")}
                    {renderFieldEditor("Primary Button Text", ["hero", "primaryButton", "text"])}
                    {renderFieldEditor("Primary Button Link", ["hero", "primaryButton", "link"], "url")}
                    {renderFieldEditor("Secondary Button Text", ["hero", "secondaryButton", "text"])}
                    {renderFieldEditor("Secondary Button Link", ["hero", "secondaryButton", "link"], "url")}
                  </>
                ))}
                {renderCollapsibleSection("Contact Info Section", "contactInfo", (
                  <>
                    {renderFieldEditor("Title", ["contactInfo", "title"])}
                    {renderFieldEditor("Description", ["contactInfo", "description"], "textarea")}
                    {renderFieldEditor("Image URL", ["contactInfo", "image"], "image")}
                  </>
                ))}
                {expandedSections.has("contactInfo") && renderArrayEditor(
                  "Contact Items",
                  ["contactInfo", "items"],
                  { icon: "email", title: "", value: "" },
                  (item, index) => (
                    <div className="space-y-4">
                      {renderFieldEditor("Icon", ["contactInfo", "items", index.toString(), "icon"])}
                      {renderFieldEditor("Title", ["contactInfo", "items", index.toString(), "title"])}
                      {renderFieldEditor("Value", ["contactInfo", "items", index.toString(), "value"])}
                    </div>
                  )
                )}
                {renderCollapsibleSection("Contact Form Section", "contactForm", (
                  <>
                    {renderFieldEditor("Title", ["contactForm", "title"])}
                    {renderFieldEditor("Description", ["contactForm", "description"], "textarea")}
                  </>
                ))}
                {renderCollapsibleSection("CTA Section", "cta", (
                  <>
                    {renderFieldEditor("Title", ["cta", "title"])}
                    {renderFieldEditor("Description", ["cta", "description"], "textarea")}
                    {renderFieldEditor("Primary Button Text", ["cta", "primaryButton", "text"])}
                    {renderFieldEditor("Primary Button Link", ["cta", "primaryButton", "link"], "url")}
                    {renderFieldEditor("Secondary Button Text", ["cta", "secondaryButton", "text"])}
                    {renderFieldEditor("Secondary Button Link", ["cta", "secondaryButton", "link"], "url")}
                  </>
                ))}
              </>
            )}

            {selectedPage === 'careers' && pageData && (
              <>
                {renderCollapsibleSection("Hero Section", "hero", (
                  <>
                    {renderFieldEditor("Badge", ["hero", "badge"])}
                    {renderFieldEditor("Title", ["hero", "title"])}
                    {renderFieldEditor("Subtitle", ["hero", "subtitle"], "textarea")}
                    {renderFieldEditor("Primary Button Text", ["hero", "primaryButton", "text"])}
                    {renderFieldEditor("Primary Button Link", ["hero", "primaryButton", "link"], "url")}
                    {renderFieldEditor("Secondary Button Text", ["hero", "secondaryButton", "text"])}
                    {renderFieldEditor("Secondary Button Link", ["hero", "secondaryButton", "link"], "url")}
                  </>
                ))}
                {renderCollapsibleSection("Careers Intro Section", "careers", (
                  <>
                    {renderFieldEditor("Title", ["careers", "title"])}
                    {renderFieldEditor("Description", ["careers", "description"], "textarea")}
                    {renderFieldEditor("Image URL", ["careers", "image"], "image")}
                  </>
                ))}
                {expandedSections.has("careers") && renderArrayEditor(
                  "Career Highlights",
                  ["careers", "highlights"],
                  { icon: "star", title: "", description: "" },
                  (item, index) => (
                    <div className="space-y-4">
                      {renderFieldEditor("Icon", ["careers", "highlights", index.toString(), "icon"])}
                      {renderFieldEditor("Title", ["careers", "highlights", index.toString(), "title"])}
                      {renderFieldEditor("Description", ["careers", "highlights", index.toString(), "description"], "textarea")}
                    </div>
                  )
                )}
                {renderCollapsibleSection("Open Positions Section", "openPositions", (
                  <>
                    {renderFieldEditor("Title", ["openPositions", "title"])}
                    {renderFieldEditor("Description", ["openPositions", "description"], "textarea")}
                    {renderFieldEditor("No Positions Message", ["openPositions", "noPositionsMessage"], "textarea")}
                    {renderFieldEditor("Button Text", ["openPositions", "button", "text"])}
                    {renderFieldEditor("Button Link", ["openPositions", "button", "link"], "url")}
                  </>
                ))}
                {expandedSections.has("openPositions") && renderArrayEditor(
                  "Positions",
                  ["openPositions", "positions"],
                  { title: "", type: "", location: "", department: "", link: "" },
                  (item, index) => (
                    <div className="space-y-4">
                      {renderFieldEditor("Title", ["openPositions", "positions", index.toString(), "title"])}
                      {renderFieldEditor("Type", ["openPositions", "positions", index.toString(), "type"])}
                      {renderFieldEditor("Location", ["openPositions", "positions", index.toString(), "location"])}
                      {renderFieldEditor("Department", ["openPositions", "positions", index.toString(), "department"])}
                      {renderFieldEditor("Link", ["openPositions", "positions", index.toString(), "link"], "url")}
                    </div>
                  )
                )}
                {renderCollapsibleSection("CTA Section", "cta", (
                  <>
                    {renderFieldEditor("Title", ["cta", "title"])}
                    {renderFieldEditor("Description", ["cta", "description"], "textarea")}
                    {renderFieldEditor("Primary Button Text", ["cta", "primaryButton", "text"])}
                    {renderFieldEditor("Primary Button Link", ["cta", "primaryButton", "link"], "url")}
                    {renderFieldEditor("Secondary Button Text", ["cta", "secondaryButton", "text"])}
                    {renderFieldEditor("Secondary Button Link", ["cta", "secondaryButton", "link"], "url")}
                  </>
                ))}
              </>
            )}

            {selectedPage === 'blog-list' && pageData && (
              <>
                {renderCollapsibleSection("Hero Section", "hero", (
                  <>
                    {renderFieldEditor("Badge", ["hero", "badge"])}
                    {renderFieldEditor("Title", ["hero", "title"])}
                    {renderFieldEditor("Subtitle", ["hero", "subtitle"], "textarea")}
                    {renderFieldEditor("Primary Button Text", ["hero", "primaryButton", "text"])}
                    {renderFieldEditor("Primary Button Link", ["hero", "primaryButton", "link"], "url")}
                    {renderFieldEditor("Secondary Button Text", ["hero", "secondaryButton", "text"])}
                    {renderFieldEditor("Secondary Button Link", ["hero", "secondaryButton", "link"], "url")}
                  </>
                ))}
                {renderCollapsibleSection("FAQ Section", "faq", (
                  <>
                    {renderFieldEditor("Section Title", ["faq", "title"])}
                    {renderFieldEditor("Section Description", ["faq", "description"], "textarea")}
                  </>
                ))}
                {expandedSections.has("faq") && renderArrayEditor(
                  "FAQ Items",
                  ["faq", "items"],
                  { question: "", answer: "" },
                  (item, index) => (
                    <div className="space-y-4">
                      {renderFieldEditor("Question", ["faq", "items", index.toString(), "question"])}
                      {renderFieldEditor("Answer", ["faq", "items", index.toString(), "answer"], "textarea")}
                    </div>
                  )
                )}
                {renderCollapsibleSection("CTA Section", "cta", (
                  <>
                    {renderFieldEditor("Title", ["cta", "title"])}
                    {renderFieldEditor("Description", ["cta", "description"], "textarea")}
                    {renderFieldEditor("Primary Button Text", ["cta", "primaryButton", "text"])}
                    {renderFieldEditor("Primary Button Link", ["cta", "primaryButton", "link"], "url")}
                    {renderFieldEditor("Secondary Button Text", ["cta", "secondaryButton", "text"])}
                    {renderFieldEditor("Secondary Button Link", ["cta", "secondaryButton", "link"], "url")}
                  </>
                ))}
              </>
            )}

            {selectedPage === 'services-list' && pageData && (
              <>
                {renderCollapsibleSection("Hero Section", "hero", (
                  <>
                    {renderFieldEditor("Badge", ["hero", "badge"])}
                    {renderFieldEditor("Title", ["hero", "title"])}
                    {renderFieldEditor("Subtitle", ["hero", "subtitle"], "textarea")}
                    {renderFieldEditor("Primary Button Text", ["hero", "primaryButton", "text"])}
                    {renderFieldEditor("Primary Button Link", ["hero", "primaryButton", "link"], "url")}
                    {renderFieldEditor("Secondary Button Text", ["hero", "secondaryButton", "text"])}
                    {renderFieldEditor("Secondary Button Link", ["hero", "secondaryButton", "link"], "url")}
                  </>
                ))}
                {renderCollapsibleSection("FAQ Section", "faq", (
                  <>
                    {renderFieldEditor("Section Title", ["faq", "title"])}
                    {renderFieldEditor("Section Description", ["faq", "description"], "textarea")}
                  </>
                ))}
                {expandedSections.has("faq") && renderArrayEditor(
                  "FAQ Items",
                  ["faq", "items"],
                  { question: "", answer: "" },
                  (item, index) => (
                    <div className="space-y-4">
                      {renderFieldEditor("Question", ["faq", "items", index.toString(), "question"])}
                      {renderFieldEditor("Answer", ["faq", "items", index.toString(), "answer"], "textarea")}
                    </div>
                  )
                )}
                {renderCollapsibleSection("CTA Section", "cta", (
                  <>
                    {renderFieldEditor("Title", ["cta", "title"])}
                    {renderFieldEditor("Description", ["cta", "description"], "textarea")}
                    {renderFieldEditor("Primary Button Text", ["cta", "primaryButton", "text"])}
                    {renderFieldEditor("Primary Button Link", ["cta", "primaryButton", "link"], "url")}
                    {renderFieldEditor("Secondary Button Text", ["cta", "secondaryButton", "text"])}
                    {renderFieldEditor("Secondary Button Link", ["cta", "secondaryButton", "link"], "url")}
                  </>
                ))}
              </>
            )}

            {selectedPage === 'portfolio' && pageData && (
              <>
                {renderCollapsibleSection("Hero Section", "hero", (
                  <>
                    {renderFieldEditor("Badge", ["hero", "badge"])}
                    {renderFieldEditor("Title", ["hero", "title"])}
                    {renderFieldEditor("Subtitle", ["hero", "subtitle"], "textarea")}
                    {renderFieldEditor("Primary Button Text", ["hero", "primaryButton", "text"])}
                    {renderFieldEditor("Primary Button Link", ["hero", "primaryButton", "link"], "url")}
                    {renderFieldEditor("Secondary Button Text", ["hero", "secondaryButton", "text"])}
                    {renderFieldEditor("Secondary Button Link", ["hero", "secondaryButton", "link"], "url")}
                  </>
                ))}
                {renderCollapsibleSection("FAQ Section", "faq", (
                  <>
                    {renderFieldEditor("Section Title", ["faq", "title"])}
                    {renderFieldEditor("Section Description", ["faq", "description"], "textarea")}
                  </>
                ))}
                {expandedSections.has("faq") && renderArrayEditor(
                  "FAQ Items",
                  ["faq", "items"],
                  { question: "", answer: "" },
                  (item, index) => (
                    <div className="space-y-4">
                      {renderFieldEditor("Question", ["faq", "items", index.toString(), "question"])}
                      {renderFieldEditor("Answer", ["faq", "items", index.toString(), "answer"], "textarea")}
                    </div>
                  )
                )}
                {renderCollapsibleSection("CTA Section", "cta", (
                  <>
                    {renderFieldEditor("Title", ["cta", "title"])}
                    {renderFieldEditor("Description", ["cta", "description"], "textarea")}
                    {renderFieldEditor("Primary Button Text", ["cta", "primaryButton", "text"])}
                    {renderFieldEditor("Primary Button Link", ["cta", "primaryButton", "link"], "url")}
                    {renderFieldEditor("Secondary Button Text", ["cta", "secondaryButton", "text"])}
                    {renderFieldEditor("Secondary Button Link", ["cta", "secondaryButton", "link"], "url")}
                  </>
                ))}
              </>
            )}

            {!['home', 'about', 'contact', 'careers', 'blog-list', 'services-list', 'portfolio'].includes(selectedPage) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Page Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={pageData?.content || ""}
                    onChange={(e) => setPageData({ ...pageData, content: e.target.value })}
                    rows={20}
                    placeholder="Markdown content..."
                    className="font-mono text-sm"
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 flex flex-col bg-muted">
          <div className="border-b bg-background px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Live Preview</span>
            </div>
            <div className="flex items-center gap-2">
              <Input
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
