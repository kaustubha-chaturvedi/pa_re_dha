"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Collapsible } from "@/components/ui/collapsible"

interface ResultsSectionProps {
  results: Array<{ metric?: string; value?: string; description?: string }>
  onResultsChange: (results: Array<{ metric?: string; value?: string; description?: string }>) => void
  isOpen: boolean
  onToggle: () => void
  sectionRef: (el: HTMLDivElement | null) => void
}

export function ResultsSection({
  results,
  onResultsChange,
  isOpen,
  onToggle,
  sectionRef,
}: ResultsSectionProps) {
  return (
    <div ref={sectionRef}>
      <Collapsible
        title="Results"
        isOpen={isOpen}
        onToggle={onToggle}
        className="mb-4"
      >
        <div className="space-y-2 my-2">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Results (optional)</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onResultsChange([...results, { metric: "", value: "", description: "" }])}
            >
              + Add Result
            </Button>
          </div>
          {results.length > 0 && (
            <div className="space-y-3 pl-4 border-l-2 border-primary/20">
              {results.map((result, index) => (
                <div key={index} className="p-3 border rounded-md space-y-2">
                  <div className="space-y-1">
                    <Label>Metric</Label>
                    <Input
                      value={result.metric || ""}
                      onChange={(e) => {
                        const newResults = [...results]
                        newResults[index] = { ...result, metric: e.target.value }
                        onResultsChange(newResults)
                      }}
                      placeholder="e.g., Revenue Increase"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Value</Label>
                    <Input
                      value={result.value || ""}
                      onChange={(e) => {
                        const newResults = [...results]
                        newResults[index] = { ...result, value: e.target.value }
                        onResultsChange(newResults)
                      }}
                      placeholder="e.g., 300%"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Description</Label>
                    <Textarea
                      value={result.description || ""}
                      onChange={(e) => {
                        const newResults = [...results]
                        newResults[index] = { ...result, description: e.target.value }
                        onResultsChange(newResults)
                      }}
                      placeholder="Brief description of the result"
                      rows={2}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newResults = [...results]
                      newResults.splice(index, 1)
                      onResultsChange(newResults)
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Collapsible>
    </div>
  )
}

