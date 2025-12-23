import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "./api/auth/[...nextauth]/route"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Settings, Layout, Briefcase, Palette, Image } from "lucide-react"

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin CMS</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {session.user?.name || session.user?.email}
            </span>
            <form action="/api/auth/signout" method="post">
              <Button type="submit" variant="outline">
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="h-5 w-5" />
                Page Builder
              </CardTitle>
              <CardDescription>Visual page editor with live preview</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/builder">
                <Button className="w-full">Open Page Builder</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Blog Posts
              </CardTitle>
              <CardDescription>Create and edit blog posts</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/posts">
                <Button className="w-full">Manage Posts</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Services
              </CardTitle>
              <CardDescription>Manage service pages</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/services">
                <Button className="w-full">Manage Services</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Portfolio
              </CardTitle>
              <CardDescription>Manage portfolio case studies</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/portfolio">
                <Button className="w-full">Manage Portfolio</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Site Customizer
              </CardTitle>
              <CardDescription>Customize header, footer, and color scheme</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/site-customizer">
                <Button className="w-full">Open Site Customizer</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Media Library
              </CardTitle>
              <CardDescription>Upload and manage images in Cloudflare R2</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/media">
                <Button className="w-full">Open Media Library</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

