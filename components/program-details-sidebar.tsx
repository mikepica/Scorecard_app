"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { X, ChevronDown, ChevronUp } from 'lucide-react'
import type { StrategicProgram, ScoreCardData } from '@/types/scorecard'
import { StatusCircle } from '@/components/status-circle'
import { EditableField } from '@/components/ui/editable-field'
import { getCurrentQuarter, getPreviousQuarter, getAvailableQuarters } from '@/lib/quarter-utils'
import type { QuarterInfo } from '@/lib/quarter-utils'

interface ProgramDetailsSidebarProps {
  program: StrategicProgram & {
    goalText?: string
    categoryName?: string
    pillarName?: string
  } | null
  isOpen: boolean
  onClose: () => void
  onUpdate: (programId: string, updates: ScoreCardData) => void
  isFunctionalView?: boolean
  availablePrograms?: Array<StrategicProgram & {
    goalText?: string
    categoryName?: string
    pillarName?: string
  }>
  onProgramSelect?: (program: StrategicProgram & {
    goalText?: string
    categoryName?: string
    pillarName?: string
  }) => void
}

export const ProgramDetailsSidebar: React.FC<ProgramDetailsSidebarProps> = ({
  program,
  isOpen,
  onClose,
  onUpdate,
  isFunctionalView = false,
  availablePrograms = [],
  onProgramSelect
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
  
  // State for program dropdown
  const [isProgramDropdownOpen, setIsProgramDropdownOpen] = useState(false)
  
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
      if (!target.closest('.comparison-dropdown') && !target.closest('.quarterly-dropdown') && !target.closest('.program-dropdown')) {
        setIsComparisonDropdownOpen(false)
        setIsQuarterlyDropdownOpen(false)
        setIsProgramDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle status update
  const handleStatusUpdate = async (quarter: string, newStatus: string | null) => {
    if (!program) return
    
    try {
      const apiEndpoint = isFunctionalView ? '/api/functional-scorecard/update' : '/api/scorecard/update'
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldPath: [program.strategicPillarId, program.categoryId, program.strategicGoalId, program.id],
          newValue: newStatus,
          type: isFunctionalView ? 'functional-program' : 'program',
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
      const apiEndpoint = isFunctionalView ? '/api/functional-scorecard/update' : '/api/scorecard/update'
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldPath: [program.strategicPillarId, program.categoryId, program.strategicGoalId, program.id],
          newValue: newProgress,
          type: isFunctionalView ? 'functional-program-quarter-progress' : 'program-quarter-progress',
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
      const apiEndpoint = isFunctionalView ? '/api/functional-scorecard/update' : '/api/scorecard/update'
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldPath: [program.strategicPillarId, program.categoryId, program.strategicGoalId, program.id],
          newValue: newObjective,
          type: isFunctionalView ? 'functional-program-objective' : 'program-objective',
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

  // Auto-select first program if none selected but sidebar is open
  React.useEffect(() => {
    if (isOpen && !program && availablePrograms.length > 0 && onProgramSelect) {
      onProgramSelect(availablePrograms[0])
    }
  }, [isOpen, program, availablePrograms, onProgramSelect])

  if (!isOpen) return null

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
          {program ? (
            <>
              <h3 className="font-medium text-gray-800 text-sm leading-tight">
                {program.text}
              </h3>
              <div className="mt-2 text-xs text-gray-600 space-y-1">
                {program.pillarName && <div><strong>Pillar:</strong> {program.pillarName}</div>}
                {program.categoryName && <div><strong>Category:</strong> {program.categoryName}</div>}
                {program.goalText && <div><strong>Goal:</strong> {program.goalText}</div>}
              </div>
              
              {/* Strategic Program Dropdown */}
              {availablePrograms.length > 1 && onProgramSelect && (
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Strategic Program:</label>
                  <div className="program-dropdown relative">
                    <button
                      onClick={() => setIsProgramDropdownOpen(!isProgramDropdownOpen)}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                    >
                      <span className="truncate">{program.text}</span>
                      {isProgramDropdownOpen ? <ChevronUp size={14} className="flex-shrink-0" /> : <ChevronDown size={14} className="flex-shrink-0" />}
                    </button>
                    
                    {isProgramDropdownOpen && (
                      <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-300 rounded shadow-lg z-10 max-h-60 overflow-y-auto">
                        {availablePrograms.map((availableProgram) => (
                          <button
                            key={availableProgram.id}
                            onClick={() => {
                              onProgramSelect(availableProgram)
                              setIsProgramDropdownOpen(false)
                            }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 first:rounded-t last:rounded-b ${
                              availableProgram.id === program.id ? 'bg-blue-50 text-blue-700 font-medium' : ''
                            }`}
                          >
                            <div className="truncate">{availableProgram.text}</div>
                            {availableProgram.goalText && (
                              <div className="text-xs text-gray-500 truncate">{availableProgram.goalText}</div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <h3 className="font-medium text-gray-600 text-sm mb-2">No Program Selected</h3>
              <p className="text-xs text-gray-500">Loading program...</p>
            </div>
          )}
        </div>

        {/* Content */}
        {program && (
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
              value={program[selectedComparisonQuarter.columnName as keyof StrategicProgram] as string || ""}
              onSave={(newProgress) => handleProgressUpdate(selectedComparisonQuarter.columnName, newProgress)}
              className="text-sm"
              placeholder={`Enter ${selectedComparisonQuarter.label} progress...`}
            />
          </div>

          {/* Current Progress Update Section */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-3">Current Progress Update ({currentQuarter.label})</h4>
            <EditableField
              value={program[currentQuarter.columnName as keyof StrategicProgram] as string || ""}
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
                      status={program[statusField as keyof StrategicProgram] as "exceeded" | "on-track" | "delayed" | "missed" | undefined}
                      onStatusChange={(newStatus) => handleStatusUpdate(quarterKey, newStatus ?? null)}
                    />
                  </div>
                  <EditableField
                    value={program[objectiveField as keyof StrategicProgram] as string || ""}
                    onSave={(newObjective) => handleObjectiveUpdate(quarterKey, newObjective)}
                    className="text-sm"
                    placeholder={`Enter ${quarterInfo.label} objective...`}
                  />
                </div>
              )
            })}
          </div>

        </div>
        )}
      </div>
    </>
  )
}