import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"
import { unlink } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export async function POST(req: NextRequest) {
  try {
    const { slug } = await req.json()

    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 })
    }

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
        console.log(`[DEV] Delete post by: ${session.user?.name || session.user?.email}`)
      }
    }
    
    if (isDevelopment) {
      // Delete from local filesystem
      const appDir = process.cwd()
      const workspaceRoot = appDir.includes('/apps/admin') 
        ? join(appDir, '../..') 
        : appDir
      const filePath = join(workspaceRoot, `apps/site/src/content/posts/${slug}.md`)
      
      // Also try .mdx extension for backwards compatibility
      const filePathMd = join(workspaceRoot, `apps/site/src/content/posts/${slug}.mdx`)
      
      if (existsSync(filePath)) {
        await unlink(filePath)
        return NextResponse.json({ success: true, message: "Post deleted" })
      } else if (existsSync(filePathMd)) {
        await unlink(filePathMd)
        return NextResponse.json({ success: true, message: "Post deleted" })
      } else {
        return NextResponse.json({ error: "File not found" }, { status: 404 })
      }
    } else {
      // In production, delete via GitHub API
      // For now, return error
      return NextResponse.json({ error: "Delete not implemented for production" }, { status: 501 })
    }
  } catch (error) {
    console.error("Error deleting post:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

