"use client"

import { useState } from "react"
import { Bot, Upload } from "lucide-react"
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

interface GenerateUpdateModalProps {
  isOpen: boolean
  onClose: () => void
  initialContent: string
  onGenerate: (content: string, instructions: string, files: File[]) => void
}

export function GenerateUpdateModal({ isOpen, onClose, initialContent, onGenerate }: GenerateUpdateModalProps) {
  const [content, setContent] = useState(initialContent)
  const [instructions, setInstructions] = useState("")
  const [files, setFiles] = useState<File[]>([])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    setFiles(prev => [...prev, ...selectedFiles])
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleGenerate = () => {
    onGenerate(content, instructions, files)
    onClose()
  }

  const handleClose = () => {
    setContent(initialContent)
    setInstructions("")
    setFiles([])
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Generate Update
          </DialogTitle>
          <DialogDescription>
            Add text and attach documents to generate an update for this progress item.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label htmlFor="content" className="block text-sm font-medium mb-2">
              Content
            </label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter update content..."
              className="min-h-[120px]"
            />
          </div>

          <div>
            <label htmlFor="instructions" className="block text-sm font-medium mb-2">
              Instructions
            </label>
            <Textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Enter instructions for generating the update..."
              className="min-h-[120px]"
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
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Generate Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}