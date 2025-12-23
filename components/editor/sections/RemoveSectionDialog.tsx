"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface RemoveSectionDialogProps {
  open: boolean
  sectionLabel: string
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function RemoveSectionDialog({
  open,
  sectionLabel,
  onOpenChange,
  onConfirm,
}: RemoveSectionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove Section?</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove the "{sectionLabel}" section? This will delete all content in this section. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
          >
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

