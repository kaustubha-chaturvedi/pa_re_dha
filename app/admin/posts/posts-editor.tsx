"use client"

import { MarkdownEditor } from "@/components/editor/markdown-editor"
import { useSession } from "next-auth/react"

export function PostsEditor() {
  const { data: session } = useSession()
  
  return (
    <MarkdownEditor
      filePathTemplate="apps/site/src/content/posts/{slug}.md"
      initialContent=""
      initialFrontmatter={{
        date: new Date().toISOString().split("T")[0],
        draft: false,
        ...(session?.user?.name && { author: session.user.name }),
        ...(session?.user?.image && { authorImage: session.user.image }),
      }}
      editorTitle="Blog Post"
      editorDescription="Create or edit blog posts"
    />
  )
}

