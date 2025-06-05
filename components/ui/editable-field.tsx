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
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      if (containerRef.current?.contains(e.target as Node)) {
        e.preventDefault()
        setIsEditing(true)
      }
    }

    document.addEventListener("contextmenu", handleContextMenu)
    return () => document.removeEventListener("contextmenu", handleContextMenu)
  }, [])

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    try {
      await onSave(editValue)
      setIsEditing(false)
    } catch (error) {
      console.error("Failed to save:", error)
      // Optionally show error toast here
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === "Escape") {
      setIsEditing(false)
      setEditValue(value)
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
    <div
      ref={containerRef}
      className={cn(
        "cursor-pointer hover:bg-gray-50 rounded px-2 py-1",
        className
      )}
    >
      {value || placeholder}
    </div>
  )
} 