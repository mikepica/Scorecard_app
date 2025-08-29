"use client"

import { useState, useEffect } from "react"
import { Bot, Upload, Loader2, RefreshCw, Pencil } from "lucide-react"
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
import type { QuarterInfo } from "@/lib/quarter-utils"

interface GenerateUpdateModalProps {
  isOpen: boolean
  onClose: () => void
  initialContent: string
  quarterInfo: QuarterInfo
  onGenerate: (content: string, instructions: string, files: File[]) => Promise<string>
  onApply: (content: string) => void
}

export function GenerateUpdateModal({ isOpen, onClose, initialContent, quarterInfo, onGenerate, onApply }: GenerateUpdateModalProps) {
  const [content, setContent] = useState(initialContent)
  const [originalContent, setOriginalContent] = useState(initialContent)
  const [instructions, setInstructions] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setContent(initialContent)
      setOriginalContent(initialContent)
      setInstructions("")
      setFiles([])
      setIsGenerating(false)
      setHasGenerated(false)
    }
  }, [isOpen, initialContent])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    setFiles(prev => [...prev, ...selectedFiles])
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const generatedContent = await onGenerate(content, instructions, files)
      setContent(generatedContent)
      setHasGenerated(true)
    } catch (error) {
      console.error('Error generating content:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRegenerate = () => {
    setHasGenerated(false)
    setContent(originalContent)
  }

  const handleApply = () => {
    onApply(content)
    onClose()
  }

  const handleClose = () => {
    setContent(initialContent)
    setOriginalContent(initialContent)
    setInstructions("")
    setFiles([])
    setIsGenerating(false)
    setHasGenerated(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Enter Progress Update
          </DialogTitle>
          <DialogDescription>
            Add in Progress update manually or use AI to draft it
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label htmlFor="content" className="block text-sm font-medium mb-2">
              Enter or Edit {quarterInfo.label} Progress update {hasGenerated && <span className="text-green-600">(Generated)</span>}
            </label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter update content..."
              className={`min-h-[120px] ${hasGenerated ? 'border-green-300 bg-green-50' : ''}`}
              disabled={isGenerating}
            />
            <Button 
              onClick={handleApply}
              className="mt-2"
              disabled={isGenerating || !content.trim()}
            >
              Save Update
            </Button>
          </div>

          {/* Visual line separator */}
          <hr className="border-gray-300" />

          {!hasGenerated && (
            <>
              <div>
                <label htmlFor="instructions" className="block text-sm font-medium mb-2">
                  Generate Update with AI
                </label>
                <p className="text-sm text-gray-600 mb-2">
                  Write your prompt in the box and/or upload documentation for the AI to produce your update. The update will then be drafted in the above box to be saved.
                </p>
                <Textarea
                  id="instructions"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Enter instructions for generating the update..."
                  className="min-h-[120px]"
                  disabled={isGenerating}
                />
              </div>

              <div>
                <label htmlFor="file-upload" className="block text-sm font-medium mb-2">
                  Attach Documents
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="flex items-center gap-2"
                    disabled={isGenerating}
                  >
                    <Upload className="h-4 w-4" />
                    Choose Files
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    accept=".ppt,.pptx,.doc,.docx,.pdf,.txt,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm text-gray-600">Attached files:</p>
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm truncate">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="text-red-600 hover:text-red-800"
                          disabled={isGenerating}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            {hasGenerated && (
              <Button variant="outline" onClick={handleRegenerate} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Regenerate
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            {!hasGenerated ? (
              <Button 
                onClick={handleGenerate} 
                className="flex items-center gap-2"
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Bot className="h-4 w-4" />
                    Generate Update
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={handleApply} className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                Apply Update
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}