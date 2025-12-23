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
    console.log(`[listPortfolio] in ${isDevelopment() ? 'development' : 'production'} mode. Listing portfolio from ${CONTENT_PATHS.portfolio}`)
    const portfolio = isDevelopment()
      ? await listContentFromLocal(CONTENT_PATHS.portfolio, sortByDate)
      : await listContentFromGitHub(CONTENT_PATHS.portfolio)

    return NextResponse.json({ portfolio })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
    }
    console.error("Error listing portfolio:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
