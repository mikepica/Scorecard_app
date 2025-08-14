import { Pillar } from '@/types/scorecard'
import { getPillarConfig } from '@/config/pillar-config'

export function PillarIcon({ pillar }: { pillar: Pillar }) {
  const config = getPillarConfig(pillar)
  
  const getIconSrc = () => {
    return config?.iconPath || null
  }

  const getBgColor = () => {
    return config ? config.bgClass : "bg-gray-300"
  }

  const iconSrc = getIconSrc()

  // If we have an icon source, use the img tag
  if (iconSrc) {
    const lowerName = pillar.name.toLowerCase()
    
    // Remove circle for Patient Engagement
    if (lowerName.includes("patient engagement")) {
      return (
        <div className="w-24 h-24 flex items-center justify-center">
          <img 
            src={iconSrc || "/placeholder.svg"} 
            alt={`${pillar.name} icon`} 
            className="w-15 h-15 object-contain" 
          />
        </div>
      )
    }
    
    // Keep circle for all other pillars
    return (
      <div className={`w-24 h-24 rounded-full ${getBgColor()} flex items-center justify-center overflow-hidden p-2`}>
        <img 
          src={iconSrc || "/placeholder.svg"} 
          alt={`${pillar.name} icon`} 
          className="w-20 h-20 object-contain" 
        />
      </div>
    )
  }

  // Fallback to the original icon display
  const getIcon = () => {
    const lowerName = pillar.name.toLowerCase()

    if (lowerName.includes("science") || lowerName.includes("patient engagement")) {
      return "🧪"
    } else if (lowerName.includes("growth") || lowerName.includes("precision medicine")) {
      return "📈"
    } else if (lowerName.includes("people") || lowerName.includes("pipeline acceleration")) {
      return "👥"
    }

    return "📊"
  }

  return <div className={`w-24 h-24 rounded-full ${getBgColor()} flex items-center justify-center text-3xl`}>{getIcon()}</div>
}
