"use client"

import { useState } from "react"
import { ChevronRight, Plus, X, Menu, FileText, Image, Tag, Settings, Users, TrendingUp, User, AlertCircle, Lightbulb, MessageSquare, DollarSign, List, Workflow, HelpCircle, Phone } from "lucide-react"
import { Section } from "../types"
import { sectionExists } from "../utils"

interface EditorSidebarProps {
  sections: Section[]
  state: any
  loading: boolean
  onSectionClick: (sectionId: string) => void
  onSectionToggle: (sectionId: string, sectionLabel: string) => void
}

// Icon mapping for sections
const sectionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'basic': FileText,
  'content': FileText,
  'image': Image,
  'client': Users,
  'results': TrendingUp,
  'aboutClient': User,
  'challenge': AlertCircle,
  'solution': Lightbulb,
  'testimonial': MessageSquare,
  'pricing': DollarSign,
  'features': List,
  'process': Workflow,
  'faq': HelpCircle,
  'cta': Phone,
}

export function EditorSidebar({
  sections,
  state,
  loading,
  onSectionClick,
  onSectionToggle,
}: EditorSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (loading) return null

  const IconComponent = Menu

  return (
    <div className={`${isExpanded ? 'w-64' : 'w-16'} flex-shrink-0 border-r bg-muted/30 transition-all duration-300 sticky top-0 h-fit max-h-screen overflow-y-auto`}>
      <div className={`${isExpanded ? 'p-4' : 'p-2'} space-y-2`}>
        {/* Toggle button */}
        <div className={`flex items-center border-b pb-4 ${isExpanded ? 'justify-between' : 'justify-center'}`}>
          {isExpanded && (
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Sections</h3>
          )}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            <IconComponent className="h-5 w-5" />
          </button>
        </div>

        {sections.map((section) => {
          const exists = sectionExists(section.id, state)
          const SectionIcon = sectionIcons[section.id] || FileText

          return (
            <div
              key={section.id}
              className={`flex items-center gap-2 group ${!isExpanded ? 'justify-center' : ''}`}
            >
              <button
                type="button"
                onClick={() => onSectionClick(section.id)}
                className={`${isExpanded ? 'flex-1' : 'w-full justify-center'} text-left px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors flex items-center ${isExpanded ? 'justify-between' : 'justify-center'}`}
                title={!isExpanded ? section.label : undefined}
              >
                <div className="flex items-center gap-2">
                  <SectionIcon className="h-4 w-4 flex-shrink-0" />
                  {isExpanded && <span>{section.label}</span>}
                </div>
                {isExpanded && (
                  <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
              {isExpanded && section.optional && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSectionToggle(section.id, section.label)
                  }}
                  className="p-1.5 rounded-md hover:bg-muted transition-colors flex-shrink-0"
                  title={exists ? "Remove section" : "Add section"}
                >
                  {exists ? (
                    <X className="h-4 w-4 text-destructive" />
                  ) : (
                    <Plus className="h-4 w-4 text-primary" />
                  )}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

