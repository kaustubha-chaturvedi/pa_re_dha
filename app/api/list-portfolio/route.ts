import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"
import { readdir, stat } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import matter from "gray-matter"

export async function GET(req: NextRequest) {
  try {
    // Check if we're in development mode
    const isDevelopment = process.env.NODE_ENV !== 'production'
    
    // In development, skip auth checks for easier local development
    if (!isDevelopment) {
      const session = await getServerSession(authOptions)
      
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const allowedUsers = process.env.ADMIN_GITHUB_USERNAMES?.split(",").map(u => u.trim()) || []
      const username = session.user?.name || session.user?.email
      
      if (!username || !allowedUsers.includes(username)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    } else {
      // Optional: Log who's making the request in dev
      const session = await getServerSession(authOptions).catch(() => null)
      if (session) {
        console.log(`[DEV] List portfolio by: ${session.user?.name || session.user?.email}`)
      }
    }
    
    if (isDevelopment) {
      // List portfolio from local filesystem
      const appDir = process.cwd()
      const workspaceRoot = appDir.includes('/apps/admin') 
        ? join(appDir, '../..') 
        : appDir
      const portfolioDir = join(workspaceRoot, 'apps/site/src/content/portfolio')
      
      if (!existsSync(portfolioDir)) {
        return NextResponse.json({ portfolio: [] })
      }

      const files = await readdir(portfolioDir)
      const portfolio = []

      for (const file of files) {
        if (file.endsWith('.mdx') || file.endsWith('.md')) {
          const filePath = join(portfolioDir, file)
          const fileContent = await import('fs').then(fs => 
            fs.promises.readFile(filePath, 'utf-8')
          )
          const parsed = matter(fileContent)
          const stats = await stat(filePath)
          
          portfolio.push({
            slug: file.replace(/\.(mdx|md)$/, ''),
            title: parsed.data.title || 'Untitled',
            description: parsed.data.description || '',
            date: parsed.data.date || '',
            draft: parsed.data.draft || false,
            category: parsed.data.category || '',
            tags: parsed.data.tags || [],
            client: parsed.data.client || '',
            modified: stats.mtime.toISOString(),
          })
        }
      }

      // Sort by date, newest first
      portfolio.sort((a, b) => {
        const dateA = new Date(a.date || a.modified).getTime()
        const dateB = new Date(b.date || b.modified).getTime()
        return dateB - dateA
      })

      return NextResponse.json({ portfolio })
    } else {
      // In production, we'd need to fetch from GitHub API
      // For now, return empty array
      return NextResponse.json({ portfolio: [] })
    }
  } catch (error) {
    console.error("Error listing portfolio:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

