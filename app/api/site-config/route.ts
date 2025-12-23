import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"
import fs from "fs/promises"
import path from "path"

const SITE_CONFIG_PATH = path.join(process.cwd(), "..", "site", "src", "layouts", "site-config.json")

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === "development"

export async function GET(req: NextRequest) {
  // Skip auth in development
  if (!isDevelopment) {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  try {
    const content = await fs.readFile(SITE_CONFIG_PATH, "utf-8")
    const config = JSON.parse(content)
    return NextResponse.json(config)
  } catch (error: any) {
    if (error.code === "ENOENT") {
      // File doesn't exist, return default config
      return NextResponse.json({
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
      })
    }
    return NextResponse.json({ error: "Failed to read config" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  // Skip auth in development
  if (!isDevelopment) {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  try {
    const config = await req.json()
    
    // Ensure directory exists
    const configDir = path.dirname(SITE_CONFIG_PATH)
    await fs.mkdir(configDir, { recursive: true })
    
    // Write config file
    await fs.writeFile(SITE_CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8")
    
    return NextResponse.json({ success: true, message: "Site config saved successfully" })
  } catch (error: any) {
    console.error("Error saving site config:", error)
    return NextResponse.json({ error: error.message || "Failed to save config" }, { status: 500 })
  }
}

