"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Collapsible } from "@/components/ui/collapsible"
import { Trash2Icon } from "lucide-react"

interface FeaturesSectionProps {
  features: { title?: string; description?: string; items?: Array<{ title?: string; description?: string }> } | null
  onFeaturesChange: (value: { title?: string; description?: string; items?: Array<{ title?: string; description?: string }> } | null) => void
  isOpen: boolean
  onToggle: () => void
  sectionRef: (el: HTMLDivElement | null) => void
}

export function FeaturesSection({
  features,
  onFeaturesChange,
  isOpen,
  onToggle,
  sectionRef,
}: FeaturesSectionProps) {
  if (!features) return null

  return (
    <div ref={sectionRef}>
      <Collapsible
        title="Features Section"
        isOpen={isOpen}
        onToggle={onToggle}
        className="mb-4"
      >
        <div className="space-y-3 my-2">
          <Input
            value={features.title || ""}
            onChange={(e) => onFeaturesChange({ ...features, title: e.target.value })}
            placeholder="Section Title (e.g., What's Included)"
          />
          <Textarea
            value={features.description || ""}
            onChange={(e) => onFeaturesChange({ ...features, description: e.target.value })}
            placeholder="Section description..."
            rows={2}
          />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Feature Items</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onFeaturesChange({ ...features, items: [...(features.items || []), { title: "", description: "" }] })}
              >
                + Add Feature
              </Button>
            </div>
            {features.items && features.items.length > 0 && (
              <div className="space-y-2">
                {features.items.map((item: any, index: number) => (
                  <div key={index} className="p-3 border rounded-md space-y-2">
                    <div className="flex items-center gap-2 w-full">
                      <Input 
                      value={index + 1} 
                      onChange={(e) => {
                        const newItems = [...(features.items || [])]
                        newItems[index] = { ...item, number: parseInt(e.target.value) || index + 1 }
                        onFeaturesChange({ ...features, items: newItems })
                      }}
                      disabled
                      className="w-20" 
                      />
                      <Input
                        value={item.title || ""}
                        onChange={(e) => {
                          const newItems = [...(features.items || [])]
                          newItems[index] = { ...item, title: e.target.value }
                          onFeaturesChange({ ...features, items: newItems })
                        }}
                        placeholder="Feature title"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="ml-auto text-destructive hover:text-destructive"
                        onClick={() => {
                          const newItems = [...(features.items || [])]
                          newItems.splice(index, 1)
                          onFeaturesChange({ ...features, items: newItems })
                        }}
                      >
                        <Trash2Icon className="w-4 h-4" />
                      </Button>
                    </div>
                    <Textarea
                      value={item.description || ""}
                      onChange={(e) => {
                        const newItems = [...(features.items || [])]
                        newItems[index] = { ...item, description: e.target.value }
                        onFeaturesChange({ ...features, items: newItems })
                      }}
                      placeholder="Feature description"
                      rows={2}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Collapsible>
    </div>
  )
}

