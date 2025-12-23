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
        console.log(`[DEV] List services by: ${session.user?.name || session.user?.email}`)
      }
    }
    
    if (isDevelopment) {
      // List services from local filesystem
      const appDir = process.cwd()
      const workspaceRoot = appDir.includes('/apps/admin') 
        ? join(appDir, '../..') 
        : appDir
      const servicesDir = join(workspaceRoot, 'apps/site/src/content/services')
      
      if (!existsSync(servicesDir)) {
        return NextResponse.json({ services: [] })
      }

      const files = await readdir(servicesDir)
      const services = []

      for (const file of files) {
        if (file.endsWith('.mdx') || file.endsWith('.md')) {
          const filePath = join(servicesDir, file)
          const fileContent = await import('fs').then(fs => 
            fs.promises.readFile(filePath, 'utf-8')
          )
          const parsed = matter(fileContent)
          const stats = await stat(filePath)
          
          services.push({
            slug: file.replace(/\.(mdx|md)$/, ''),
            title: parsed.data.title || 'Untitled',
            description: parsed.data.description || '',
            date: parsed.data.date || '',
            price: parsed.data.price || '',
            tags: parsed.data.tags || [],
            order: parsed.data.order || 999,
            modified: stats.mtime.toISOString(),
          })
        }
      }

      // Sort by order, then by date
      services.sort((a, b) => {
        if (a.order !== b.order) {
          return a.order - b.order
        }
        const dateA = new Date(a.date || a.modified).getTime()
        const dateB = new Date(b.date || b.modified).getTime()
        return dateB - dateA
      })

      return NextResponse.json({ services })
    } else {
      // In production, we'd need to fetch from GitHub API
      // For now, return empty array
      return NextResponse.json({ services: [] })
    }
  } catch (error) {
    console.error("Error listing services:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

