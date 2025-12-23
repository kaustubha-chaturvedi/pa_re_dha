"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Collapsible } from "@/components/ui/collapsible"

interface BasicInformationSectionProps {
  title: string
  description: string
  tags: string[]
  tagInput: string
  slug: string
  onTitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onTagsChange: (tags: string[]) => void
  onTagInputChange: (value: string) => void
  isOpen: boolean
  onToggle: () => void
  sectionRef: (el: HTMLDivElement | null) => void
}

export function BasicInformationSection({
  title,
  description,
  tags,
  tagInput,
  slug,
  onTitleChange,
  onDescriptionChange,
  onTagsChange,
  onTagInputChange,
  isOpen,
  onToggle,
  sectionRef,
}: BasicInformationSectionProps) {
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      const newTags = tagInput
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0 && !tags.includes(tag))

      if (newTags.length > 0) {
        onTagsChange([...tags, ...newTags])
      }
      onTagInputChange("")
    }
  }

  const handleTagBlur = () => {
    if (tagInput.trim()) {
      const newTags = tagInput
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0 && !tags.includes(tag))

      if (newTags.length > 0) {
        onTagsChange([...tags, ...newTags])
        onTagInputChange("")
      }
    }
  }

  return (
    <div ref={sectionRef}>
      <Collapsible
        title="Basic Information"
        isOpen={isOpen}
        onToggle={onToggle}
        className="mb-4"
      >
        <div className="space-y-4 my-2">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Page title"
            />
            {slug && (
              <p className="text-xs text-muted-foreground">
                URL: <code className="px-1 py-0.5 bg-muted rounded text-xs">{slug}</code>
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Page description"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => onTagInputChange(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={handleTagBlur}
                placeholder="Enter tags separated by commas (e.g., AI, Marketing, Technology)"
              />
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-sm rounded-md"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => onTagsChange(tags.filter((_, i) => i !== index))}
                      className="ml-1 hover:text-primary-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Collapsible>
    </div>
  )
}

