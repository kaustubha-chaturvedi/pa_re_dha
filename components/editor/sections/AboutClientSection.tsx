"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Collapsible } from "@/components/ui/collapsible"

interface AboutClientSectionProps {
  aboutClient: { title?: string; description?: string } | null
  onAboutClientChange: (value: { title?: string; description?: string } | null) => void
  isOpen: boolean
  onToggle: () => void
  sectionRef: (el: HTMLDivElement | null) => void
}

export function AboutClientSection({
  aboutClient,
  onAboutClientChange,
  isOpen,
  onToggle,
  sectionRef,
}: AboutClientSectionProps) {
  if (!aboutClient) return null

  return (
    <div ref={sectionRef}>
      <Collapsible
        title="About Client Section"
        isOpen={isOpen}
        onToggle={onToggle}
        className="mb-4"
      >
        <div className="space-y-3 my-2">
          <Input
            value={aboutClient.title || ""}
            onChange={(e) => onAboutClientChange({ ...aboutClient, title: e.target.value })}
            placeholder="Section Title (e.g., About the Client)"
          />
          <Textarea
            value={aboutClient.description || ""}
            onChange={(e) => onAboutClientChange({ ...aboutClient, description: e.target.value })}
            placeholder="Description of the client..."
            rows={3}
          />
        </div>
      </Collapsible>
    </div>
  )
}

