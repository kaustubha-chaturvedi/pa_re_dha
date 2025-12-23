"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Collapsible } from "@/components/ui/collapsible"

interface SolutionSectionProps {
  solution: { title?: string; description?: string; features?: Array<{ title?: string; description?: string }> } | null
  onSolutionChange: (value: { title?: string; description?: string; features?: Array<{ title?: string; description?: string }> } | null) => void
  isOpen: boolean
  onToggle: () => void
  sectionRef: (el: HTMLDivElement | null) => void
}

export function SolutionSection({
  solution,
  onSolutionChange,
  isOpen,
  onToggle,
  sectionRef,
}: SolutionSectionProps) {
  if (!solution) return null

  return (
    <div ref={sectionRef}>
      <Collapsible
        title="Solution Section"
        isOpen={isOpen}
        onToggle={onToggle}
        className="mb-4"
      >
        <div className="space-y-3 my-2">
          <Input
            value={solution.title || ""}
            onChange={(e) => onSolutionChange({ ...solution, title: e.target.value })}
            placeholder="Section Title (e.g., Solution)"
          />
          <Textarea
            value={solution.description || ""}
            onChange={(e) => onSolutionChange({ ...solution, description: e.target.value })}
            placeholder="Describe the solution..."
            rows={3}
          />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Solution Features</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onSolutionChange({ ...solution, features: [...(solution.features || []), { title: "", description: "" }] })}
              >
                + Add Feature
              </Button>
            </div>
            {solution.features && solution.features.length > 0 && (
              <div className="space-y-2">
                {solution.features.map((feature: any, index: number) => (
                  <div key={index} className="p-3 border rounded-md space-y-2">
                    <Input
                      value={feature.title || ""}
                      onChange={(e) => {
                        const newFeatures = [...(solution.features || [])]
                        newFeatures[index] = { ...feature, title: e.target.value }
                        onSolutionChange({ ...solution, features: newFeatures })
                      }}
                      placeholder="Feature title"
                    />
                    <Textarea
                      value={feature.description || ""}
                      onChange={(e) => {
                        const newFeatures = [...(solution.features || [])]
                        newFeatures[index] = { ...feature, description: e.target.value }
                        onSolutionChange({ ...solution, features: newFeatures })
                      }}
                      placeholder="Feature description"
                      rows={2}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newFeatures = [...(solution.features || [])]
                        newFeatures.splice(index, 1)
                        onSolutionChange({ ...solution, features: newFeatures })
                      }}
                    >
                      Remove
                    </Button>
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

