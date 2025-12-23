"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/components/ui/use-toast"
import matter from "gray-matter"
import { generateSlug, markdownToHtml, htmlToMarkdown, hasSectionContent, sectionExists } from "./utils"
import { EditorState, Section } from "./types"

interface UseMarkdownEditorProps {
  initialContent: string
  initialFrontmatter: Record<string, any>
  filePath?: string
  filePathTemplate?: string
  initialSlug?: string
}

export function useMarkdownEditor({
  initialContent,
  initialFrontmatter,
  filePath,
  filePathTemplate,
  initialSlug,
}: UseMarkdownEditorProps) {
  const [state, setState] = useState<EditorState>({
    title: initialFrontmatter.title || "",
    description: initialFrontmatter.description || "",
    tags: Array.isArray(initialFrontmatter.tags) ? initialFrontmatter.tags : [],
    tagInput: "",
    draft: initialFrontmatter.draft ?? false,
    image: initialFrontmatter.image || "",
    client: initialFrontmatter.client || "",
    clientLogo: initialFrontmatter.clientLogo || "",
    results: initialFrontmatter.results || [],
    aboutClient: initialFrontmatter.aboutClient || null,
    challenge: initialFrontmatter.challenge || null,
    solution: initialFrontmatter.solution || null,
    testimonial: initialFrontmatter.testimonial || null,
    pricing: initialFrontmatter.pricing || null,
    features: initialFrontmatter.features || null,
    process: initialFrontmatter.process || null,
    faq: initialFrontmatter.faq || null,
    cta: initialFrontmatter.cta || null,
    content: initialContent,
    htmlContent: "",
    rawMode: false,
    rawContent: "",
  })

  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fileExists, setFileExists] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic']))
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; sectionId: string | null; sectionLabel: string }>({ open: false, sectionId: null, sectionLabel: '' })
  
  const { data: session } = useSession()
  const { toast } = useToast()
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const hasLoadedRef = useRef(false)
  const initialFilePathRef = useRef<string | null>(null)

  // Auto-generate slug from title, or use initialSlug if provided
  const slug = state.title ? generateSlug(state.title) : (initialSlug || initialFrontmatter.slug || "")

  // Generate filePath from slug if template provided, otherwise use provided filePath
  const resolvedFilePath = filePathTemplate && slug
    ? filePathTemplate.replace('{slug}', slug)
    : (filePath || (slug ? `apps/site/src/content/posts/${slug}.md` : ''))

  // Determine which sections are available based on file path
  const isService = resolvedFilePath?.includes('/services/')
  const isPortfolio = resolvedFilePath?.includes('/portfolio/')
  const isPost = resolvedFilePath?.includes('/posts/')

  // Define section order for each content type
  const getSectionOrder = (): string[] => {
    if (isService) {
      // Service order: Basic Information, Image, Features, Process, Content, FAQ, CTA (Pricing is optional and will appear after)
      return ['basic', 'image', 'pricing', 'features', 'process', 'content', 'faq', 'cta']
    } else if (isPortfolio) {
      // Portfolio order: Basic Information, Image, Client Info, Results, About Client, Challenge, Solution, Testimonial, Content, FAQ, CTA
      return ['basic', 'image', 'client', 'results', 'aboutClient', 'challenge', 'solution', 'testimonial', 'content', 'faq', 'cta']
    } else {
      // Blog/Post order: Basic Information, Image, Content, FAQ, CTA
      return ['basic', 'image', 'content', 'faq', 'cta']
    }
  }

  const sectionOrder = getSectionOrder()

  const allSections: Section[] = [
    { id: 'basic', label: 'Basic Information', available: true, optional: false },
    { id: 'content', label: 'Content', available: true, optional: false },
    { id: 'image', label: 'Image', available: true, optional: false },
    { id: 'client', label: 'Client Info', available: isPortfolio, optional: true },
    { id: 'results', label: 'Results', available: isPortfolio, optional: true },
    { id: 'aboutClient', label: 'About Client', available: isPortfolio, optional: true },
    { id: 'challenge', label: 'Challenge', available: isPortfolio, optional: true },
    { id: 'solution', label: 'Solution', available: isPortfolio, optional: true },
    { id: 'testimonial', label: 'Testimonial', available: isPortfolio, optional: true },
    { id: 'pricing', label: 'Pricing', available: isService, optional: true },
    { id: 'features', label: 'Features', available: isService, optional: true },
    { id: 'process', label: 'Process', available: isService, optional: true },
    { id: 'faq', label: 'FAQ', available: true, optional: true },
    { id: 'cta', label: 'CTA', available: true, optional: true },
  ]

  // Filter available sections and sort by order
  const sections: Section[] = allSections
    .filter(s => s.available)
    .sort((a, b) => {
      const indexA = sectionOrder.indexOf(a.id)
      const indexB = sectionOrder.indexOf(b.id)
      // If section not in order array, put it at the end
      if (indexA === -1 && indexB === -1) return 0
      if (indexA === -1) return 1
      if (indexB === -1) return -1
      return indexA - indexB
    })

  // Initialize HTML content from markdown when content changes (but not in raw mode)
  useEffect(() => {
    if (state.content && !state.rawMode) {
      markdownToHtml(state.content).then(html => {
        if (html && html.trim()) {
          setState(prev => ({ ...prev, htmlContent: html }))
        }
      }).catch(err => {
        console.error("Error converting markdown to HTML in useEffect:", err)
      })
    }
  }, [state.content, state.rawMode])

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
        setTimeout(() => {
          const element = sectionRefs.current[section]
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }, 100)
      }
      return next
    })
  }

  const scrollToSection = (section: string) => {
    const element = sectionRefs.current[section]
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      if (!expandedSections.has(section)) {
        setExpandedSections(prev => new Set(prev).add(section))
      }
    }
  }

  // Helper function to add a section
  const addSection = (sectionId: string) => {
    switch (sectionId) {
      case 'client':
        if (!state.client && !state.clientLogo) {
          setState(prev => ({ ...prev, client: '', clientLogo: '' }))
        }
        break
      case 'results':
        if (state.results.length === 0) {
          setState(prev => ({ ...prev, results: [{ metric: '', value: '', description: '' }] }))
        }
        break
      case 'aboutClient':
        if (!state.aboutClient) {
          setState(prev => ({ ...prev, aboutClient: { title: '', description: '' } }))
        }
        break
      case 'challenge':
        if (!state.challenge) {
          setState(prev => ({ ...prev, challenge: { title: '', description: '' } }))
        }
        break
      case 'solution':
        if (!state.solution) {
          setState(prev => ({ ...prev, solution: { title: '', description: '', features: [] } }))
        }
        break
      case 'testimonial':
        if (!state.testimonial) {
          setState(prev => ({ ...prev, testimonial: { quote: '', author: '', role: '', company: '', image: '' } }))
        }
        break
      case 'pricing':
        if (!state.pricing) {
          setState(prev => ({ ...prev, pricing: { label: 'Starting at', price: '', description: '', primaryButton: { text: 'Get Started', link: '/contact' }, secondaryButton: { text: 'Learn More', link: '#features' } } }))
        }
        break
      case 'features':
        if (!state.features) {
          setState(prev => ({ ...prev, features: { title: '', description: '', items: [] } }))
        }
        break
      case 'process':
        if (!state.process) {
          setState(prev => ({ ...prev, process: { title: '', description: '', steps: [] } }))
        }
        break
      case 'faq':
        if (!state.faq) {
          setState(prev => ({ ...prev, faq: { title: '', description: '', items: [] } }))
        }
        break
      case 'cta':
        if (!state.cta) {
          setState(prev => ({ ...prev, cta: { title: '', description: '', primaryButton: { text: '', link: '' }, secondaryButton: { text: '', link: '' } } }))
        }
        break
    }
    setExpandedSections(prev => new Set(prev).add(sectionId))
    setTimeout(() => scrollToSection(sectionId), 100)
  }

  // Helper function to remove a section
  const removeSection = (sectionId: string) => {
    switch (sectionId) {
      case 'client':
        setState(prev => ({ ...prev, client: '', clientLogo: '' }))
        break
      case 'results':
        setState(prev => ({ ...prev, results: [] }))
        break
      case 'aboutClient':
        setState(prev => ({ ...prev, aboutClient: null }))
        break
      case 'challenge':
        setState(prev => ({ ...prev, challenge: null }))
        break
      case 'solution':
        setState(prev => ({ ...prev, solution: null }))
        break
      case 'testimonial':
        setState(prev => ({ ...prev, testimonial: null }))
        break
      case 'pricing':
        setState(prev => ({ ...prev, pricing: null }))
        break
      case 'features':
        setState(prev => ({ ...prev, features: null }))
        break
      case 'process':
        setState(prev => ({ ...prev, process: null }))
        break
      case 'faq':
        setState(prev => ({ ...prev, faq: null }))
        break
      case 'cta':
        setState(prev => ({ ...prev, cta: null }))
        break
    }
  }

  // Handle section add/remove from sidebar
  const handleSectionToggle = (sectionId: string, sectionLabel: string) => {
    const exists = sectionExists(sectionId, state)
    if (exists) {
      if (hasSectionContent(sectionId, state)) {
        setConfirmDialog({ open: true, sectionId, sectionLabel })
      } else {
        removeSection(sectionId)
      }
    } else {
      addSection(sectionId)
    }
  }

  // Confirm removal
  const confirmRemove = () => {
    if (confirmDialog.sectionId) {
      removeSection(confirmDialog.sectionId)
      setConfirmDialog({ open: false, sectionId: null, sectionLabel: '' })
    }
  }

  // Load existing file only once when component mounts or initialSlug changes
  useEffect(() => {
    const loadFile = async () => {
      // Don't reload if we've already loaded (unless initialSlug changed, meaning we're switching files)
      if (hasLoadedRef.current) {
        // Only reload if we're loading a different file (initialSlug changed)
        // Use initialSlug for comparison, not resolvedFilePath (which changes on every keystroke)
        const currentFileKey = initialSlug || 'new-file'
        if (initialFilePathRef.current === currentFileKey) {
          return
        }
        // Reset if switching to a different file
        hasLoadedRef.current = false
      }

      // For new files (no initialSlug), just set initial values once and return
      if (!initialSlug) {
        // For new files, set initial values if provided
        if (initialContent || Object.keys(initialFrontmatter).length > 0) {
          setState(prev => ({
            ...prev,
            title: initialFrontmatter.title || "",
            description: initialFrontmatter.description || "",
            tags: Array.isArray(initialFrontmatter.tags) ? initialFrontmatter.tags : [],
            content: initialContent,
          }))
          if (initialContent) {
            markdownToHtml(initialContent).then(html => setState(prev => ({ ...prev, htmlContent: html })))
          }
        }
        hasLoadedRef.current = true
        initialFilePathRef.current = 'new-file'
        return
      }

      // For existing files (with initialSlug), load from GitHub
      // Don't load if it's a new file placeholder or no valid path
      if (!resolvedFilePath || resolvedFilePath.includes('new-')) {
        return
      }

      // Mark that we're loading this file (use initialSlug as the key)
      initialFilePathRef.current = initialSlug
      setLoading(true)
      try {
        const res = await fetch('/api/fetch-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: resolvedFilePath }),
        })

        if (!res.ok) {
          if (res.status === 404 || res.status === 403) {
            setFileExists(false)
            if (initialContent || Object.keys(initialFrontmatter).length > 0) {
              setState(prev => ({
                ...prev,
                title: initialFrontmatter.title || "",
                description: initialFrontmatter.description || "",
                tags: Array.isArray(initialFrontmatter.tags) ? initialFrontmatter.tags : [],
                content: initialContent,
              }))
              if (initialContent) {
                markdownToHtml(initialContent).then(html => setState(prev => ({ ...prev, htmlContent: html })))
              }
            }
            return
          }
          throw new Error('Failed to load file')
        }

        const data = await res.json()

        if (data.exists && data.content !== undefined && data.content !== null) {
          try {
            const parsed = matter(data.content)
            setState(prev => ({
              ...prev,
              title: parsed.data.title || "",
              description: parsed.data.description || "",
              tags: Array.isArray(parsed.data.tags) ? parsed.data.tags : [],
              draft: parsed.data.draft ?? false,
              image: parsed.data.image || "",
              client: parsed.data.client || "",
              clientLogo: parsed.data.clientLogo || "",
              results: parsed.data.results || [],
              aboutClient: parsed.data.aboutClient || null,
              challenge: parsed.data.challenge || null,
              solution: parsed.data.solution || null,
              testimonial: parsed.data.testimonial || null,
              pricing: parsed.data.pricing || null,
              features: parsed.data.features || null,
              process: parsed.data.process || null,
              faq: parsed.data.faq || null,
              cta: parsed.data.cta || null,
              content: parsed.content || "",
              rawContent: data.content,
            }))
            const markdownContent = parsed.content || ""
            const html = await markdownToHtml(markdownContent)
            setState(prev => ({ ...prev, htmlContent: html }))
            setFileExists(true)
            hasLoadedRef.current = true
          } catch (parseError) {
            console.error('Error parsing file content:', parseError)
            toast({
              title: "Parse error",
              description: "Failed to parse file content. Please check the file format.",
              variant: "destructive",
            })
            setFileExists(false)
            hasLoadedRef.current = true // Mark as loaded even on error to prevent infinite retries
          }
        } else {
          setFileExists(false)
          if (initialContent || Object.keys(initialFrontmatter).length > 0) {
            setState(prev => ({
              ...prev,
              title: initialFrontmatter.title || "",
              description: initialFrontmatter.description || "",
              tags: Array.isArray(initialFrontmatter.tags) ? initialFrontmatter.tags : [],
              content: initialContent,
            }))
            if (initialContent) {
              markdownToHtml(initialContent).then(html => setState(prev => ({ ...prev, htmlContent: html })))
            }
          }
          hasLoadedRef.current = true
        }
      } catch (error) {
        console.error('Error loading file:', error)
        hasLoadedRef.current = true // Mark as loaded even on error to prevent infinite retries
      } finally {
        setLoading(false)
      }
    }

    loadFile()
    // Only depend on initialSlug - not on resolvedFilePath or slug (which change on every title keystroke)
    // This ensures we only load once when the component mounts or when switching to a different file
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSlug])

  // Save handler
  const handleSave = async () => {
    let markdown: string

    if (state.rawMode) {
      if (!state.rawContent.trim()) {
        toast({
          title: "Validation error",
          description: "Content is required",
          variant: "destructive",
        })
        return
      }
      markdown = state.rawContent
    } else {
      if (!state.title || !state.content) {
        toast({
          title: "Validation error",
          description: "Title and content are required",
          variant: "destructive",
        })
        return
      }

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

      const authorName = session?.user?.name || initialFrontmatter.author
      const authorImage = session?.user?.image || initialFrontmatter.authorImage

      const frontmatter: Record<string, any> = {
        ...restFrontmatter,
        title: state.title,
        ...(state.description && { description: state.description }),
        ...(slug && { slug }),
        ...(state.tags.length > 0 && { tags: state.tags }),
        ...(authorName && { author: authorName }),
        ...(authorImage && { authorImage }),
        ...(state.image && { image: state.image }),
        ...(state.client && { client: state.client }),
        ...(state.clientLogo && { clientLogo: state.clientLogo }),
        ...(state.results && state.results.length > 0 && { results: state.results }),
        ...(state.aboutClient && { aboutClient: state.aboutClient }),
        ...(state.challenge && { challenge: state.challenge }),
        ...(state.solution && { solution: state.solution }),
        ...(state.testimonial && { testimonial: state.testimonial }),
        ...(state.pricing && { pricing: state.pricing }),
        ...(state.features && { features: state.features }),
        ...(state.process && { process: state.process }),
        ...(state.faq && { faq: state.faq }),
        ...(state.cta && { cta: state.cta }),
        draft: state.draft,
      }

      const markdownContent = state.htmlContent ? htmlToMarkdown(state.htmlContent) : state.content
      markdown = matter.stringify(markdownContent, frontmatter)
    }

    setSaving(true)
    try {
      const res = await fetch('/api/commit', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: resolvedFilePath,
          content: markdown,
          message: `Update ${resolvedFilePath}`,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || error.details || "Failed to save")
      }

      setFileExists(true)

      if (state.rawMode) {
        setState(prev => ({ ...prev, rawContent: markdown }))
      } else {
        const parsed = matter(markdown)
        setState(prev => ({
          ...prev,
          title: parsed.data.title || "",
          description: parsed.data.description || "",
          tags: Array.isArray(parsed.data.tags) ? parsed.data.tags : [],
          draft: parsed.data.draft ?? false,
          image: parsed.data.image || "",
          client: parsed.data.client || "",
          clientLogo: parsed.data.clientLogo || "",
          results: parsed.data.results || [],
          aboutClient: parsed.data.aboutClient || null,
          challenge: parsed.data.challenge || null,
          solution: parsed.data.solution || null,
          testimonial: parsed.data.testimonial || null,
          features: parsed.data.features || null,
          process: parsed.data.process || null,
          faq: parsed.data.faq || null,
          cta: parsed.data.cta || null,
          content: parsed.content || "",
          rawContent: markdown,
        }))
        const markdownContent = parsed.content || ""
        const html = await markdownToHtml(markdownContent)
        setState(prev => ({ ...prev, htmlContent: html }))
      }

      toast({
        title: "Saved successfully",
        description: "Your changes have been committed to the repository.",
      })
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

  return {
    state,
    setState,
    slug,
    resolvedFilePath,
    fileExists,
    loading,
    saving,
    expandedSections,
    setExpandedSections,
    confirmDialog,
    setConfirmDialog,
    sectionRefs,
    sections,
    isService,
    isPortfolio,
    isPost,
    toggleSection,
    scrollToSection,
    handleSectionToggle,
    confirmRemove,
    handleSave,
  }
}

