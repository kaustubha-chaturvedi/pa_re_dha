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

    const { path, content, message } = await req.json()

    if (!path || !content) {
      return NextResponse.json({ error: "Missing path or content" }, { status: 400 })
    }

    const githubPat = process.env.GITHUB_PAT
    if (!githubPat) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const repoOwner = process.env.GITHUB_REPO_OWNER || "kaustubha-chaturvedi"
    const repoName = process.env.GITHUB_REPO_NAME || "shadaj_madhyama_dhaivata"

    // Get current file SHA if it exists
    let sha: string | undefined
    try {
      const getFileRes = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`,
        {
          headers: {
            Authorization: `Bearer ${githubPat}`,
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "Admin-CMS",
          },
        }
      )

      if (getFileRes.ok) {
        const fileData = await getFileRes.json()
        sha = fileData.sha
      }
    } catch (error) {
      // File doesn't exist, that's okay
    }

    // Commit file
    const commitRes = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${githubPat}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
          "User-Agent": "Admin-CMS",
        },
        body: JSON.stringify({
          message: message || `Update ${path}`,
          content: Buffer.from(content).toString("base64"),
          branch: "main",
          ...(sha && { sha }),
        }),
      }
    )

    if (!commitRes.ok) {
      const error = await commitRes.text()
      console.error("GitHub API error:", error)
      return NextResponse.json(
        { error: "Failed to commit file", details: error },
        { status: commitRes.status }
      )
    }

    const result = await commitRes.json()
    return NextResponse.json({ 
      success: true, 
      commit: result.commit,
      content: result.content 
    })
  } catch (error) {
    console.error("Error committing file:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

