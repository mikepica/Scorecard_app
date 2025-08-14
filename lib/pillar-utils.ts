import { Pillar } from '@/types/scorecard'
import { getPillarConfig, getPillarConfigById } from '@/config/pillar-config'

export function getPillarColor(pillar: Pillar): string {
  const config = getPillarConfig(pillar)
  return config ? config.bgClass : "bg-gray-300"
}

export function getPillarColorWithText(pillar: Pillar): string {
  const config = getPillarConfig(pillar)
  return config ? `${config.bgClass} text-white` : "bg-gray-300 text-black"
}

export function getPillarColorById(pillarId: string): string {
  const config = getPillarConfigById(pillarId)
  return config ? config.bgClass : "bg-gray-300"
}