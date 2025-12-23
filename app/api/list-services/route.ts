import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-service"
import { listContentFromGitHub, sortByOrder } from "@/lib/content-service"
import { listContentFromLocal, CONTENT_PATHS } from "@/lib/local-content-service"
import { isDevelopment } from "@/lib/env"

export async function GET(req: NextRequest) {
  try {
    if (!isDevelopment()) {
      try {
        await requireAuth()
      } catch (authError: any) {
        console.error('[list-services] Authentication error:', authError.message)
        return NextResponse.json(
          { error: authError.message || 'Authentication failed' },
          { status: authError.message === 'Unauthorized' ? 401 : 403 }
        )
      }
    }

    const services = isDevelopment()
      ? await listContentFromLocal(CONTENT_PATHS.services, sortByOrder)
      : await listContentFromGitHub(CONTENT_PATHS.services)

    return NextResponse.json({ services })
  } catch (error: any) {
    console.error("Error listing services:", error)
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
