"use client"

import { Editor } from "./editor"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ImageInput } from "@/components/ui/image-input"
import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useSession } from "next-auth/react"
import matter from "gray-matter"
import { marked } from "marked"
import TurndownService from "turndown"

interface MarkdownEditorProps {
  initialContent?: string
  initialFrontmatter?: Record<string, any>
  filePath?: string // Optional - will be generated from slug if not provided
  filePathTemplate?: string // Template like "apps/site/src/content/posts/{slug}.md"
  editorTitle?: string // Title for the editor card (e.g., "Blog Post", "Service")
  editorDescription?: string // Description for the editor card
  onSave?: () => void
  initialSlug?: string // Slug of existing post to load
}

export function MarkdownEditor({
  initialContent = "",
  initialFrontmatter = {},
  filePath,
  filePathTemplate,
  editorTitle = "Content",
  editorDescription = "Edit the markdown content and frontmatter",
  onSave,
  initialSlug = "",
}: MarkdownEditorProps) {
  // Helper function to generate slug from title
  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
  }

  const [title, setTitle] = useState(initialFrontmatter.title || "")
  const [description, setDescription] = useState(initialFrontmatter.description || "")
  const [tags, setTags] = useState<string[]>(Array.isArray(initialFrontmatter.tags) ? initialFrontmatter.tags : [])
  const [tagInput, setTagInput] = useState("")
  const [draft, setDraft] = useState(initialFrontmatter.draft ?? false)
  const [image, setImage] = useState(initialFrontmatter.image || "")
  const [client, setClient] = useState(initialFrontmatter.client || "")
  const [clientLogo, setClientLogo] = useState(initialFrontmatter.clientLogo || "")
  const [results, setResults] = useState<Array<{metric?: string, value?: string, description?: string}>>(initialFrontmatter.results || [])
  const [aboutClient, setAboutClient] = useState(initialFrontmatter.aboutClient || null)
  const [challenge, setChallenge] = useState(initialFrontmatter.challenge || null)
  const [solution, setSolution] = useState(initialFrontmatter.solution || null)
  const [testimonial, setTestimonial] = useState(initialFrontmatter.testimonial || null)
  const [features, setFeatures] = useState(initialFrontmatter.features || null)
  const [process, setProcess] = useState(initialFrontmatter.process || null)
  const [faq, setFaq] = useState(initialFrontmatter.faq || null)
  const [cta, setCta] = useState(initialFrontmatter.cta || null)
  const [content, setContent] = useState(initialContent) // Markdown content
  const [htmlContent, setHtmlContent] = useState("") // HTML content for TipTap
  const [fileExists, setFileExists] = useState(false)
  const [rawMode, setRawMode] = useState(false)
  const [rawContent, setRawContent] = useState("")
  const { data: session } = useSession()
  
  // Initialize Turndown service for HTML to Markdown conversion
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
  })
  
  // Convert markdown to HTML helper
  const markdownToHtml = async (markdown: string): Promise<string> => {
    if (!markdown) return ""
    try {
      const html = await marked.parse(markdown)
      return html as string
    } catch (error) {
      console.error("Error converting markdown to HTML:", error)
      return markdown // Fallback to original if conversion fails
    }
  }
  
  // Convert HTML to markdown helper
  const htmlToMarkdown = (html: string): string => {
    if (!html) return ""
    try {
      return turndownService.turndown(html)
    } catch (error) {
      console.error("Error converting HTML to markdown:", error)
      return html // Fallback to original if conversion fails
    }
  }
  
  // Initialize HTML content from markdown when content changes (but not in raw mode)
  useEffect(() => {
    if (content && !rawMode) {
      // Convert markdown to HTML for TipTap
      markdownToHtml(content).then(html => {
        if (html && html.trim()) {
          setHtmlContent(html)
        }
      }).catch(err => {
        console.error("Error converting markdown to HTML in useEffect:", err)
      })
    }
  }, [content, rawMode])
  
  // Auto-generate slug from title, or use initialSlug if provided
  const slug = title ? generateSlug(title) : (initialSlug || initialFrontmatter.slug || "")
  
  // Generate filePath from slug if template provided, otherwise use provided filePath
  const resolvedFilePath = filePathTemplate && slug 
    ? filePathTemplate.replace('{slug}', slug)
    : (filePath || (slug ? `apps/site/src/content/posts/${slug}.md` : ''))
  
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Determine if we're creating or editing
  const isEditing = fileExists && title
  const cardTitle = isEditing ? `Edit ${editorTitle}` : `Create ${editorTitle}`

  // Check if we're in development mode (client-side check)
  const isDevelopment = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

  // Load existing file when resolvedFilePath changes (when slug is generated from title or initialSlug)
  useEffect(() => {
    const loadFile = async () => {
      // If initialSlug is provided, always try to load
      if (initialSlug && resolvedFilePath && !resolvedFilePath.includes('new-')) {
        // Continue to load
      } else if (!resolvedFilePath || !slug || resolvedFilePath.includes('new-')) {
        return // Don't load if it's a new file placeholder or no slug
      }

      setLoading(true)
      try {
        const endpoint = isDevelopment ? '/api/fetch-local' : '/api/fetch-file'
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ path: resolvedFilePath }),
        })

        if (!res.ok) {
          // File doesn't exist yet, that's okay
          if (res.status === 404 || res.status === 403) {
            return
          }
          throw new Error('Failed to load file')
        }

        const data = await res.json()
        if (data.content && data.exists) {
          const parsed = matter(data.content)
          setTitle(parsed.data.title || "")
          setDescription(parsed.data.description || "")
          setTags(Array.isArray(parsed.data.tags) ? parsed.data.tags : [])
          setDraft(parsed.data.draft ?? false)
          setImage(parsed.data.image || "")
          setClient(parsed.data.client || "")
          setClientLogo(parsed.data.clientLogo || "")
          setResults(parsed.data.results || [])
          setAboutClient(parsed.data.aboutClient || null)
          setChallenge(parsed.data.challenge || null)
          setSolution(parsed.data.solution || null)
          setTestimonial(parsed.data.testimonial || null)
          setFeatures(parsed.data.features || null)
          setProcess(parsed.data.process || null)
          setFaq(parsed.data.faq || null)
          setCta(parsed.data.cta || null)
          const markdownContent = parsed.content || ""
          setContent(markdownContent)
          // Convert markdown to HTML for TipTap
          const html = await markdownToHtml(markdownContent)
          setHtmlContent(html)
          setRawContent(data.content)
          setFileExists(true)
        } else {
          setFileExists(false)
        }
      } catch (error) {
        console.error('Error loading file:', error)
        // Silently fail - file might not exist yet
      } finally {
        setLoading(false)
      }
    }

    loadFile()
  }, [resolvedFilePath, slug, isDevelopment, initialSlug])

  const handleSave = async () => {
    let markdown: string

    if (rawMode) {
      // In raw mode, use the raw content directly
      if (!rawContent.trim()) {
        toast({
          title: "Validation error",
          description: "Content is required",
          variant: "destructive",
        })
        return
      }
      markdown = rawContent
    } else {
      // In normal mode, validate and build from form fields
      if (!title || !content) {
        toast({
          title: "Validation error",
          description: "Title and content are required",
          variant: "destructive",
        })
        return
      }

      // Build frontmatter - always include draft (even if false)
      // Remove title, description, slug, tags, draft, author, authorImage, image, faq, cta from initialFrontmatter first
      const { 
        title: _title, 
        description: _description, 
        slug: _slug, 
        tags: _tags, 
        draft: _draft, 
        author: _author, 
        authorImage: _authorImage,
        image: _image,
        client: _client,
        clientLogo: _clientLogo,
        results: _results,
        faq: _faq,
        cta: _cta,
        ...restFrontmatter 
      } = initialFrontmatter
      
      // Get author info from session if available
      const authorName = session?.user?.name || initialFrontmatter.author
      const authorImage = session?.user?.image || initialFrontmatter.authorImage
      
      const frontmatter: Record<string, any> = {
        ...restFrontmatter,
        title,
        ...(description && { description }),
        ...(slug && { slug }),
        ...(tags.length > 0 && { tags }),
        ...(authorName && { author: authorName }),
        ...(authorImage && { authorImage }),
        ...(image && { image }),
        ...(client && { client }),
        ...(clientLogo && { clientLogo }),
        ...(results && results.length > 0 && { results }),
        ...(aboutClient && { aboutClient }),
        ...(challenge && { challenge }),
        ...(solution && { solution }),
        ...(testimonial && { testimonial }),
        ...(features && { features }),
        ...(process && { process }),
        ...(faq && { faq }),
        ...(cta && { cta }),
        draft: draft, // Always include draft, even if false - set last to ensure it's not overridden
      }

      const finalFrontmatter = frontmatter

      // Convert HTML content from TipTap back to markdown
      const markdownContent = htmlContent ? htmlToMarkdown(htmlContent) : content
      // Combine frontmatter and content
      markdown = matter.stringify(markdownContent, finalFrontmatter)
    }

    setSaving(true)
    try {

      // Use local save in development, GitHub API in production
      const endpoint = isDevelopment ? '/api/save-local' : '/api/commit'
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path: resolvedFilePath,
          content: markdown,
          ...(isDevelopment && session?.user?.name ? { author: session.user.name } : {}),
          ...(isDevelopment && session?.user?.image ? { authorImage: session.user.image } : {}),
          ...(isDevelopment ? {} : { message: `Update ${resolvedFilePath}` }),
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || error.details || "Failed to save")
      }

      const result = await res.json()
      
      // Mark file as existing after successful save
      setFileExists(true)
      
      // If in raw mode, update raw content; otherwise parse and update form fields
      if (rawMode) {
        setRawContent(markdown)
      } else {
        const parsed = matter(markdown)
        setTitle(parsed.data.title || "")
        setDescription(parsed.data.description || "")
        setTags(Array.isArray(parsed.data.tags) ? parsed.data.tags : [])
        setDraft(parsed.data.draft ?? false)
        setImage(parsed.data.image || "")
        setClient(parsed.data.client || "")
        setClientLogo(parsed.data.clientLogo || "")
        setResults(parsed.data.results || [])
        setAboutClient(parsed.data.aboutClient || null)
        setChallenge(parsed.data.challenge || null)
        setSolution(parsed.data.solution || null)
        setTestimonial(parsed.data.testimonial || null)
        setFeatures(parsed.data.features || null)
        setProcess(parsed.data.process || null)
        setFaq(parsed.data.faq || null)
        setCta(parsed.data.cta || null)
        const markdownContent = parsed.content || ""
        setContent(markdownContent)
        // Convert markdown to HTML for TipTap
        const html = await markdownToHtml(markdownContent)
        setHtmlContent(html)
        setRawContent(markdown)
      }
      
      toast({
        title: "Saved successfully",
        description: isDevelopment 
          ? (result.note || "File saved locally. Restart the Astro dev server to see changes.")
          : "Your changes have been committed to the repository.",
      })

      onSave?.()
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{cardTitle}</CardTitle>
        <CardDescription>{editorDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Page title"
          />
          {slug && (
            <p className="text-xs text-muted-foreground">
              URL: <code className="px-1 py-0.5 bg-muted rounded text-xs">{slug}</code>
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description (optional)</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Page description"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tags">Tags</Label>
          <div className="flex gap-2">
            <Input
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && tagInput.trim()) {
                  e.preventDefault()
                  // Split by comma and process each tag
                  const newTags = tagInput
                    .split(',')
                    .map(tag => tag.trim())
                    .filter(tag => tag.length > 0 && !tags.includes(tag))
                  
                  if (newTags.length > 0) {
                    setTags([...tags, ...newTags])
                  }
                  setTagInput("")
                }
              }}
              onBlur={() => {
                // Also process tags on blur (when user clicks away)
                if (tagInput.trim()) {
                  const newTags = tagInput
                    .split(',')
                    .map(tag => tag.trim())
                    .filter(tag => tag.length > 0 && !tags.includes(tag))
                  
                  if (newTags.length > 0) {
                    setTags([...tags, ...newTags])
                    setTagInput("")
                  }
                }
              }}
              placeholder="Enter tags separated by commas (e.g., AI, Marketing, Technology)"
            />
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-sm rounded-md"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter((_, i) => i !== index))}
                    className="ml-1 hover:text-primary-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        <ImageInput
          id="image"
          label="Image URL (optional)"
          value={image}
          onChange={setImage}
          placeholder="https://example.com/image.jpg"
          description="Add an image that will appear above the content. Click 'Browse' to select from media library or upload a new image."
        />
        {resolvedFilePath?.includes('/portfolio/') && (
          <>
            <div className="space-y-2">
              <Label htmlFor="client">Client Name (optional)</Label>
              <Input
                id="client"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="Client Company Name"
              />
            </div>
            <ImageInput
              id="clientLogo"
              label="Client Logo URL (optional)"
              value={clientLogo}
              onChange={setClientLogo}
              placeholder="https://example.com/logo.png"
              description="Client company logo. Click 'Browse' to select from media library or upload a new image."
            />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Results (optional)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setResults([...results, { metric: "", value: "", description: "" }])}
                >
                  + Add Result
                </Button>
              </div>
              {results.length > 0 && (
                <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                  {results.map((result, index) => (
                    <div key={index} className="p-3 border rounded-md space-y-2">
                      <div className="space-y-1">
                        <Label>Metric</Label>
                        <Input
                          value={result.metric || ""}
                          onChange={(e) => {
                            const newResults = [...results]
                            newResults[index] = { ...result, metric: e.target.value }
                            setResults(newResults)
                          }}
                          placeholder="e.g., Revenue Increase"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Value</Label>
                        <Input
                          value={result.value || ""}
                          onChange={(e) => {
                            const newResults = [...results]
                            newResults[index] = { ...result, value: e.target.value }
                            setResults(newResults)
                          }}
                          placeholder="e.g., 300%"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Description</Label>
                        <Textarea
                          value={result.description || ""}
                          onChange={(e) => {
                            const newResults = [...results]
                            newResults[index] = { ...result, description: e.target.value }
                            setResults(newResults)
                          }}
                          placeholder="Brief description of the result"
                          rows={2}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newResults = [...results]
                          newResults.splice(index, 1)
                          setResults(newResults)
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
        {/* Portfolio-specific sections */}
        {resolvedFilePath?.includes('/portfolio/') && (
          <>
                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">About Client Section (optional)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAboutClient(aboutClient ? null : { title: "", description: "" })}
                    >
                      {aboutClient ? "Remove" : "Add"}
                    </Button>
                  </div>
                  {aboutClient && (
                    <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                      <Input
                        value={aboutClient.title || ""}
                        onChange={(e) => setAboutClient({ ...aboutClient, title: e.target.value })}
                        placeholder="Section Title (e.g., About the Client)"
                      />
                      <Textarea
                        value={aboutClient.description || ""}
                        onChange={(e) => setAboutClient({ ...aboutClient, description: e.target.value })}
                        placeholder="Description of the client..."
                        rows={3}
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Challenge Section (optional)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setChallenge(challenge ? null : { title: "", description: "" })}
                    >
                      {challenge ? "Remove" : "Add"}
                    </Button>
                  </div>
                  {challenge && (
                    <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                      <Input
                        value={challenge.title || ""}
                        onChange={(e) => setChallenge({ ...challenge, title: e.target.value })}
                        placeholder="Section Title (e.g., The Challenge)"
                      />
                      <Textarea
                        value={challenge.description || ""}
                        onChange={(e) => setChallenge({ ...challenge, description: e.target.value })}
                        placeholder="Describe the challenge..."
                        rows={3}
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Solution Section (optional)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSolution(solution ? null : { title: "", description: "", features: [] })}
                    >
                      {solution ? "Remove" : "Add"}
                    </Button>
                  </div>
                  {solution && (
                    <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                      <Input
                        value={solution.title || ""}
                        onChange={(e) => setSolution({ ...solution, title: e.target.value })}
                        placeholder="Section Title (e.g., Solution)"
                      />
                      <Textarea
                        value={solution.description || ""}
                        onChange={(e) => setSolution({ ...solution, description: e.target.value })}
                        placeholder="Describe the solution..."
                        rows={3}
                      />
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Solution Features</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setSolution({ ...solution, features: [...(solution.features || []), { title: "", description: "" }] })}
                          >
                            + Add Feature
                          </Button>
                        </div>
                        {solution.features && solution.features.length > 0 && (
                          <div className="space-y-2">
                            {solution.features.map((feature: any, index: number) => (
                              <div key={index} className="p-3 border rounded-md space-y-2">
                                <Input
                                  value={feature.title || ""}
                                  onChange={(e) => {
                                    const newFeatures = [...(solution.features || [])]
                                    newFeatures[index] = { ...feature, title: e.target.value }
                                    setSolution({ ...solution, features: newFeatures })
                                  }}
                                  placeholder="Feature title"
                                />
                                <Textarea
                                  value={feature.description || ""}
                                  onChange={(e) => {
                                    const newFeatures = [...(solution.features || [])]
                                    newFeatures[index] = { ...feature, description: e.target.value }
                                    setSolution({ ...solution, features: newFeatures })
                                  }}
                                  placeholder="Feature description"
                                  rows={2}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const newFeatures = [...(solution.features || [])]
                                    newFeatures.splice(index, 1)
                                    setSolution({ ...solution, features: newFeatures })
                                  }}
                                >
                                  Remove
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Testimonial (optional)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setTestimonial(testimonial ? null : { quote: "", author: "", role: "", company: "", image: "" })}
                    >
                      {testimonial ? "Remove" : "Add"}
                    </Button>
                  </div>
                  {testimonial && (
                    <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                      <Textarea
                        value={testimonial.quote || ""}
                        onChange={(e) => setTestimonial({ ...testimonial, quote: e.target.value })}
                        placeholder="Testimonial quote..."
                        rows={3}
                      />
                      <Input
                        value={testimonial.author || ""}
                        onChange={(e) => setTestimonial({ ...testimonial, author: e.target.value })}
                        placeholder="Author name"
                      />
                      <Input
                        value={testimonial.role || ""}
                        onChange={(e) => setTestimonial({ ...testimonial, role: e.target.value })}
                        placeholder="Author role"
                      />
                      <Input
                        value={testimonial.company || ""}
                        onChange={(e) => setTestimonial({ ...testimonial, company: e.target.value })}
                        placeholder="Company name"
                      />
                      <div className="col-span-2">
                        <ImageInput
                          label="Author Image URL (optional)"
                          value={testimonial.image || ""}
                          onChange={(value) => setTestimonial({ ...testimonial, image: value })}
                          placeholder="Author image URL"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
            {/* Service-specific sections */}
            {resolvedFilePath?.includes('/services/') && (
              <>
                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Features Section (optional)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFeatures(features ? null : { title: "", description: "", items: [] })}
                    >
                      {features ? "Remove" : "Add"}
                    </Button>
                  </div>
                  {features && (
                    <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                      <Input
                        value={features.title || ""}
                        onChange={(e) => setFeatures({ ...features, title: e.target.value })}
                        placeholder="Section Title (e.g., What's Included)"
                      />
                      <Textarea
                        value={features.description || ""}
                        onChange={(e) => setFeatures({ ...features, description: e.target.value })}
                        placeholder="Section description..."
                        rows={2}
                      />
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Feature Items</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setFeatures({ ...features, items: [...(features.items || []), { title: "", description: "" }] })}
                          >
                            + Add Feature
                          </Button>
                        </div>
                        {features.items && features.items.length > 0 && (
                          <div className="space-y-2">
                            {features.items.map((item: any, index: number) => (
                              <div key={index} className="p-3 border rounded-md space-y-2">
                                <Input
                                  value={item.title || ""}
                                  onChange={(e) => {
                                    const newItems = [...(features.items || [])]
                                    newItems[index] = { ...item, title: e.target.value }
                                    setFeatures({ ...features, items: newItems })
                                  }}
                                  placeholder="Feature title"
                                />
                                <Textarea
                                  value={item.description || ""}
                                  onChange={(e) => {
                                    const newItems = [...(features.items || [])]
                                    newItems[index] = { ...item, description: e.target.value }
                                    setFeatures({ ...features, items: newItems })
                                  }}
                                  placeholder="Feature description"
                                  rows={2}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const newItems = [...(features.items || [])]
                                    newItems.splice(index, 1)
                                    setFeatures({ ...features, items: newItems })
                                  }}
                                >
                                  Remove
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Process Section (optional)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setProcess(process ? null : { title: "", description: "", steps: [] })}
                    >
                      {process ? "Remove" : "Add"}
                    </Button>
                  </div>
                  {process && (
                    <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                      <Input
                        value={process.title || ""}
                        onChange={(e) => setProcess({ ...process, title: e.target.value })}
                        placeholder="Section Title (e.g., How It Works)"
                      />
                      <Textarea
                        value={process.description || ""}
                        onChange={(e) => setProcess({ ...process, description: e.target.value })}
                        placeholder="Section description..."
                        rows={2}
                      />
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Process Steps</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setProcess({ ...process, steps: [...(process.steps || []), { number: (process.steps?.length || 0) + 1, title: "", description: "" }] })}
                          >
                            + Add Step
                          </Button>
                        </div>
                        {process.steps && process.steps.length > 0 && (
                          <div className="space-y-2">
                            {process.steps.map((step: any, index: number) => (
                              <div key={index} className="p-3 border rounded-md space-y-2">
                                <Input
                                  type="number"
                                  value={step.number || index + 1}
                                  onChange={(e) => {
                                    const newSteps = [...(process.steps || [])]
                                    newSteps[index] = { ...step, number: parseInt(e.target.value) || index + 1 }
                                    setProcess({ ...process, steps: newSteps })
                                  }}
                                  placeholder="Step number"
                                  className="w-20"
                                />
                                <Input
                                  value={step.title || ""}
                                  onChange={(e) => {
                                    const newSteps = [...(process.steps || [])]
                                    newSteps[index] = { ...step, title: e.target.value }
                                    setProcess({ ...process, steps: newSteps })
                                  }}
                                  placeholder="Step title"
                                />
                                <Textarea
                                  value={step.description || ""}
                                  onChange={(e) => {
                                    const newSteps = [...(process.steps || [])]
                                    newSteps[index] = { ...step, description: e.target.value }
                                    setProcess({ ...process, steps: newSteps })
                                  }}
                                  placeholder="Step description"
                                  rows={2}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const newSteps = [...(process.steps || [])]
                                    newSteps.splice(index, 1)
                                    setProcess({ ...process, steps: newSteps })
                                  }}
                                >
                                  Remove
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="draft"
            checked={draft}
            onChange={(e) => setDraft(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <Label htmlFor="draft" className="font-normal cursor-pointer">
            Save as draft
          </Label>
        </div>
        {draft && slug && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>Draft mode:</strong> This post will not appear in public listings. Preview at: <code className="text-xs bg-yellow-100 px-1 rounded">/blog/{slug}?preview=true</code>
            </p>
          </div>
        )}
        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">FAQ Section (optional)</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFaq(faq ? null : { title: "", description: "", items: [] })}
            >
              {faq ? "Remove FAQ" : "Add FAQ"}
            </Button>
          </div>
          {faq && (
            <div className="space-y-4 pl-4 border-l-2 border-primary/20">
              <div className="space-y-2">
                <Label htmlFor="faq-title">FAQ Title</Label>
                <Input
                  id="faq-title"
                  value={faq.title || ""}
                  onChange={(e) => setFaq({ ...faq, title: e.target.value })}
                  placeholder="Frequently Asked Questions"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="faq-description">FAQ Description</Label>
                <Textarea
                  id="faq-description"
                  value={faq.description || ""}
                  onChange={(e) => setFaq({ ...faq, description: e.target.value })}
                  placeholder="Find quick answers to common questions..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>FAQ Items</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFaq({ ...faq, items: [...(faq.items || []), { question: "", answer: "" }] })}
                  >
                    + Add Question
                  </Button>
                </div>
                {faq.items && faq.items.length > 0 && (
                  <div className="space-y-3">
                    {faq.items.map((item: any, index: number) => (
                      <div key={index} className="p-3 border rounded-md space-y-2">
                        <div className="space-y-1">
                          <Label>Question {index + 1}</Label>
                          <Input
                            value={item.question || ""}
                            onChange={(e) => {
                              const newItems = [...(faq.items || [])]
                              newItems[index] = { ...item, question: e.target.value }
                              setFaq({ ...faq, items: newItems })
                            }}
                            placeholder="What is...?"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Answer {index + 1}</Label>
                          <Textarea
                            value={item.answer || ""}
                            onChange={(e) => {
                              const newItems = [...(faq.items || [])]
                              newItems[index] = { ...item, answer: e.target.value }
                              setFaq({ ...faq, items: newItems })
                            }}
                            placeholder="The answer is..."
                            rows={2}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newItems = [...(faq.items || [])]
                            newItems.splice(index, 1)
                            setFaq({ ...faq, items: newItems })
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">CTA Section (optional)</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCta(cta ? null : { title: "", description: "", primaryButton: { text: "", link: "" }, secondaryButton: { text: "", link: "" } })}
            >
              {cta ? "Remove CTA" : "Add CTA"}
            </Button>
          </div>
          {cta && (
            <div className="space-y-4 pl-4 border-l-2 border-primary/20">
              <div className="space-y-2">
                <Label htmlFor="cta-title">CTA Title</Label>
                <Input
                  id="cta-title"
                  value={cta.title || ""}
                  onChange={(e) => setCta({ ...cta, title: e.target.value })}
                  placeholder="Ready to Get Started?"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cta-description">CTA Description</Label>
                <Textarea
                  id="cta-description"
                  value={cta.description || ""}
                  onChange={(e) => setCta({ ...cta, description: e.target.value })}
                  placeholder="Let's discuss how we can help..."
                  rows={2}
                />
              </div>
              <div className="space-y-3">
                <Label>Primary Button</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={cta.primaryButton?.text || ""}
                    onChange={(e) => setCta({ ...cta, primaryButton: { ...cta.primaryButton, text: e.target.value } })}
                    placeholder="Button text"
                  />
                  <Input
                    value={cta.primaryButton?.link || ""}
                    onChange={(e) => setCta({ ...cta, primaryButton: { ...cta.primaryButton, link: e.target.value } })}
                    placeholder="/contact"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label>Secondary Button (optional)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={cta.secondaryButton?.text || ""}
                    onChange={(e) => setCta({ ...cta, secondaryButton: { ...cta.secondaryButton, text: e.target.value } })}
                    placeholder="Button text"
                  />
                  <Input
                    value={cta.secondaryButton?.link || ""}
                    onChange={(e) => setCta({ ...cta, secondaryButton: { ...cta.secondaryButton, link: e.target.value } })}
                    placeholder="/blog"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        <Tabs value={rawMode ? "raw" : "visual"} onValueChange={async (value) => {
          const isRaw = value === "raw"
          
          if (isRaw) {
            // Switching to raw mode - generate raw content from current form state
            const generated = matter.stringify(content, {
              title,
              ...(description && { description }),
              ...(slug && { slug }),
              ...(tags.length > 0 && { tags }),
              ...(image && { image }),
              ...(client && { client }),
              ...(clientLogo && { clientLogo }),
              ...(results && results.length > 0 && { results }),
              ...(faq && { faq }),
              ...(cta && { cta }),
              draft: draft, // Always include draft
              ...initialFrontmatter,
            })
            setRawContent(generated)
            setRawMode(true)
          } else {
            // Switching to visual mode - parse raw content and populate form fields
            if (rawContent) {
              try {
                const parsed = matter(rawContent)
                setTitle(parsed.data.title || "")
                setDescription(parsed.data.description || "")
                setTags(Array.isArray(parsed.data.tags) ? parsed.data.tags : [])
                setDraft(parsed.data.draft ?? false)
                setImage(parsed.data.image || "")
                setFaq(parsed.data.faq || null)
                setCta(parsed.data.cta || null)
                const markdownContent = parsed.content || ""
                setContent(markdownContent)
                // Convert markdown to HTML for TipTap
                markdownToHtml(markdownContent).then(html => {
                  setHtmlContent(html)
                  setRawMode(false)
                }).catch(error => {
                  console.error("Error converting markdown to HTML:", error)
                  toast({
                    title: "Conversion error",
                    description: "Failed to convert markdown to HTML.",
                    variant: "destructive",
                  })
                })
                return // Don't set rawMode yet, wait for conversion
              } catch (error) {
                console.error("Error parsing raw content:", error)
                toast({
                  title: "Parse error",
                  description: "Failed to parse raw markdown. Please check the format.",
                  variant: "destructive",
                })
                return // Don't switch if parsing fails
              }
            } else {
              setRawMode(false)
            }
          }
        }} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="visual">Visual Editor</TabsTrigger>
            <TabsTrigger value="raw">Raw Markdown</TabsTrigger>
          </TabsList>
          <TabsContent value="visual" className="space-y-2">
            <Label>Content</Label>
            <Editor 
              content={htmlContent || ""} 
              onChange={(html) => {
                setHtmlContent(html)
                // Convert HTML back to markdown for storage
                const markdown = htmlToMarkdown(html)
                setContent(markdown)
              }} 
            />
          </TabsContent>
          <TabsContent value="raw" className="space-y-2">
            <Label>Raw Markdown</Label>
            <Textarea
              value={rawContent}
              onChange={(e) => setRawContent(e.target.value)}
              className="font-mono text-sm min-h-[500px]"
              placeholder="---&#10;title: Your Post Title&#10;description: Your description&#10;date: 2024-01-01&#10;draft: false&#10;---&#10;&#10;Your content here..."
            />
            <p className="text-xs text-muted-foreground">
              Edit the raw markdown file including frontmatter. Changes here will override form fields when saved.
            </p>
          </TabsContent>
        </Tabs>
        <Button onClick={handleSave} disabled={saving || loading} className="w-full">
          {loading ? "Loading..." : saving ? "Saving..." : isDevelopment ? "Save Locally" : "Save & Commit"}
        </Button>
      </CardContent>
    </Card>
  )
}

