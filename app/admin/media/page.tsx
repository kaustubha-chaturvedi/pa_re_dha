import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { MediaLibrary } from "./media-library"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function MediaPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <h1 className="text-2xl font-bold">Admin CMS</h1>
          </Link>
          <form action="/api/auth/signout" method="post">
            <Button type="submit" variant="outline">
              Sign Out
            </Button>
          </form>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2">Media Library</h2>
          <p className="text-muted-foreground">Upload and manage images for your site</p>
        </div>

        <MediaLibrary />
      </main>
    </div>
  )
}

