/**
 * Local Content Service
 * Handles local file system operations (development only)
 */

import { readdir, stat, readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import matter from 'gray-matter'
import { ContentItem, parseMarkdownFile, sortByDate, sortByOrder } from './content-service'

const isDevelopment = process.env.NODE_ENV !== 'production'

function getWorkspaceRoot(): string {
  const appDir = process.cwd()
  return appDir.includes('/apps/admin') ? join(appDir, '../..') : appDir
}

/**
 * List content items from local file system
 */
export async function listContentFromLocal(
  contentPath: string,
  sortFn: (items: ContentItem[]) => ContentItem[] = sortByDate
): Promise<ContentItem[]> {
  if (!isDevelopment) {
    throw new Error('Local file system access only allowed in development')
  }

  const workspaceRoot = getWorkspaceRoot()
  const fullPath = join(workspaceRoot, contentPath)

  if (!existsSync(fullPath)) {
    return []
  }

  const files = await readdir(fullPath)
  const items: ContentItem[] = []

  for (const file of files) {
    if (file.endsWith('.mdx') || file.endsWith('.md')) {
      try {
        const filePath = join(fullPath, file)
        const fileContent = await readFile(filePath, 'utf-8')
        const item = parseMarkdownFile(fileContent, file)
        const stats = await stat(filePath)
        item.modified = stats.mtime.toISOString()
        items.push(item)
      } catch (error) {
        console.error(`Error reading file ${file}:`, error)
      }
    }
  }

  return sortFn(items)
}

/**
 * Content directory paths
 */
export const CONTENT_PATHS = {
  posts: 'apps/site/src/content/posts',
  services: 'apps/site/src/content/services',
  portfolio: 'apps/site/src/content/portfolio',
} as const

