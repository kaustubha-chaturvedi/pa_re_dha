"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Collapsible } from "@/components/ui/collapsible"

interface PricingSectionProps {
  pricing: { label?: string; price?: string; description?: string; primaryButton?: { text?: string; link?: string }; secondaryButton?: { text?: string; link?: string } } | null
  onPricingChange: (value: { label?: string; price?: string; description?: string; primaryButton?: { text?: string; link?: string }; secondaryButton?: { text?: string; link?: string } } | null) => void
  isOpen: boolean
  onToggle: () => void
  sectionRef: (el: HTMLDivElement | null) => void
}

export function PricingSection({
  pricing,
  onPricingChange,
  isOpen,
  onToggle,
  sectionRef,
}: PricingSectionProps) {
  if (!pricing) return null

  return (
    <div ref={sectionRef}>
      <Collapsible
        title="Pricing Section"
        isOpen={isOpen}
        onToggle={onToggle}
        className="mb-4"
      >
        <div className="space-y-3 my-2">
          <Input
            value={pricing.label || ""}
            onChange={(e) => onPricingChange({ ...pricing, label: e.target.value })}
            placeholder="Label (e.g., Starting at)"
          />
          <Input
            value={pricing.price || ""}
            onChange={(e) => onPricingChange({ ...pricing, price: e.target.value })}
            placeholder="Price (e.g., $2,500/month)"
          />
          <Textarea
            value={pricing.description || ""}
            onChange={(e) => onPricingChange({ ...pricing, description: e.target.value })}
            placeholder="Optional pricing description..."
            rows={2}
          />
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Primary Button</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={pricing.primaryButton?.text || ""}
                onChange={(e) => onPricingChange({ ...pricing, primaryButton: { ...pricing.primaryButton, text: e.target.value } })}
                placeholder="Button text (e.g., Get Started)"
              />
              <Input
                value={pricing.primaryButton?.link || ""}
                onChange={(e) => onPricingChange({ ...pricing, primaryButton: { ...pricing.primaryButton, link: e.target.value } })}
                placeholder="Button link (e.g., /contact)"
              />
            </div>
          </div>
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Secondary Button</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={pricing.secondaryButton?.text || ""}
                onChange={(e) => onPricingChange({ ...pricing, secondaryButton: { ...pricing.secondaryButton, text: e.target.value } })}
                placeholder="Button text (e.g., Learn More)"
              />
              <Input
                value={pricing.secondaryButton?.link || ""}
                onChange={(e) => onPricingChange({ ...pricing, secondaryButton: { ...pricing.secondaryButton, link: e.target.value } })}
                placeholder="Button link (e.g., #features)"
              />
            </div>
          </div>
        </div>
      </Collapsible>
    </div>
  )
}

