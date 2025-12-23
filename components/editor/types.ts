export interface EditorState {
  title: string
  description: string
  tags: string[]
  tagInput: string
  draft: boolean
  image: string
  client: string
  clientLogo: string
  results: Array<{ metric?: string; value?: string; description?: string }>
  aboutClient: { title?: string; description?: string } | null
  challenge: { title?: string; description?: string } | null
  solution: { title?: string; description?: string; features?: Array<{ title?: string; description?: string }> } | null
  testimonial: { quote?: string; author?: string; role?: string; company?: string; image?: string } | null
  pricing: { label?: string; price?: string; description?: string; primaryButton?: { text?: string; link?: string }; secondaryButton?: { text?: string; link?: string } } | null
  features: { title?: string; description?: string; items?: Array<{ title?: string; description?: string }> } | null
  process: { title?: string; description?: string; steps?: Array<{ number?: number; title?: string; description?: string }> } | null
  faq: { title?: string; description?: string; items?: Array<{ question?: string; answer?: string }> } | null
  cta: { title?: string; description?: string; primaryButton?: { text?: string; link?: string }; secondaryButton?: { text?: string; link?: string } } | null
  content: string
  htmlContent: string
  rawMode: boolean
  rawContent: string
}

export interface Section {
  id: string
  label: string
  available: boolean
  optional: boolean
}

export interface EditorContextValue {
  state: EditorState
  setState: React.Dispatch<React.SetStateAction<EditorState>>
  resolvedFilePath: string
  slug: string
  fileExists: boolean
  loading: boolean
  saving: boolean
  expandedSections: Set<string>
  setExpandedSections: React.Dispatch<React.SetStateAction<Set<string>>>
  sectionRefs: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>
  scrollToSection: (section: string) => void
  toggleSection: (section: string) => void
  markdownToHtml: (markdown: string) => Promise<string>
  htmlToMarkdown: (html: string) => string
  handleSave: () => Promise<void>
}

