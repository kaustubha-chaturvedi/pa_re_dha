import matter from "gray-matter"
import { marked } from "marked"
import TurndownService from "turndown"

// Initialize Turndown service for HTML to Markdown conversion
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
})

/**
 * Generate slug from text
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Convert markdown to HTML
 */
export async function markdownToHtml(markdown: string): Promise<string> {
  if (!markdown) return ""
  try {
    const html = await marked.parse(markdown)
    return html as string
  } catch (error) {
    console.error("Error converting markdown to HTML:", error)
    return markdown // Fallback to original if conversion fails
  }
}

/**
 * Convert HTML to markdown
 */
export function htmlToMarkdown(html: string): string {
  if (!html) return ""
  try {
    return turndownService.turndown(html)
  } catch (error) {
    console.error("Error converting HTML to markdown:", error)
    return html // Fallback to original if conversion fails
  }
}

/**
 * Check if a section has content
 */
export function hasSectionContent(sectionId: string, state: any): boolean {
  switch (sectionId) {
    case 'client':
      return !!(state.client || state.clientLogo)
    case 'results':
      return state.results.length > 0 && state.results.some((r: any) => r.metric || r.value || r.description)
    case 'aboutClient':
      return !!(state.aboutClient?.title || state.aboutClient?.description)
    case 'challenge':
      return !!(state.challenge?.title || state.challenge?.description)
    case 'solution':
      return !!(state.solution?.title || state.solution?.description || (state.solution?.features && state.solution.features.length > 0))
    case 'testimonial':
      return !!(state.testimonial?.quote || state.testimonial?.author || state.testimonial?.role || state.testimonial?.company || state.testimonial?.image)
    case 'pricing':
      return !!(state.pricing?.price || state.pricing?.label || state.pricing?.description || state.pricing?.primaryButton?.text || state.pricing?.secondaryButton?.text)
    case 'features':
      return !!(state.features?.title || state.features?.description || (state.features?.items && state.features.items.length > 0))
    case 'process':
      return !!(state.process?.title || state.process?.description || (state.process?.steps && state.process.steps.length > 0))
    case 'faq':
      return !!(state.faq?.title || state.faq?.description || (state.faq?.items && state.faq.items.length > 0))
    case 'cta':
      return !!(state.cta?.title || state.cta?.description || state.cta?.primaryButton?.text || state.cta?.secondaryButton?.text)
    default:
      return false
  }
}

/**
 * Check if a section exists
 */
export function sectionExists(sectionId: string, state: any): boolean {
  switch (sectionId) {
    case 'client':
      return !!(state.client || state.clientLogo)
    case 'results':
      return state.results.length > 0
    case 'aboutClient':
      return !!state.aboutClient
    case 'challenge':
      return !!state.challenge
    case 'solution':
      return !!state.solution
    case 'testimonial':
      return !!state.testimonial
    case 'pricing':
      return !!state.pricing
    case 'features':
      return !!state.features
    case 'process':
      return !!state.process
    case 'faq':
      return !!state.faq
    case 'cta':
      return !!state.cta
    default:
      return true // Required sections always exist
  }
}

