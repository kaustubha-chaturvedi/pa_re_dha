"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface CollapsibleProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  isOpen?: boolean
  onToggle?: () => void
  className?: string
}

export function Collapsible({ 
  title, 
  children, 
  defaultOpen = false, 
  isOpen: controlledIsOpen,
  onToggle,
  className 
}: CollapsibleProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalOpen
  const setIsOpen = onToggle || setInternalOpen

  const handleToggle = () => {
    if (onToggle) {
      onToggle()
    } else {
      setInternalOpen(!internalOpen)
    }
  }

  return (
    <div className={cn("border rounded-lg", className)}>
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <span className="font-semibold text-sm">{title}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform",
            isOpen && "transform rotate-180"
          )}
        />
      </button>
      {isOpen && (
        <div className="p-4 pt-0 border-t">
          {children}
        </div>
      )}
    </div>
  )
}
