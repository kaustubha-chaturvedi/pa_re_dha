"use client"

import { Editor } from "../editor"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Collapsible } from "@/components/ui/collapsible"
import { useToast } from "@/components/ui/use-toast"
import { markdownToHtml, htmlToMarkdown } from "../utils"
import matter from "gray-matter"

interface ContentSectionProps {
  content: string
  htmlContent: string
  rawContent: string
  rawMode: boolean
  frontmatter: Record<string, any>
  onContentChange: (content: string) => void
  onHtmlContentChange: (html: string) => void
  onRawContentChange: (raw: string) => void
  onRawModeChange: (mode: boolean) => void
  onFrontmatterUpdate: (updates: Record<string, any>) => void
  isOpen: boolean
  onToggle: () => void
  sectionRef: (el: HTMLDivElement | null) => void
}

export function ContentSection({
  content,
  htmlContent,
  rawContent,
  rawMode,
  frontmatter,
  onContentChange,
  onHtmlContentChange,
  onRawContentChange,
  onRawModeChange,
  onFrontmatterUpdate,
  isOpen,
  onToggle,
  sectionRef,
}: ContentSectionProps) {
  const { toast } = useToast()

  const handleTabChange = async (value: string) => {
    const isRaw = value === "raw"

    if (isRaw) {
      // Switching to raw mode - generate raw content from current form state
      const generated = matter.stringify(content, frontmatter)
      onRawContentChange(generated)
      onRawModeChange(true)
    } else {
      // Switching to visual mode - parse raw content and populate form fields
      if (rawContent) {
        try {
          const parsed = matter(rawContent)
          onFrontmatterUpdate(parsed.data)
          const markdownContent = parsed.content || ""
          onContentChange(markdownContent)
          // Convert markdown to HTML for TipTap
          const html = await markdownToHtml(markdownContent)
          onHtmlContentChange(html)
          onRawModeChange(false)
        } catch (error) {
          console.error("Error parsing raw content:", error)
          toast({
            title: "Parse error",
            description: "Failed to parse raw markdown. Please check the format.",
            variant: "destructive",
          })
        }
      } else {
        onRawModeChange(false)
      }
    }
  }

  return (
    <div ref={sectionRef}>
      <Collapsible
        title="Content"
        isOpen={isOpen}
        onToggle={onToggle}
        className="mb-4"
      >
        <div className="space-y-4 my-2">
          <Tabs value={rawMode ? "raw" : "visual"} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="visual">Visual Editor</TabsTrigger>
              <TabsTrigger value="raw">Raw Markdown</TabsTrigger>
            </TabsList>
            <TabsContent value="visual" className="space-y-2">
              <Label>Content</Label>
              <Editor
                content={htmlContent || ""}
                onChange={(html) => {
                  onHtmlContentChange(html)
                  // Convert HTML back to markdown for storage
                  const markdown = htmlToMarkdown(html)
                  onContentChange(markdown)
                }}
              />
            </TabsContent>
            <TabsContent value="raw" className="space-y-2">
              <Label>Raw Markdown</Label>
              <Textarea
                value={rawContent}
                onChange={(e) => onRawContentChange(e.target.value)}
                className="font-mono text-sm min-h-[500px]"
                placeholder="---&#10;title: Your Post Title&#10;description: Your description&#10;date: 2024-01-01&#10;draft: false&#10;---&#10;&#10;Your content here..."
              />
              <p className="text-xs text-muted-foreground">
                Edit the raw markdown file including frontmatter. Changes here will override form fields when saved.
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </Collapsible>
    </div>
  )
}

