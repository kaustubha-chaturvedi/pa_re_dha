/**
 * Content Service
 * Handles content parsing and formatting
 */

import matter from 'gray-matter'
import { listMarkdownFiles, fetchFileFromUrl } from './github-service'

export interface ContentItem {
  slug: string
  title: string
  description: string
  date: string
  modified?: string
  [key: string]: any
}

/**
 * Parse markdown file and extract metadata
 */
export function parseMarkdownFile(content: string, filename: string): ContentItem {
  const parsed = matter(content)
  const slug = filename.replace(/\.(mdx|md)$/, '')

  return {
    slug,
    title: parsed.data.title || 'Untitled',
    description: parsed.data.description || '',
    date: parsed.data.date || '',
    modified: new Date().toISOString(), // Default to now if not set
    draft: parsed.data.draft || false,
    category: parsed.data.category || '',
    tags: parsed.data.tags || [],
    ...parsed.data,
  }
}

/**
 * List content items from GitHub
 */
export async function listContentFromGitHub(
  directoryPath: string,
  additionalFields: string[] = []
): Promise<ContentItem[]> {
  try {
    const files = await listMarkdownFiles(directoryPath)
    console.log(`[listContentFromGitHub] Found ${files.length} markdown files in ${directoryPath}`)
    
    const items: ContentItem[] = []

    for (const file of files) {
      try {
        const content = await fetchFileFromUrl(file.downloadUrl)
        const item = parseMarkdownFile(content, file.name)
        item.modified = file.updatedAt
        items.push(item)
      } catch (error) {
        console.error(`Error fetching file ${file.name} from ${file.downloadUrl}:`, error)
        // Continue with other files
      }
    }

    console.log(`[listContentFromGitHub] Successfully parsed ${items.length} items from ${files.length} files`)
    return items
  } catch (error) {
    console.error(`[listContentFromGitHub] Error listing files from ${directoryPath}:`, error)
    throw error
  }
}

/**
 * Sort content items by date (newest first)
 */
export function sortByDate(items: ContentItem[]): ContentItem[] {
  return items.sort((a, b) => {
    const dateA = new Date(a.date || a.modified || 0).getTime()
    const dateB = new Date(b.date || b.modified || 0).getTime()
    return dateB - dateA
  })
}

/**
 * Sort content items by order, then by date
 */
export function sortByOrder(items: ContentItem[]): ContentItem[] {
  return items.sort((a, b) => {
    const orderA = a.order || 999
    const orderB = b.order || 999
    if (orderA !== orderB) {
      return orderA - orderB
    }
    const dateA = new Date(a.date || a.modified || 0).getTime()
    const dateB = new Date(b.date || b.modified || 0).getTime()
    return dateB - dateA
  })
}

