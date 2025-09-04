"use client"

import React, { useMemo } from 'react'
import { X } from 'lucide-react'
import { Dropdown } from './dropdown'
import type { StrategicProgram } from '@/types/scorecard'

// Special value to represent "All" selection
const ALL_VALUE = "all"

interface FilterModalProps {
  isOpen: boolean
  onClose: () => void
  filters: {
    selectedOrdLtSponsor: string
    selectedSponsorsLead: string
    selectedReportingOwner: string
    selectedGoal: string
  }
  onFiltersChange: {
    setSelectedOrdLtSponsor: (value: string) => void
    setSelectedSponsorsLead: (value: string) => void
    setSelectedReportingOwner: (value: string) => void
    setSelectedGoal: (value: string) => void
  }
  allPrograms: Array<StrategicProgram & { goalText: string; categoryName: string; pillarName: string }>
}

// Utility function to get unique values from all programs for a sponsor field
const getUniqueSponsorValues = (programs: Array<StrategicProgram & { goalText: string; categoryName: string; pillarName: string }>, fieldName: 'ordLtSponsors' | 'sponsorsLeads' | 'reportingOwners'): string[] => {
  const allValues = new Set<string>()
  
  programs.forEach(program => {
    const fieldValue = program[fieldName] || ['(Not Specified)']
    fieldValue.forEach(value => allValues.add(value))
  })
  
  return Array.from(allValues).sort()
}

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  allPrograms
}) => {
  const { selectedOrdLtSponsor, selectedSponsorsLead, selectedReportingOwner, selectedGoal } = filters
  const { setSelectedOrdLtSponsor, setSelectedSponsorsLead, setSelectedReportingOwner, setSelectedGoal } = onFiltersChange

  // ORD LT Sponsor options - all unique values
  const ordLtSponsorOptions = useMemo(() => {
    const uniqueValues = getUniqueSponsorValues(allPrograms, 'ordLtSponsors')
    return [{ value: ALL_VALUE, label: "All" }, ...uniqueValues.map(value => ({ value, label: value }))]
  }, [allPrograms])

  // Sponsors Lead options - filtered by selected ORD LT Sponsor
  const sponsorsLeadOptions = useMemo(() => {
    if (selectedOrdLtSponsor === ALL_VALUE) {
      // If all ORD LT Sponsors selected, show all Sponsors Leads
      const uniqueValues = getUniqueSponsorValues(allPrograms, 'sponsorsLeads')
      return [{ value: ALL_VALUE, label: "All" }, ...uniqueValues.map(value => ({ value, label: value }))]
    } else {
      // Filter programs by selected ORD LT Sponsor and get their Sponsors Leads
      const filteredPrograms = allPrograms.filter(program => {
        const ordLtSponsors = program.ordLtSponsors || ['(Not Specified)']
        return ordLtSponsors.includes(selectedOrdLtSponsor)
      })
      
      const uniqueValues = getUniqueSponsorValues(filteredPrograms, 'sponsorsLeads')
      return [{ value: ALL_VALUE, label: "All" }, ...uniqueValues.map(value => ({ value, label: value }))]
    }
  }, [selectedOrdLtSponsor, allPrograms])

  // Reporting Owner options - filtered by selected Sponsors Lead
  const reportingOwnerOptions = useMemo(() => {
    if (selectedOrdLtSponsor === ALL_VALUE && selectedSponsorsLead === ALL_VALUE) {
      // If all previous filters selected, show all Reporting Owners
      const uniqueValues = getUniqueSponsorValues(allPrograms, 'reportingOwners')
      return [{ value: ALL_VALUE, label: "All" }, ...uniqueValues.map(value => ({ value, label: value }))]
    } else {
      // Filter programs by selected ORD LT Sponsor and Sponsors Lead
      const filteredPrograms = allPrograms.filter(program => {
        const ordLtSponsors = program.ordLtSponsors || ['(Not Specified)']
        const sponsorsLeads = program.sponsorsLeads || ['(Not Specified)']
        
        const ordLtMatch = selectedOrdLtSponsor === ALL_VALUE || ordLtSponsors.includes(selectedOrdLtSponsor)
        const sponsorsLeadMatch = selectedSponsorsLead === ALL_VALUE || sponsorsLeads.includes(selectedSponsorsLead)
        
        return ordLtMatch && sponsorsLeadMatch
      })
      
      const uniqueValues = getUniqueSponsorValues(filteredPrograms, 'reportingOwners')
      return [{ value: ALL_VALUE, label: "All" }, ...uniqueValues.map(value => ({ value, label: value }))]
    }
  }, [selectedOrdLtSponsor, selectedSponsorsLead, allPrograms])

  // Goal options - filtered by all selected sponsors
  const goalOptions = useMemo(() => {
    if (selectedOrdLtSponsor === ALL_VALUE && selectedSponsorsLead === ALL_VALUE && selectedReportingOwner === ALL_VALUE) {
      // If all sponsor filters are "All", show all goals
      const uniqueGoals = new Map<string, string>()
      allPrograms.forEach(program => {
        if (!uniqueGoals.has(program.goalText)) {
          uniqueGoals.set(program.goalText, program.strategicGoalId)
        }
      })
      
      const options = Array.from(uniqueGoals.entries()).map(([text, id]) => ({ value: id, label: text }))
      return [{ value: ALL_VALUE, label: "All" }, ...options.sort((a, b) => a.label.localeCompare(b.label))]
    } else {
      // Filter programs by all selected sponsor filters
      const filteredPrograms = allPrograms.filter(program => {
        const ordLtSponsors = program.ordLtSponsors || ['(Not Specified)']
        const sponsorsLeads = program.sponsorsLeads || ['(Not Specified)']
        const reportingOwners = program.reportingOwners || ['(Not Specified)']
        
        const ordLtMatch = selectedOrdLtSponsor === ALL_VALUE || ordLtSponsors.includes(selectedOrdLtSponsor)
        const sponsorsLeadMatch = selectedSponsorsLead === ALL_VALUE || sponsorsLeads.includes(selectedSponsorsLead)
        const reportingOwnerMatch = selectedReportingOwner === ALL_VALUE || reportingOwners.includes(selectedReportingOwner)
        
        return ordLtMatch && sponsorsLeadMatch && reportingOwnerMatch
      })
      
      const uniqueGoals = new Map<string, string>()
      filteredPrograms.forEach(program => {
        if (!uniqueGoals.has(program.goalText)) {
          uniqueGoals.set(program.goalText, program.strategicGoalId)
        }
      })
      
      const options = Array.from(uniqueGoals.entries()).map(([text, id]) => ({ value: id, label: text }))
      return [{ value: ALL_VALUE, label: "All" }, ...options.sort((a, b) => a.label.localeCompare(b.label))]
    }
  }, [selectedOrdLtSponsor, selectedSponsorsLead, selectedReportingOwner, allPrograms])

  // Handle ORD LT Sponsor selection
  const handleOrdLtSponsorChange = (value: string) => {
    setSelectedOrdLtSponsor(value)
    
    // Reset downstream filters
    setSelectedSponsorsLead(ALL_VALUE)
    setSelectedReportingOwner(ALL_VALUE)
    setSelectedGoal(ALL_VALUE)
  }

  // Handle Sponsors Lead selection
  const handleSponsorsLeadChange = (value: string) => {
    setSelectedSponsorsLead(value)
    
    // Reset downstream filters
    setSelectedReportingOwner(ALL_VALUE)
    setSelectedGoal(ALL_VALUE)
  }

  // Handle Reporting Owner selection
  const handleReportingOwnerChange = (value: string) => {
    setSelectedReportingOwner(value)
    
    // Reset goal filter
    setSelectedGoal(ALL_VALUE)
  }

  // Handle goal selection
  const handleGoalChange = (value: string) => {
    setSelectedGoal(value)
    // No need to update upstream filters since this is the final filter
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full min-h-[600px] max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Filter Programs</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="p-6 space-y-6 flex-1 min-h-0">
            <div>
              <Dropdown
                options={ordLtSponsorOptions}
                value={selectedOrdLtSponsor}
                onChange={handleOrdLtSponsorChange}
                label="ORD LT Sponsor:"
                placeholder="Select an ORD LT Sponsor..."
                labelWidth="w-36"
              />
            </div>

            <div>
              <Dropdown
                options={sponsorsLeadOptions}
                value={selectedSponsorsLead}
                onChange={handleSponsorsLeadChange}
                label="Sponsors Lead:"
                placeholder="Select a Sponsors Lead..."
                labelWidth="w-36"
              />
            </div>

            <div>
              <Dropdown
                options={reportingOwnerOptions}
                value={selectedReportingOwner}
                onChange={handleReportingOwnerChange}
                label="Reporting Owner:"
                placeholder="Select a Reporting Owner..."
                labelWidth="w-36"
              />
            </div>

            <div>
              <Dropdown
                options={goalOptions}
                value={selectedGoal}
                onChange={handleGoalChange}
                label="Strategic Goal:"
                placeholder="Select a goal..."
                labelWidth="w-36"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 mt-auto">
            <button
              onClick={() => {
                setSelectedOrdLtSponsor(ALL_VALUE)
                setSelectedSponsorsLead(ALL_VALUE)
                setSelectedReportingOwner(ALL_VALUE)
                setSelectedGoal(ALL_VALUE)
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Clear All Filters
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </>
  )
}