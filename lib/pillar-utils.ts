import { Pillar } from '@/types/scorecard'
import { getPillarConfig, getPillarConfigById, getPillarConfigByName } from '@/config/pillar-config'

export function getPillarColor(pillar: Pillar): string {
  // First try the standard ID-based lookup
  let config = getPillarConfig(pillar)

  // If that fails, try name-based lookup (for functional pillars)
  if (!config) {
    config = getPillarConfigByName(pillar.id)
  }

  return config ? config.bgClass : "bg-gray-300"
}

export function getPillarColorWithText(pillar: Pillar): string {
  // First try the standard ID-based lookup
  let config = getPillarConfig(pillar)

  // If that fails, try name-based lookup (for functional pillars)
  if (!config) {
    config = getPillarConfigByName(pillar.id)
  }

  return config ? `${config.bgClass} text-white` : "bg-gray-300 text-black"
}

export function getPillarColorById(pillarId: string): string {
  const config = getPillarConfigById(pillarId)
  return config ? config.bgClass : "bg-gray-300"
}

export function getPillarColorByName(pillarName: string): string {
  const config = getPillarConfigByName(pillarName)
  return config ? config.bgClass : "bg-gray-300"
}

export function getPillarColorWithTextByName(pillarName: string): string {
  const config = getPillarConfigByName(pillarName)
  return config ? `${config.bgClass} text-white` : "bg-gray-300 text-black"
}