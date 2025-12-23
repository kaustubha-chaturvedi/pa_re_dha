import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-service"
import { fetchFile, commitFile } from "@/lib/github-service"

export async function POST(req: NextRequest) {
  try {
    await requireAuth()

    const { path, content, message } = await req.json()

    if (!path || !content) {
      return NextResponse.json({ error: "Missing path or content" }, { status: 400 })
    }

    // Get current file SHA if it exists
    let sha: string | undefined
    try {
      const fileData = await fetchFile(path)
      sha = fileData.sha || undefined
    } catch (error) {
      // File doesn't exist, that's okay
    }

    const result = await commitFile(path, content, message || `Update ${path}`, sha)

    return NextResponse.json({ 
      success: true, 
      commit: result.commit,
      content: result.content 
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
    }
    if (error.message?.includes('GITHUB_PAT')) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }
    console.error("Error committing file:", error)
    return NextResponse.json({ 
      error: "Failed to commit file", 
      details: error.message 
    }, { status: 500 })
  }
}
