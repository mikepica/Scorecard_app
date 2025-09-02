"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { X, ChevronDown, ChevronUp } from 'lucide-react'
import type { StrategicProgram } from '@/types/scorecard'
import { StatusCircle } from '@/components/status-circle'
import { EditableField } from '@/components/ui/editable-field'
import { getCurrentQuarter, getPreviousQuarter, getAvailableQuarters, parseQuarterColumnName } from '@/lib/quarter-utils'
import type { QuarterInfo } from '@/lib/quarter-utils'

interface ProgramDetailsSidebarProps {
  program: StrategicProgram & {
    goalText?: string
    categoryName?: string
    pillarName?: string
  } | null
  isOpen: boolean
  onClose: () => void
  onUpdate: (programId: string, updates: any) => void
}

export const ProgramDetailsSidebar: React.FC<ProgramDetailsSidebarProps> = ({
  program,
  isOpen,
  onClose,
  onUpdate
}) => {
  const [selectedComparisonQuarter, setSelectedComparisonQuarter] = useState<QuarterInfo>(getPreviousQuarter())
  const [isComparisonDropdownOpen, setIsComparisonDropdownOpen] = useState(false)
  
  // State for starting quarter selection - defaults to Q1-2025, persisted in localStorage
  const [startingQuarter, setStartingQuarter] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('scorecard-starting-quarter')
      return saved || 'q1_2025'
    }
    return 'q1_2025'
  })
  const [isQuarterlyDropdownOpen, setIsQuarterlyDropdownOpen] = useState(false)
  
  const currentQuarter = getCurrentQuarter()
  const availableQuarters = getAvailableQuarters()
  
  // Filter out current quarter for comparison dropdown
  const comparisonQuarters = availableQuarters.filter(q => q.columnName !== currentQuarter.columnName)

  // Calculate 4 consecutive quarters starting from the selected quarter
  const displayQuarters = useMemo(() => {
    const allQuarters = getAvailableQuarters()
    const startIndex = allQuarters.findIndex(q => q.columnName.replace('_progress', '') === startingQuarter)
    
    if (startIndex === -1) return allQuarters.slice(0, 4) // fallback to first 4
    
    // Get 4 consecutive quarters starting from selected quarter
    const result = []
    for (let i = 0; i < 4; i++) {
      const quarterIndex = startIndex + i
      if (quarterIndex < allQuarters.length) {
        result.push(allQuarters[quarterIndex])
      }
    }
    
    return result
  }, [startingQuarter])

  // Generate dropdown options for starting quarters
  // Only include quarters where we can show 4 consecutive quarters
  const startingQuarterOptions = useMemo(() => {
    const allQuarters = getAvailableQuarters()
    const validStartingQuarters = []
    
    for (let i = 0; i <= allQuarters.length - 4; i++) {
      const quarter = allQuarters[i]
      validStartingQuarters.push({
        value: quarter.columnName.replace('_progress', ''),
        label: quarter.label
      })
    }
    
    return validStartingQuarters
  }, [])

  // Handle starting quarter change with localStorage persistence
  const handleStartingQuarterChange = (newStartingQuarter: string) => {
    setStartingQuarter(newStartingQuarter)
    if (typeof window !== 'undefined') {
      localStorage.setItem('scorecard-starting-quarter', newStartingQuarter)
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.comparison-dropdown') && !target.closest('.quarterly-dropdown')) {
        setIsComparisonDropdownOpen(false)
        setIsQuarterlyDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle status update
  const handleStatusUpdate = async (quarter: string, newStatus: string | null) => {
    if (!program) return
    
    try {
      const response = await fetch('/api/scorecard/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldPath: [program.strategicPillarId, program.categoryId, program.strategicGoalId, program.id],
          newValue: newStatus,
          type: 'program',
          quarter,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update status')
      }
      
      const updatedData = await response.json()
      onUpdate(program.id, updatedData)
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  // Handle progress update
  const handleProgressUpdate = async (quarterColumn: string, newProgress: string) => {
    if (!program) return
    
    try {
      const response = await fetch('/api/scorecard/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldPath: [program.strategicPillarId, program.categoryId, program.strategicGoalId, program.id],
          newValue: newProgress,
          type: 'program-quarter-progress',
          quarter: quarterColumn,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update progress')
      }
      
      const updatedData = await response.json()
      onUpdate(program.id, updatedData)
    } catch (error) {
      console.error('Error updating progress:', error)
    }
  }

  // Handle objective update
  const handleObjectiveUpdate = async (quarter: string, newObjective: string) => {
    if (!program) return
    
    try {
      const response = await fetch('/api/scorecard/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldPath: [program.strategicPillarId, program.categoryId, program.strategicGoalId, program.id],
          newValue: newObjective,
          type: 'program-objective',
          quarter,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update objective')
      }
      
      const updatedData = await response.json()
      onUpdate(program.id, updatedData)
    } catch (error) {
      console.error('Error updating objective:', error)
    }
  }

  if (!isOpen || !program) return null

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" 
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } w-full lg:w-160 xl:w-192 md:w-128 sm:w-4/5 overflow-y-auto`} style={{
        width: isOpen ? (window.innerWidth >= 1024 ? '640px' : window.innerWidth >= 768 ? '512px' : '80%') : '0'
      }}>
        
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800 truncate">Program Details</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Program Title */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-medium text-gray-800 text-sm leading-tight">
            {program.text}
          </h3>
          <div className="mt-2 text-xs text-gray-600 space-y-1">
            {program.pillarName && <div><strong>Pillar:</strong> {program.pillarName}</div>}
            {program.categoryName && <div><strong>Category:</strong> {program.categoryName}</div>}
            {program.goalText && <div><strong>Goal:</strong> {program.goalText}</div>}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          
          {/* Previous Progress Update Section */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-800">Previous Progress Update</h4>
              <div className="comparison-dropdown relative">
                <button
                  onClick={() => setIsComparisonDropdownOpen(!isComparisonDropdownOpen)}
                  className="flex items-center gap-1 px-2 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  {selectedComparisonQuarter.label}
                  {isComparisonDropdownOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                
                {isComparisonDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-300 rounded shadow-lg z-10 min-w-[120px]">
                    {comparisonQuarters.map((quarter) => (
                      <button
                        key={quarter.columnName}
                        onClick={() => {
                          setSelectedComparisonQuarter(quarter)
                          setIsComparisonDropdownOpen(false)
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 first:rounded-t last:rounded-b"
                      >
                        {quarter.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <EditableField
              value={(program as any)[selectedComparisonQuarter.columnName] || ""}
              onSave={(newProgress) => handleProgressUpdate(selectedComparisonQuarter.columnName, newProgress)}
              className="text-sm"
              placeholder={`Enter ${selectedComparisonQuarter.label} progress...`}
            />
          </div>

          {/* Current Progress Update Section */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-3">Current Progress Update ({currentQuarter.label})</h4>
            <EditableField
              value={(program as any)[currentQuarter.columnName] || ""}
              onSave={(newProgress) => handleProgressUpdate(currentQuarter.columnName, newProgress)}
              className="text-sm"
              placeholder={`Enter ${currentQuarter.label} progress...`}
            />
          </div>

          {/* Quarterly Objectives Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-800">Quarterly Objectives</h4>
              <div className="quarterly-dropdown relative">
                <button
                  onClick={() => setIsQuarterlyDropdownOpen(!isQuarterlyDropdownOpen)}
                  className="flex items-center gap-1 px-2 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  {startingQuarterOptions.find(q => q.value === startingQuarter)?.label || 'Q1 2025'}
                  {isQuarterlyDropdownOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                
                {isQuarterlyDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-300 rounded shadow-lg z-10 min-w-[120px]">
                    <div className="px-3 py-2 text-xs text-gray-600 border-b">Starting Quarter</div>
                    {startingQuarterOptions.map((quarter) => (
                      <button
                        key={quarter.value}
                        onClick={() => {
                          handleStartingQuarterChange(quarter.value)
                          setIsQuarterlyDropdownOpen(false)
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 last:rounded-b"
                      >
                        {quarter.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {displayQuarters.map((quarterInfo) => {
              const quarterKey = quarterInfo.columnName.replace('_progress', '')
              const objectiveField = `${quarterKey}_objective`
              const statusField = `${quarterKey}_status`
              
              return (
                <div key={quarterKey} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-gray-700">{quarterInfo.label}</h5>
                    <StatusCircle
                      status={(program as any)[statusField]}
                      onStatusChange={(newStatus) => handleStatusUpdate(quarterKey, newStatus ?? null)}
                    />
                  </div>
                  <EditableField
                    value={(program as any)[objectiveField] || ""}
                    onSave={(newObjective) => handleObjectiveUpdate(quarterKey, newObjective)}
                    className="text-sm"
                    placeholder={`Enter ${quarterInfo.label} objective...`}
                  />
                </div>
              )
            })}
          </div>

        </div>
      </div>
    </>
  )
}