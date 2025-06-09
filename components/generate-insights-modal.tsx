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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface GenerateInsightsModalProps {
  isOpen: boolean
  onClose: () => void
  onGenerate: (prompt: string, promptFlow: string, files: File[]) => void
}

export function GenerateInsightsModal({ isOpen, onClose, onGenerate }: GenerateInsightsModalProps) {
  const [prompt, setPrompt] = useState("")
  const [response, setResponse] = useState("")
  const [promptFlow, setPromptFlow] = useState("none")
  const [files, setFiles] = useState<File[]>([])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    setFiles(prev => [...prev, ...selectedFiles])
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleGenerate = () => {
    onGenerate(prompt, promptFlow, files)
    onClose()
  }

  const handleClose = () => {
    setPrompt("")
    setResponse("")
    setPromptFlow("none")
    setFiles([])
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Generate Insights
          </DialogTitle>
          <DialogDescription>
            Add prompts and attach documents to generate insights for this strategic program.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium mb-2">
              Prompt
            </label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt..."
              className="min-h-[120px]"
            />
          </div>

          <div>
            <label htmlFor="response" className="block text-sm font-medium mb-2">
              Response
            </label>
            <Textarea
              id="response"
              value={response}
              readOnly
              placeholder="Generated response will appear here..."
              className="min-h-[120px] bg-gray-50 cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            </div>

            <div>
              <label htmlFor="prompt-flow" className="block text-sm font-medium mb-2">
                Pre-made Prompt Flows
              </label>
              <Select value={promptFlow} onValueChange={setPromptFlow}>
                <SelectTrigger>
                  <SelectValue placeholder="Select prompt flow" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="similar-projects">Similar Projects</SelectItem>
                  <SelectItem value="learnings-best-practices">Learnings/Best Practices</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
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

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Generate Insight
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}