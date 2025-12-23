import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-service"
import { listContentFromGitHub, sortByOrder } from "@/lib/content-service"
import { listContentFromLocal, CONTENT_PATHS } from "@/lib/local-content-service"
import { isDevelopment } from "@/lib/env"

export async function GET(req: NextRequest) {
  try {
    if (!isDevelopment()) {
      await requireAuth()
    }

    const services = isDevelopment()
      ? await listContentFromLocal(CONTENT_PATHS.services, sortByOrder)
      : await listContentFromGitHub(CONTENT_PATHS.services)

    return NextResponse.json({ services })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
    }
    console.error("Error listing services:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
