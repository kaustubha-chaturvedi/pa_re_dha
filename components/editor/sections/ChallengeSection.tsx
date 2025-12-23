"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Collapsible } from "@/components/ui/collapsible"

interface ChallengeSectionProps {
  challenge: { title?: string; description?: string } | null
  onChallengeChange: (value: { title?: string; description?: string } | null) => void
  isOpen: boolean
  onToggle: () => void
  sectionRef: (el: HTMLDivElement | null) => void
}

export function ChallengeSection({
  challenge,
  onChallengeChange,
  isOpen,
  onToggle,
  sectionRef,
}: ChallengeSectionProps) {
  if (!challenge) return null

  return (
    <div ref={sectionRef}>
      <Collapsible
        title="Challenge Section"
        isOpen={isOpen}
        onToggle={onToggle}
        className="mb-4"
      >
        <div className="space-y-3 my-2">
          <Input
            value={challenge.title || ""}
            onChange={(e) => onChallengeChange({ ...challenge, title: e.target.value })}
            placeholder="Section Title (e.g., The Challenge)"
          />
          <Textarea
            value={challenge.description || ""}
            onChange={(e) => onChallengeChange({ ...challenge, description: e.target.value })}
            placeholder="Describe the challenge..."
            rows={3}
          />
        </div>
      </Collapsible>
    </div>
  )
}

