import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"
import { readFile } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export async function POST(req: NextRequest) {
  try {
    // Only allow local reads in development
    const isDevelopment = process.env.NODE_ENV !== 'production'
    if (!isDevelopment) {
      return NextResponse.json({ error: "Local reads only allowed in development" }, { status: 403 })
    }

    // In development, skip auth checks for easier local development
    // You can still check session if needed, but don't block on it
    const session = await getServerSession(authOptions).catch(() => null)
    
    // Optional: Log who's making the request in dev
    if (session) {
      console.log(`[DEV] Local fetch by: ${session.user?.name || session.user?.email}`)
    }

    const { path } = await req.json()

    if (!path) {
      return NextResponse.json({ error: "Missing path" }, { status: 400 })
    }

    // Resolve the file path relative to the workspace root
    const appDir = process.cwd()
    const workspaceRoot = appDir.includes('/apps/admin') 
      ? join(appDir, '../..') 
      : appDir
    const filePath = join(workspaceRoot, path)

    if (!existsSync(filePath)) {
      return NextResponse.json({ 
        content: "",
        exists: false 
      })
    }

    const content = await readFile(filePath, 'utf-8')

    return NextResponse.json({ 
      content,
      exists: true
    })
  } catch (error) {
    console.error("Error reading file locally:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

