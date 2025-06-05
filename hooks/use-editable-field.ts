import { useState, useCallback } from 'react'
import type { ScoreCardData } from '@/types/scorecard'

interface UseEditableFieldProps {
  fieldPath: string[]
  onDataUpdate: (newData: ScoreCardData) => void
}

export function useEditableField({ fieldPath, onDataUpdate }: UseEditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false)

  const handleSave = useCallback(async (newValue: string) => {
    try {
      const response = await fetch('/api/scorecard/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fieldPath,
          newValue,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update field')
      }

      const updatedData = await response.json()
      onDataUpdate(updatedData)
    } catch (error) {
      console.error('Error updating field:', error)
      throw error
    }
  }, [fieldPath, onDataUpdate])

  return {
    isEditing,
    setIsEditing,
    handleSave,
  }
} 