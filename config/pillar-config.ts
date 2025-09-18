// Pillar Configuration
// This file provides configuration for pillar colors and icons.
// Simply map your pillar IDs to colors and icons.

export interface PillarConfig {
  colorHex: string // Hex color code  
  bgClass: string // Tailwind background class
  textClass: string // Tailwind text class
  iconPath?: string // Path to icon file
}

// Pillar configurations mapped by ID
// These are the actual pillar IDs from the database
export const PILLAR_CONFIGS: Record<string, PillarConfig> = {
  "SPill100": {
    colorHex: "#68d2df", // Light blue - Precision Medicine
    bgClass: "bg-pillar-light-blue",
    textClass: "text-pillar-light-blue", 
    iconPath: "/icons/precision-medicine.png"
  },
  "SPill101": {
    colorHex: "#d0006f", // Magenta/pink - Pipeline Acceleration  
    bgClass: "bg-pillar-magenta",
    textClass: "text-pillar-magenta",
    iconPath: "/icons/pipeline.png"
  },
  "SPill102": {
    colorHex: "#c4d600", // Lime green - Patient Engagement
    bgClass: "bg-pillar-lime", 
    textClass: "text-pillar-lime",
    iconPath: "/icons/people.png"
  }
}

// Helper function to get config by pillar ID
export function getPillarConfig(pillar: { id: string }): PillarConfig | null {
  return PILLAR_CONFIGS[pillar.id] || null
}

// Helper function to get config by ID string
export function getPillarConfigById(pillarId: string): PillarConfig | null {
  return PILLAR_CONFIGS[pillarId] || null
}

// Mapping from functional pillar names to ORD pillar IDs
// This ensures functional views use the same colors as ORD views
export const FUNCTIONAL_PILLAR_MAPPINGS: Record<string, string> = {
  "Precision Medicine": "SPill100",
  "Pipeline Acceleration": "SPill101",
  "Patient Engagement": "SPill102"
}

// Helper function to get config by functional pillar name
export function getPillarConfigByName(pillarName: string): PillarConfig | null {
  // First check if it's already an ORD pillar ID
  if (PILLAR_CONFIGS[pillarName]) {
    return PILLAR_CONFIGS[pillarName]
  }

  // Then check if it's a functional pillar name
  const ordPillarId = FUNCTIONAL_PILLAR_MAPPINGS[pillarName]
  if (ordPillarId) {
    return PILLAR_CONFIGS[ordPillarId]
  }

  return null
}