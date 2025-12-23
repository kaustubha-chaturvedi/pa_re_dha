"use client"

import { MarkdownEditor } from "@/components/editor/markdown-editor"

export function ServicesEditor() {
  return (
    <MarkdownEditor
      filePathTemplate="apps/site/src/content/services/{slug}.md"
      initialContent=""
      initialFrontmatter={{
        order: 0,
      }}
      editorTitle="Service"
      editorDescription="Create or edit services"
    />
  )
}

