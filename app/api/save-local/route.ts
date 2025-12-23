import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

import { isDevelopment } from "@/lib/env"

export async function POST(req: NextRequest) {
  try {
    // Only allow local saves in development
    if (!isDevelopment()) {
      return NextResponse.json({ error: "Local saves only allowed in development" }, { status: 403 })
    }

    // In development, skip auth checks for easier local development
    // You can still check session if needed, but don't block on it
    const session = await getServerSession(authOptions).catch(() => null)
    
    // Optional: Log who's making the request in dev
    if (session) {
      console.log(`[DEV] Local save by: ${session.user?.name || session.user?.email}`)
    }

    const { path, content, author, authorImage } = await req.json()

    if (!path || !content) {
      return NextResponse.json({ error: "Missing path or content" }, { status: 400 })
    }

    // If author info is provided, update the frontmatter
    let finalContent = content
    if (author || authorImage) {
      const matter = await import('gray-matter')
      const parsed = matter.default(content)
      const frontmatter = {
        ...parsed.data,
        ...(author && { author }),
        ...(authorImage && { authorImage }),
      }
      finalContent = matter.default.stringify(parsed.content, frontmatter)
    }

    // Resolve the file path relative to the workspace root
    // In Next.js, process.cwd() is the app directory, so we need to go up to the monorepo root
    const appDir = process.cwd()
    const workspaceRoot = appDir.includes('/apps/admin') 
      ? join(appDir, '../..') 
      : appDir
    const filePath = join(workspaceRoot, path)

    console.log(`[DEV] Saving file to: ${filePath}`)
    console.log(`[DEV] Workspace root: ${workspaceRoot}`)
    console.log(`[DEV] Requested path: ${path}`)

    // Ensure the directory exists
    const dir = join(filePath, '..')
    if (!existsSync(dir)) {
      console.log(`[DEV] Creating directory: ${dir}`)
      await mkdir(dir, { recursive: true })
    }

    // Write the file
    await writeFile(filePath, finalContent, 'utf-8')
    
    // Verify the file was written
    if (existsSync(filePath)) {
      console.log(`[DEV] File successfully saved: ${filePath}`)
    } else {
      console.error(`[DEV] File save verification failed: ${filePath}`)
    }

    return NextResponse.json({ 
      success: true,
      message: `File saved locally to ${path}`,
      filePath: filePath,
      note: "If changes don't appear, try refreshing the Astro dev server or hard refresh the browser (Ctrl+Shift+R)"
    })
  } catch (error) {
    console.error("Error saving file locally:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

