import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-service"
import { fetchFile } from "@/lib/github-service"

export async function POST(req: NextRequest) {
  try {
    await requireAuth()

    const { path } = await req.json()
    console.log('path', path)

    if (!path) {
      return NextResponse.json({ error: "Missing path" }, { status: 400 })
    }

    try {
      const { content, sha } = await fetchFile(path)
      
      return NextResponse.json({ 
        content: content || "",
        exists: !!content,
        sha: sha || undefined
      })
    } catch (error: any) {
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        return NextResponse.json({ 
          content: "",
          exists: false 
        })
      }
      throw error
    }
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
    }
    if (error.message?.includes('GITHUB_PAT')) {
      return NextResponse.json({ error: "Server configuration error: GITHUB_PAT not set" }, { status: 500 })
    }
    console.error("Error fetching file:", error)
    return NextResponse.json({ 
      error: "Failed to fetch file", 
      details: error.message 
    }, { status: 500 })
  }
}
