import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-service"
import fs from "fs/promises"
import path from "path"
import { isDevelopment } from "@/lib/env"

const SITE_CONFIG_PATH = "src/layouts/site-config.json"

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
  try {
    // In production, require authentication
    if (!isDevelopment()) {
      try {
        await requireAuth()
      } catch (authError: any) {
        console.error('[site-config GET] Authentication error:', authError.message)
        return NextResponse.json(
          { error: authError.message || 'Authentication failed' },
          { status: authError.message === 'Unauthorized' ? 401 : 403 }
        )
      }

      const githubPat = process.env.GITHUB_PAT
      if (!githubPat) {
        return NextResponse.json({ error: "Server configuration error: GITHUB_PAT not set" }, { status: 500 })
      }

      const repoOwner = process.env.GITHUB_REPO_OWNER || "kaustubha-chaturvedi"
      const repoName = process.env.GITHUB_REPO_NAME || "shadaj_madhyama_dhaivata"

      const encodedPath = SITE_CONFIG_PATH.split('/').map(segment => encodeURIComponent(segment)).join('/')
      const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${encodedPath}?ref=${encodeURIComponent(process.env.GITHUB_BRANCH || "main")}`
      console.log('url', url)
      const getFileRes = await fetch(
        url, 
        {
          method: "GET",
        headers: {
          Authorization: `Bearer ${githubPat}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Admin-CMS",
        },
      })
      if (!getFileRes.ok) {
        return NextResponse.json({ error: "Failed to fetch config" }, { status: getFileRes.status })
      }

      const fileData = await getFileRes.json()
      const content = Buffer.from(fileData.content, 'base64').toString('utf-8')
      const config = JSON.parse(content)
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
  try {
    // Always require auth
    if (!isDevelopment()) {
      try {
        await requireAuth()
      } catch (authError: any) {
        console.error('[site-config POST] Authentication error:', authError.message)
        return NextResponse.json(
          { error: authError.message || 'Authentication failed' },
          { status: authError.message === 'Unauthorized' ? 401 : 403 }
        )
      }
    }

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

