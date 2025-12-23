"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Collapsible } from "@/components/ui/collapsible"
import { Trash2Icon } from "lucide-react"

interface ProcessSectionProps {
  process: { title?: string; description?: string; steps?: Array<{ number?: number; title?: string; description?: string }> } | null
  onProcessChange: (value: { title?: string; description?: string; steps?: Array<{ number?: number; title?: string; description?: string }> } | null) => void
  isOpen: boolean
  onToggle: () => void
  sectionRef: (el: HTMLDivElement | null) => void
}

export function ProcessSection({
  process,
  onProcessChange,
  isOpen,
  onToggle,
  sectionRef,
}: ProcessSectionProps) {
  if (!process) return null

  return (
    <div ref={sectionRef}>
      <Collapsible
        title="Process Section"
        isOpen={isOpen}
        onToggle={onToggle}
        className="mb-4"
      >
        <div className="space-y-3 my-2">
          <Input
            value={process.title || ""}
            onChange={(e) => onProcessChange({ ...process, title: e.target.value })}
            placeholder="Section Title (e.g., How It Works)"
          />
          <Textarea
            value={process.description || ""}
            onChange={(e) => onProcessChange({ ...process, description: e.target.value })}
            placeholder="Section description..."
            rows={2}
          />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Process Steps</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onProcessChange({ ...process, steps: [...(process.steps || []), { number: (process.steps?.length || 0) + 1, title: "", description: "" }] })}
              >
                + Add Step
              </Button>
            </div>
            {process.steps && process.steps.length > 0 && (
              <div className="space-y-2">
                {process.steps.map((step: any, index: number) => (
                  <div key={index} className="p-3 border rounded-md space-y-2">
                    <div className="flex items-center gap-2 w-full">
                      <Input
                        value={index + 1}
                        onChange={(e) => {
                          const newSteps = [...(process.steps || [])]
                          newSteps[index] = { ...step, number: parseInt(e.target.value) || index + 1 }
                          onProcessChange({ ...process, steps: newSteps })
                        }}
                        placeholder="Step number"
                        disabled
                        className="w-20"
                      />
                      <Input
                        value={step.title || ""}
                        onChange={(e) => {
                          const newSteps = [...(process.steps || [])]
                          newSteps[index] = { ...step, title: e.target.value }
                          onProcessChange({ ...process, steps: newSteps })
                        }}
                        placeholder="Step title"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="ml-auto text-destructive hover:text-destructive"
                        onClick={() => {
                          const newSteps = [...(process.steps || [])]
                          newSteps.splice(index, 1)
                          onProcessChange({ ...process, steps: newSteps })
                        }}
                      >
                        <Trash2Icon className="w-4 h-4" />
                      </Button>
                    </div>
                    <Textarea
                      value={step.description || ""}
                      onChange={(e) => {
                        const newSteps = [...(process.steps || [])]
                        newSteps[index] = { ...step, description: e.target.value }
                        onProcessChange({ ...process, steps: newSteps })
                      }}
                      placeholder="Step description"
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

