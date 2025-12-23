import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"
import jwt from "jsonwebtoken"

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

    const secret = process.env.UPLOAD_TOKEN_SECRET
    if (!secret) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    // Generate short-lived JWT (15 minutes)
    const token = jwt.sign(
      { 
        username,
        exp: Math.floor(Date.now() / 1000) + 15 * 60 // 15 minutes
      },
      secret
    )

    return NextResponse.json({ token })
  } catch (error) {
    console.error("Error generating upload token:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
