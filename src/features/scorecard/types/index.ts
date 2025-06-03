export interface StrategicProgram {
  id: string
  text: string
  q1Objective?: string
  q2Objective?: string
  q3Objective?: string
  q4Objective?: string
  q1Status?: 'on-track' | 'at-risk' | 'off-track'
  q2Status?: 'on-track' | 'at-risk' | 'off-track'
  q3Status?: 'on-track' | 'at-risk' | 'off-track'
  q4Status?: 'on-track' | 'at-risk' | 'off-track'
}

export interface StrategicGoal {
  id: string
  name: string
  text: string
  description: string
  status: 'on-track' | 'at-risk' | 'off-track'
  q1Status: 'on-track' | 'at-risk' | 'off-track'
  q2Status: 'on-track' | 'at-risk' | 'off-track'
  q3Status: 'on-track' | 'at-risk' | 'off-track'
  q4Status: 'on-track' | 'at-risk' | 'off-track'
  ordLtSponsors?: string
  programs?: StrategicProgram[]
}

export interface Category {
  id: string
  name: string
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
