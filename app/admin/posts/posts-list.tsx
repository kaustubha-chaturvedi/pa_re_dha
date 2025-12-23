"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useSession } from "next-auth/react"
import { Edit, Trash2, Plus, Eye, EyeOff, Loader2 } from "lucide-react"
import { MarkdownEditor } from "@/components/editor/markdown-editor"

interface Post {
  slug: string
  title: string
  description: string
  date: string
  draft: boolean
  category: string
  tags: string[]
  modified: string
}

export function PostsList() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSlug, setEditingSlug] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const { toast } = useToast()
  const { data: session } = useSession()

  const loadPosts = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/list-posts", {
        credentials: 'include',
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to load posts' }))
        throw new Error(errorData.error || "Failed to load posts")
      }
      const data = await res.json()
      setPosts(data.posts || [])
    } catch (error) {
      console.error("Error loading posts:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load posts",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPosts()
  }, [])

  const handleDelete = async (slug: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return
    }

    try {
      const res = await fetch("/api/delete-post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({ slug }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to delete post")
      }

      toast({
        title: "Deleted",
        description: "Post has been deleted",
      })

      loadPosts()
      if (editingSlug === slug) {
        setEditingSlug(null)
      }
    } catch (error) {
      console.error("Error deleting post:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete post",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (slug: string) => {
    setEditingSlug(slug)
    setShowCreate(false)
  }

  const handleCreate = () => {
    setShowCreate(true)
    setEditingSlug(null)
  }

  const handleSave = () => {
    loadPosts()
    setEditingSlug(null)
    setShowCreate(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (showCreate || editingSlug) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => {
            setShowCreate(false)
            setEditingSlug(null)
          }}>
            ← Back to List
          </Button>
        </div>
        <MarkdownEditor
          key={editingSlug || 'new'}
          filePathTemplate="apps/site/src/content/posts/{slug}.md"
          initialSlug={editingSlug || ""}
          initialContent=""
          initialFrontmatter={{
            date: new Date().toISOString().split("T")[0],
            draft: false,
            ...(session?.user?.name && { author: session.user.name }),
            ...(session?.user?.image && { authorImage: session.user.image }),
          }}
          editorTitle="Blog Post"
          editorDescription="Create or edit blog posts"
          onSave={handleSave}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">All Posts ({posts.length})</h3>
          <p className="text-sm text-muted-foreground">Manage your blog posts</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Post
        </Button>
      </div>

      {posts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No posts yet. Create your first post!</p>
            <Button onClick={handleCreate} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Create Post
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {posts.map((post) => (
            <Card key={post.slug}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{post.title}</CardTitle>
                      {post.draft && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                          <EyeOff className="h-3 w-3" />
                          Draft
                        </span>
                      )}
                    </div>
                    {post.description && (
                      <CardDescription className="mt-1">{post.description}</CardDescription>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      {post.category && (
                        <span className="px-2 py-0.5 rounded bg-secondary/10 text-secondary text-xs">
                          {post.category}
                        </span>
                      )}
                      {post.date && (
                        <span>{new Date(post.date).toLocaleDateString()}</span>
                      )}
                      {post.tags && post.tags.length > 0 && (
                        <span className="text-xs">
                          {post.tags.slice(0, 3).join(", ")}
                          {post.tags.length > 3 && ` +${post.tags.length - 3} more`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(post.slug)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(post.slug, post.title)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}


