"use client"

import { useState, useEffect } from "react"
import { Bot } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface AIContextModalProps {
  isOpen: boolean
  onClose: () => void
  initialContent: string
  programTitle: string
  onSave: (content: string) => void
}

export function AIContextModal({ isOpen, onClose, initialContent, programTitle, onSave }: AIContextModalProps) {
  const [content, setContent] = useState(initialContent)
  const [isSaving, setIsSaving] = useState(false)

  // Reset content when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setContent(initialContent)
    }
  }, [isOpen, initialContent])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(content)
      onClose()
    } catch (error) {
      console.error('Error saving AI context:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    setContent(initialContent) // Reset to original content
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-purple-600" />
            Edit AI Context
          </DialogTitle>
          <DialogDescription>
            Add AI-specific context and instructions for &ldquo;{programTitle}&rdquo;. This will enhance AI chat conversations and progress update generation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label htmlFor="ai-context" className="block text-sm font-medium mb-2">
              AI Context & Instructions
            </label>
            <Textarea
              id="ai-context"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter AI-specific context, instructions, background information, or specific guidance that will help the AI better understand and work with this strategic program..."
              className="min-h-[200px] resize-none"
              disabled={isSaving}
            />
            <div className="text-sm text-gray-500 mt-1">
              {content.length} characters
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isSaving ? "Saving..." : "Save Context"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}