import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-service"
import { listContentFromGitHub, sortByDate } from "@/lib/content-service"
import { listContentFromLocal, CONTENT_PATHS } from "@/lib/local-content-service"
import { isDevelopment } from "@/lib/env"

export async function GET(req: NextRequest) {
  try {
    if (!isDevelopment()) {
      await requireAuth()
    }

    const posts = isDevelopment()
      ? await listContentFromLocal(CONTENT_PATHS.posts, sortByDate)
      : await listContentFromGitHub(CONTENT_PATHS.posts)

    return NextResponse.json({ posts })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
    }
    console.error("Error listing posts:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
