import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"
import fs from "fs/promises"
import path from "path"
import { isDevelopment } from "@/lib/env"

const SITE_CONFIG_PATH = "apps/site/src/layouts/site-config.json"

// Default config
const defaultConfig = {
  header: {
    logo: {
      text: "Agency",
      image: null,
    },
    navigation: [
      { label: "About", link: "/about" },
      { label: "Services", link: "/services" },
      { label: "Blog", link: "/blog" },
      { label: "Portfolio", link: "/portfolio" },
    ],
    contactButton: {
      text: "Contact Us",
      link: "/contact",
    },
  },
  footer: {
    company: {
      name: "Agency",
      description: "A results-obsessed agency building brands that change the world.",
      logo: null,
    },
    links: {
      company: [
        { label: "About Us", link: "/about" },
        { label: "Careers", link: "/careers" },
        { label: "Portfolio", link: "/portfolio" },
        { label: "Blog", link: "/blog" },
      ],
      resources: [
        { label: "Help Center", link: "#" },
        { label: "FAQs", link: "#" },
        { label: "Contact Us", link: "/contact" },
      ],
      legal: [
        { label: "Privacy Policy", link: "#" },
        { label: "Terms of Service", link: "#" },
      ],
    },
    social: {
      facebook: null,
      twitter: null,
      github: null,
    },
    copyright: "© 2024 Agency. All rights reserved.",
  },
  colors: {
    primary: "#5b13ec",
    primaryHover: "#4a0fd9",
    secondary: "#FF6B00",
  },
}

export async function GET(req: NextRequest) {
  // Always require auth in production
  if (!isDevelopment()) {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  try {
    // In production, fetch from GitHub
    if (!isDevelopment()) {
      const session = await getServerSession(authOptions)
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const allowedUsers = process.env.ADMIN_GITHUB_USERNAMES?.split(",").map(u => u.trim()) || []
      const username = session.user?.name || session.user?.email
      
      if (!username || !allowedUsers.includes(username)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      const githubPat = process.env.GITHUB_PAT
      if (!githubPat) {
        return NextResponse.json({ error: "Server configuration error: GITHUB_PAT not set" }, { status: 500 })
      }

      const repoOwner = process.env.GITHUB_REPO_OWNER || "kaustubha-chaturvedi"
      const repoName = process.env.GITHUB_REPO_NAME || "shadaj_madhyama_dhaivata"

      const encodedPath = SITE_CONFIG_PATH.split('/').map(segment => encodeURIComponent(segment)).join('/')
      
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
          return NextResponse.json(defaultConfig)
        }
        const error = await getFileRes.text()
        console.error("GitHub API error:", getFileRes.status, error)
        return NextResponse.json({ error: "Failed to fetch config" }, { status: getFileRes.status })
      }

      const fileData = await getFileRes.json()
      const content = Buffer.from(fileData.content, 'base64').toString('utf-8')
      const config = JSON.parse(content)
      
      // Ensure colors object exists
      if (!config.colors) {
        config.colors = defaultConfig.colors
      }
      
      return NextResponse.json(config)
    }

    // In development, read from local file system
    const localPath = path.join(process.cwd(), "..", "site", "src", "layouts", "site-config.json")
    const content = await fs.readFile(localPath, "utf-8")
    const config = JSON.parse(content)
    return NextResponse.json(config)
  } catch (error: any) {
    if (error.code === "ENOENT" || error.message?.includes("404")) {
      // File doesn't exist, return default config
      return NextResponse.json(defaultConfig)
    }
    console.error("Error reading config:", error)
    return NextResponse.json({ error: "Failed to read config" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  // Always require auth
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // In production, require GitHub authentication
  if (!isDevelopment()) {
    const allowedUsers = process.env.ADMIN_GITHUB_USERNAMES?.split(",").map(u => u.trim()) || []
    const username = session.user?.name || session.user?.email
    
    if (!username || !allowedUsers.includes(username)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  try {
    const config = await req.json()
    
    // In production, commit to GitHub
    if (!isDevelopment()) {
      const githubPat = process.env.GITHUB_PAT
      if (!githubPat) {
        return NextResponse.json({ error: "Server configuration error: GITHUB_PAT not set" }, { status: 500 })
      }

      const repoOwner = process.env.GITHUB_REPO_OWNER || "kaustubha-chaturvedi"
      const repoName = process.env.GITHUB_REPO_NAME || "shadaj_madhyama_dhaivata"

      // Get current file SHA if it exists
      let sha: string | undefined
      const encodedPath = SITE_CONFIG_PATH.split('/').map(segment => encodeURIComponent(segment)).join('/')
      
      try {
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

        if (getFileRes.ok) {
          const fileData = await getFileRes.json()
          sha = fileData.sha
        }
      } catch (error) {
        // File doesn't exist, that's okay
      }

      // Commit file to GitHub
      const commitRes = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${encodedPath}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${githubPat}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
            "User-Agent": "Admin-CMS",
          },
          body: JSON.stringify({
            message: "Update site configuration",
            content: Buffer.from(JSON.stringify(config, null, 2)).toString("base64"),
            branch: process.env.GITHUB_BRANCH || "main",
            ...(sha && { sha }),
          }),
        }
      )

      if (!commitRes.ok) {
        const error = await commitRes.text()
        console.error("GitHub API error:", error)
        return NextResponse.json(
          { error: "Failed to save config", details: error },
          { status: commitRes.status }
        )
      }

      return NextResponse.json({ 
        success: true, 
        message: "Site config saved successfully and committed to GitHub" 
      })
    }

    // In development, save to local file system
    const localPath = path.join(process.cwd(), "..", "site", "src", "layouts", "site-config.json")
    const configDir = path.dirname(localPath)
    await fs.mkdir(configDir, { recursive: true })
    await fs.writeFile(localPath, JSON.stringify(config, null, 2), "utf-8")
    
    return NextResponse.json({ success: true, message: "Site config saved successfully" })
  } catch (error: any) {
    console.error("Error saving site config:", error)
    return NextResponse.json({ error: error.message || "Failed to save config" }, { status: 500 })
  }
}

