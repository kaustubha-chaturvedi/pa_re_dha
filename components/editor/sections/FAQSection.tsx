"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Collapsible } from "@/components/ui/collapsible"

interface FAQSectionProps {
  faq: { title?: string; description?: string; items?: Array<{ question?: string; answer?: string }> } | null
  onFaqChange: (value: { title?: string; description?: string; items?: Array<{ question?: string; answer?: string }> } | null) => void
  isOpen: boolean
  onToggle: () => void
  sectionRef: (el: HTMLDivElement | null) => void
}

export function FAQSection({
  faq,
  onFaqChange,
  isOpen,
  onToggle,
  sectionRef,
}: FAQSectionProps) {
  if (!faq) return null

  return (
    <div ref={sectionRef}>
      <Collapsible
        title="FAQ Section"
        isOpen={isOpen}
        onToggle={onToggle}
        className="mb-4"
      >
        <div className="space-y-4 my-2">
          <div className="space-y-2">
            <Label htmlFor="faq-title">FAQ Title</Label>
            <Input
              id="faq-title"
              value={faq.title || ""}
              onChange={(e) => onFaqChange({ ...faq, title: e.target.value })}
              placeholder="Frequently Asked Questions"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="faq-description">FAQ Description</Label>
            <Textarea
              id="faq-description"
              value={faq.description || ""}
              onChange={(e) => onFaqChange({ ...faq, description: e.target.value })}
              placeholder="Find quick answers to common questions..."
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>FAQ Items</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onFaqChange({ ...faq, items: [...(faq.items || []), { question: "", answer: "" }] })}
              >
                + Add Question
              </Button>
            </div>
            {faq.items && faq.items.length > 0 && (
              <div className="space-y-3">
                {faq.items.map((item: any, index: number) => (
                  <div key={index} className="p-3 border rounded-md space-y-2">
                    <div className="space-y-1">
                      <Label>Question {index + 1}</Label>
                      <Input
                        value={item.question || ""}
                        onChange={(e) => {
                          const newItems = [...(faq.items || [])]
                          newItems[index] = { ...item, question: e.target.value }
                          onFaqChange({ ...faq, items: newItems })
                        }}
                        placeholder="What is...?"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Answer {index + 1}</Label>
                      <Textarea
                        value={item.answer || ""}
                        onChange={(e) => {
                          const newItems = [...(faq.items || [])]
                          newItems[index] = { ...item, answer: e.target.value }
                          onFaqChange({ ...faq, items: newItems })
                        }}
                        placeholder="The answer is..."
                        rows={2}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newItems = [...(faq.items || [])]
                        newItems.splice(index, 1)
                        onFaqChange({ ...faq, items: newItems })
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

