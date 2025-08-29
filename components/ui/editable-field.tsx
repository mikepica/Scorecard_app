import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface EditableFieldProps {
  value: string
  onSave: (newValue: string) => Promise<void>
  type?: "text" | "textarea"
  className?: string
  placeholder?: string
}

export function EditableField({
  value,
  onSave,
  type = "text",
  className,
  placeholder,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [isSaving, setIsSaving] = useState(false)
  const [previousValue, setPreviousValue] = useState(value)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setEditValue(value)
  }, [value])


  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    try {
      setPreviousValue(value) // Store the previous value before saving
      await onSave(editValue)
      setIsEditing(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleUndo = async () => {
    if (previousValue !== value) {
      setIsSaving(true)
      try {
        await onSave(previousValue)
      } finally {
        setIsSaving(false)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === "Escape") {
      setIsEditing(false)
      setEditValue(value)
    } else if (e.key === "z" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleUndo()
    }
  }

  if (isEditing) {
    const InputComponent = type === "textarea" ? Textarea : Input
    return (
      <div ref={containerRef} className={cn("relative", className)}>
        <InputComponent
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          disabled={isSaving}
          placeholder={placeholder}
          className="w-full"
          autoFocus
        />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div
        ref={containerRef}
        className={cn(
          "cursor-pointer hover:bg-gray-50 rounded px-2 py-1 flex-1",
          className
        )}
      >
{value ? (
          <span>{value}</span>
        ) : (
          <span className="text-gray-400 italic">{placeholder}</span>
        )}
      </div>
      {previousValue !== value && (
        <button
          onClick={handleUndo}
          disabled={isSaving}
          className="text-xs text-blue-600 hover:text-blue-800 px-1 py-0.5 rounded border border-blue-300 hover:border-blue-500 disabled:opacity-50"
          title="Undo last change (Ctrl+Z)"
        >
          ↶
        </button>
      )}
    </div>
  )
} 