"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Collapsible } from "@/components/ui/collapsible"

interface CTASectionProps {
  cta: { title?: string; description?: string; primaryButton?: { text?: string; link?: string }; secondaryButton?: { text?: string; link?: string } } | null
  onCtaChange: (value: { title?: string; description?: string; primaryButton?: { text?: string; link?: string }; secondaryButton?: { text?: string; link?: string } } | null) => void
  isOpen: boolean
  onToggle: () => void
  sectionRef: (el: HTMLDivElement | null) => void
}

export function CTASection({
  cta,
  onCtaChange,
  isOpen,
  onToggle,
  sectionRef,
}: CTASectionProps) {
  if (!cta) return null

  return (
    <div ref={sectionRef}>
      <Collapsible
        title="CTA Section"
        isOpen={isOpen}
        onToggle={onToggle}
        className="mb-4"
      >
        <div className="space-y-4 my-2">
          <div className="space-y-2">
            <Label htmlFor="cta-title">CTA Title</Label>
            <Input
              id="cta-title"
              value={cta.title || ""}
              onChange={(e) => onCtaChange({ ...cta, title: e.target.value })}
              placeholder="Ready to Get Started?"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cta-description">CTA Description</Label>
            <Textarea
              id="cta-description"
              value={cta.description || ""}
              onChange={(e) => onCtaChange({ ...cta, description: e.target.value })}
              placeholder="Let's discuss how we can help..."
              rows={2}
            />
          </div>
          <div className="space-y-3">
            <Label>Primary Button</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={cta.primaryButton?.text || ""}
                onChange={(e) => onCtaChange({ ...cta, primaryButton: { ...cta.primaryButton, text: e.target.value } })}
                placeholder="Button text"
              />
              <Input
                value={cta.primaryButton?.link || ""}
                onChange={(e) => onCtaChange({ ...cta, primaryButton: { ...cta.primaryButton, link: e.target.value } })}
                placeholder="/contact"
              />
            </div>
          </div>
          <div className="space-y-3">
            <Label>Secondary Button (optional)</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={cta.secondaryButton?.text || ""}
                onChange={(e) => onCtaChange({ ...cta, secondaryButton: { ...cta.secondaryButton, text: e.target.value } })}
                placeholder="Button text"
              />
              <Input
                value={cta.secondaryButton?.link || ""}
                onChange={(e) => onCtaChange({ ...cta, secondaryButton: { ...cta.secondaryButton, link: e.target.value } })}
                placeholder="/blog"
              />
            </div>
          </div>
        </div>
      </Collapsible>
    </div>
  )
}

