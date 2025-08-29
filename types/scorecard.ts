export interface StrategicProgram {
  id: string
  text: string
  
  // 2025 Objectives and Statuses
  q1_2025_objective?: string
  q2_2025_objective?: string
  q3_2025_objective?: string
  q4_2025_objective?: string
  q1_2025_status?: "exceeded" | "on-track" | "delayed" | "missed"
  q2_2025_status?: "exceeded" | "on-track" | "delayed" | "missed"
  q3_2025_status?: "exceeded" | "on-track" | "delayed" | "missed"
  q4_2025_status?: "exceeded" | "on-track" | "delayed" | "missed"
  
  // 2026 Objectives and Statuses
  q1_2026_objective?: string
  q2_2026_objective?: string
  q3_2026_objective?: string
  q4_2026_objective?: string
  q1_2026_status?: "exceeded" | "on-track" | "delayed" | "missed"
  q2_2026_status?: "exceeded" | "on-track" | "delayed" | "missed"
  q3_2026_status?: "exceeded" | "on-track" | "delayed" | "missed"
  q4_2026_status?: "exceeded" | "on-track" | "delayed" | "missed"
  
  // Legacy fields (for backward compatibility during transition)
  q1Objective?: string
  q2Objective?: string
  q3Objective?: string
  q4Objective?: string
  q1Status?: "exceeded" | "on-track" | "delayed" | "missed"
  q2Status?: "exceeded" | "on-track" | "delayed" | "missed"
  q3Status?: "exceeded" | "on-track" | "delayed" | "missed"
  q4Status?: "exceeded" | "on-track" | "delayed" | "missed"
  
  ordLtSponsors?: string
  sponsorsLeads?: string
  reportingOwners?: string
  progressUpdates?: string
  
  // Quarterly progress updates (2025-2026)
  q1_2025_progress?: string
  q2_2025_progress?: string
  q3_2025_progress?: string
  q4_2025_progress?: string
  q1_2026_progress?: string
  q2_2026_progress?: string
  q3_2026_progress?: string
  q4_2026_progress?: string
  
  updatedAt?: string
  strategicGoalId: string
  categoryId: string
  strategicPillarId: string
}

export interface StrategicGoal {
  id: string
  text: string
  
  // 2025 Objectives and Statuses
  q1_2025_objective?: string
  q2_2025_objective?: string
  q3_2025_objective?: string
  q4_2025_objective?: string
  q1_2025_status?: "exceeded" | "on-track" | "delayed" | "missed"
  q2_2025_status?: "exceeded" | "on-track" | "delayed" | "missed"
  q3_2025_status?: "exceeded" | "on-track" | "delayed" | "missed"
  q4_2025_status?: "exceeded" | "on-track" | "delayed" | "missed"
  
  // 2026 Objectives and Statuses
  q1_2026_objective?: string
  q2_2026_objective?: string
  q3_2026_objective?: string
  q4_2026_objective?: string
  q1_2026_status?: "exceeded" | "on-track" | "delayed" | "missed"
  q2_2026_status?: "exceeded" | "on-track" | "delayed" | "missed"
  q3_2026_status?: "exceeded" | "on-track" | "delayed" | "missed"
  q4_2026_status?: "exceeded" | "on-track" | "delayed" | "missed"
  
  // Legacy fields (for backward compatibility during transition)
  q1Objective?: string
  q2Objective?: string
  q3Objective?: string
  q4Objective?: string
  q1Status?: "exceeded" | "on-track" | "delayed" | "missed"
  q2Status?: "exceeded" | "on-track" | "delayed" | "missed"
  q3Status?: "exceeded" | "on-track" | "delayed" | "missed"
  q4Status?: "exceeded" | "on-track" | "delayed" | "missed"
  
  ordLtSponsors?: string
  sponsorsLeads?: string
  reportingOwners?: string
  progressUpdates?: string
  programs?: StrategicProgram[]
  status?: "exceeded" | "on-track" | "delayed" | "missed"
  comments?: string
  categoryId: string
  strategicPillarId: string
}

export interface Category {
  id: string
  name: string
  status?: "exceeded" | "on-track" | "delayed" | "missed"
  comments?: string
  goals: StrategicGoal[]
  strategicPillarId: string
}

export interface Pillar {
  id: string
  name: string
  categories: Category[]
}

export interface ScoreCardData {
  pillars: Pillar[]
}
