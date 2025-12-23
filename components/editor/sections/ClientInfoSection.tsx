"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ImageInput } from "@/components/ui/image-input"
import { Collapsible } from "@/components/ui/collapsible"

interface ClientInfoSectionProps {
  client: string
  clientLogo: string
  onClientChange: (value: string) => void
  onClientLogoChange: (value: string) => void
  isOpen: boolean
  onToggle: () => void
  sectionRef: (el: HTMLDivElement | null) => void
}

export function ClientInfoSection({
  client,
  clientLogo,
  onClientChange,
  onClientLogoChange,
  isOpen,
  onToggle,
  sectionRef,
}: ClientInfoSectionProps) {
  return (
    <div ref={sectionRef}>
      <Collapsible
        title="Client Information"
        isOpen={isOpen}
        onToggle={onToggle}
        className="mb-4"
      >
        <div className="space-y-4 my-2">
          <div className="space-y-2">
            <Label htmlFor="client">Client Name (optional)</Label>
            <Input
              id="client"
              value={client}
              onChange={(e) => onClientChange(e.target.value)}
              placeholder="Client Company Name"
            />
          </div>
          <ImageInput
            id="clientLogo"
            label="Client Logo URL (optional)"
            value={clientLogo}
            onChange={onClientLogoChange}
            placeholder="https://example.com/logo.png"
            description="Client company logo. Click 'Browse' to select from media library or upload a new image."
          />
        </div>
      </Collapsible>
    </div>
  )
}

