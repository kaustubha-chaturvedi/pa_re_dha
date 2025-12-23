"use client"

import { Collapsible } from "@/components/ui/collapsible"
import { ImageInput } from "@/components/ui/image-input"

interface ImageSectionProps {
  image: string
  onImageChange: (value: string) => void
  isOpen: boolean
  onToggle: () => void
  sectionRef: (el: HTMLDivElement | null) => void
}

export function ImageSection({
  image,
  onImageChange,
  isOpen,
  onToggle,
  sectionRef,
}: ImageSectionProps) {
  return (
    <div ref={sectionRef}>
      <Collapsible
        title="Image"
        isOpen={isOpen}
        onToggle={onToggle}
        className="mb-4"
      >
        <div className="space-y-4 my-2">
        <ImageInput
          id="image"
          value={image}
          onChange={onImageChange}
          placeholder="https://example.com/image.jpg"
          description="Main image for this content. Click 'Browse' to select from media library or upload a new image."
          />
        </div>
      </Collapsible>
    </div>
  )
}

