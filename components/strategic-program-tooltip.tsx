import React from 'react'
import type { StrategicProgram } from '@/types/scorecard'

interface StrategicProgramTooltipProps {
  program: StrategicProgram
  isVisible: boolean
  position: { x: number; y: number }
}

export const StrategicProgramTooltip: React.FC<StrategicProgramTooltipProps> = ({
  program,
  isVisible,
  position
}) => {
  if (!isVisible) return null

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not specified"
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return "Not specified"
    }
  }

  return (
    <div 
      className="fixed z-50 bg-gray-800 border-2 border-lime-400 rounded-lg p-3 shadow-lg pointer-events-none"
      style={{
        left: position.x + 15,
        top: position.y - 10,
        maxWidth: '300px'
      }}
    >
      <div className="space-y-2 text-sm">
        <div>
          <span className="text-lime-400 font-medium">ORD LT Sponsors:</span>
          <span className="text-white ml-2">{program.ordLtSponsors?.join(', ') || "Not specified"}</span>
        </div>
        
        <div>
          <span className="text-lime-400 font-medium">Sponsors Lead:</span>
          <span className="text-white ml-2">{program.sponsorsLeads?.join(', ') || "Not specified"}</span>
        </div>
        
        <div>
          <span className="text-lime-400 font-medium">Reporting Owner:</span>
          <span className="text-white ml-2">{program.reportingOwners?.join(', ') || "Not specified"}</span>
        </div>
        
        <div>
          <span className="text-lime-400 font-medium">Last Modified:</span>
          <span className="text-white ml-2">{formatDate(program.updatedAt)}</span>
        </div>
      </div>
    </div>
  )
}