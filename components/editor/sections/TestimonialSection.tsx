"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ImageInput } from "@/components/ui/image-input"
import { Collapsible } from "@/components/ui/collapsible"

interface TestimonialSectionProps {
  testimonial: { quote?: string; author?: string; role?: string; company?: string; image?: string } | null
  onTestimonialChange: (value: { quote?: string; author?: string; role?: string; company?: string; image?: string } | null) => void
  isOpen: boolean
  onToggle: () => void
  sectionRef: (el: HTMLDivElement | null) => void
}

export function TestimonialSection({
  testimonial,
  onTestimonialChange,
  isOpen,
  onToggle,
  sectionRef,
}: TestimonialSectionProps) {
  if (!testimonial) return null

  return (
    <div ref={sectionRef}>
      <Collapsible
        title="Testimonial"
        isOpen={isOpen}
        onToggle={onToggle}
        className="mb-4"
      >
        <div className="space-y-3 my-2">
          <Textarea
            value={testimonial.quote || ""}
            onChange={(e) => onTestimonialChange({ ...testimonial, quote: e.target.value })}
            placeholder="Testimonial quote..."
            rows={3}
          />
          <Input
            value={testimonial.author || ""}
            onChange={(e) => onTestimonialChange({ ...testimonial, author: e.target.value })}
            placeholder="Author name"
          />
          <Input
            value={testimonial.role || ""}
            onChange={(e) => onTestimonialChange({ ...testimonial, role: e.target.value })}
            placeholder="Author role"
          />
          <Input
            value={testimonial.company || ""}
            onChange={(e) => onTestimonialChange({ ...testimonial, company: e.target.value })}
            placeholder="Company name"
          />
          <ImageInput
            id="testimonial-image"
            label="Author Image URL (optional)"
            value={testimonial.image || ""}
            onChange={(image) => onTestimonialChange({ ...testimonial, image })}
            placeholder="https://example.com/author.jpg"
            description="Author's profile image. Click 'Browse' to select from media library or upload a new image."
          />
        </div>
      </Collapsible>
    </div>
  )
}

