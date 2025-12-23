import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-service"
import { deleteFile } from "@/lib/github-service"
import { unlink } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import { CONTENT_PATHS } from "@/lib/local-content-service"
import { isDevelopment } from "@/lib/env"

export async function POST(req: NextRequest) {
  try {
    const { slug } = await req.json()

    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 })
    }

    if (!isDevelopment()) {
      await requireAuth()
    }

    if (!isDevelopment()) {
      // Try both .md and .mdx extensions
      const possiblePaths = [
        `${CONTENT_PATHS.services}/${slug}.md`,
        `${CONTENT_PATHS.services}/${slug}.mdx`,
      ]

      let deleted = false
      for (const filePath of possiblePaths) {
        try {
          await deleteFile(filePath, `Delete service: ${slug}`)
          deleted = true
          break
        } catch (error) {
          // Try next path
        }
      }

      if (!deleted) {
        return NextResponse.json({ error: "File not found" }, { status: 404 })
      }

      return NextResponse.json({ success: true, message: "Service deleted" })
    }

    // Development: delete from local filesystem
    const workspaceRoot = process.cwd().includes('/apps/admin')
      ? join(process.cwd(), '../..')
      : process.cwd()
    
    const filePath = join(workspaceRoot, `${CONTENT_PATHS.services}/${slug}.md`)
    const filePathMdx = join(workspaceRoot, `${CONTENT_PATHS.services}/${slug}.mdx`)

    if (existsSync(filePath)) {
      await unlink(filePath)
      return NextResponse.json({ success: true, message: "Service deleted" })
    } else if (existsSync(filePathMdx)) {
      await unlink(filePathMdx)
      return NextResponse.json({ success: true, message: "Service deleted" })
    }

    return NextResponse.json({ error: "File not found" }, { status: 404 })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
    }
    console.error("Error deleting service:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
