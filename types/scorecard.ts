export interface StrategicProgram {
  id: string
  text: string
  q1Objective?: string
  q2Objective?: string
  q3Objective?: string
  q4Objective?: string
  ordLtSponsors?: string
  sponsorsLeads?: string
  reportingOwners?: string
  q1Status?: "exceeded" | "on-track" | "delayed" | "missed"
  q2Status?: "exceeded" | "on-track" | "delayed" | "missed"
  q3Status?: "exceeded" | "on-track" | "delayed" | "missed"
  q4Status?: "exceeded" | "on-track" | "delayed" | "missed"
  progressUpdates?: string
  strategicGoalId: string
  categoryId: string
  strategicPillarId: string
}

export interface StrategicGoal {
  id: string
  text: string
  q1Objective?: string
  q2Objective?: string
  q3Objective?: string
  q4Objective?: string
  ordLtSponsors?: string
  sponsorsLeads?: string
  reportingOwners?: string
  q1Status?: "exceeded" | "on-track" | "delayed" | "missed"
  q2Status?: "exceeded" | "on-track" | "delayed" | "missed"
  q3Status?: "exceeded" | "on-track" | "delayed" | "missed"
  q4Status?: "exceeded" | "on-track" | "delayed" | "missed"
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
