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
  q1Comments?: string
  q2Comments?: string
  q3Comments?: string
  q4Comments?: string
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
  q1Comments?: string
  q2Comments?: string
  q3Comments?: string
  q4Comments?: string
  programs?: StrategicProgram[]
}

export interface Category {
  id: string
  name: string
  pillar: string
  goals: StrategicGoal[]
}

export interface Pillar {
  id: string
  name: string
  categories: Category[]
}

export interface ScoreCardData {
  pillars: Pillar[]
}
