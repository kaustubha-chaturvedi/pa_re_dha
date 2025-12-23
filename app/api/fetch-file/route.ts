import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const allowedUsers = process.env.ADMIN_GITHUB_USERNAMES?.split(",").map(u => u.trim()) || []
    const username = session.user?.name || session.user?.email
    
    if (!username || !allowedUsers.includes(username)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { path } = await req.json()

    if (!path) {
      return NextResponse.json({ error: "Missing path" }, { status: 400 })
    }

    const githubPat = process.env.GITHUB_PAT
    if (!githubPat) {
      return NextResponse.json({ error: "Server configuration error: GITHUB_PAT not set" }, { status: 500 })
    }

    const repoOwner = process.env.GITHUB_REPO_OWNER || "kaustubha-chaturvedi"
    const repoName = process.env.GITHUB_REPO_NAME || "shadaj_madhyama_dhaivata"

    // URL encode the path segments
    const encodedPath = path.split('/').map((segment: string) => encodeURIComponent(segment)).join('/')

    // Fetch file content from GitHub
    const getFileRes = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${encodedPath}`,
      {
        headers: {
          Authorization: `Bearer ${githubPat}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Admin-CMS",
        },
      }
    )

    if (!getFileRes.ok) {
      if (getFileRes.status === 404) {
        return NextResponse.json({ 
          content: "",
          exists: false 
        })
      }
      let errorDetails = "Unknown error"
      try {
        const errorData = await getFileRes.json()
        errorDetails = errorData.message || JSON.stringify(errorData)
      } catch {
        errorDetails = await getFileRes.text().catch(() => "Unknown error")
      }
      console.error("GitHub API error:", getFileRes.status, errorDetails)
      return NextResponse.json(
        { error: "Failed to fetch file", details: errorDetails },
        { status: getFileRes.status }
      )
    }

    const fileData = await getFileRes.json()
    const content = Buffer.from(fileData.content, 'base64').toString('utf-8')

    return NextResponse.json({ 
      content,
      exists: true,
      sha: fileData.sha
    })
  } catch (error) {
    console.error("Error fetching file:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

