import { Beaker, Users, Microscope, Rocket, Heart, TrendingUp } from "lucide-react"

interface PillarIconProps {
  name: string
}

export function PillarIcon({ name }: PillarIconProps) {
  // Map pillar names to icon image filenames
  const getIconSrc = () => {
    const lowerName = name.toLowerCase()

    if (lowerName.includes("precision medicine")) {
      return "/icons/precision-medicine.png"
    } else if (lowerName.includes("pipeline acceleration")) {
      return "/icons/pipeline.png"
    } else if (lowerName.includes("people")) {
      return "/icons/people.png"
    } else if (lowerName.includes("science") || lowerName.includes("patient engagement")) {
      return "/icons/people.png"
    } else if (lowerName.includes("growth")) {
      return "/icons/precision-medicine.png"
    }

    return null
  }

  // Map pillar names to background color
  const getBgColor = () => {
    const lowerName = name.toLowerCase()

    if (lowerName.includes("precision medicine")) {
      return "bg-pillar-light-blue"
    } else if (lowerName.includes("pipeline acceleration")) {
      return "bg-pillar-magenta"
    } else if (lowerName.includes("people")) {
      return "bg-pillar-lime"
    } else if (lowerName.includes("patient engagement")) {
      return "bg-green-500"
    } else if (lowerName.includes("science")) {
      return "bg-cyan-400"
    } else if (lowerName.includes("growth")) {
      return "bg-pink-600"
    }

    return "bg-gray-300"
  }

  // Fallback emoji if no image is found
  const getIcon = () => {
    const lowerName = name.toLowerCase()

    if (lowerName.includes("science") || lowerName.includes("patient engagement")) {
      return "🧪"
    } else if (lowerName.includes("growth") || lowerName.includes("precision medicine")) {
      return "📈"
    } else if (lowerName.includes("people") || lowerName.includes("pipeline acceleration")) {
      return "👥"
    }

    return "📊"
  }

  const iconSrc = getIconSrc()

  if (iconSrc) {
    const lowerName = name.toLowerCase()
    if (lowerName.includes("patient engagement")) {
      return (
        <div className="w-24 h-24 flex items-center justify-center">
          <img 
            src={iconSrc || "/placeholder.svg"} 
            alt={`${name} icon`} 
            className="w-15 h-15 object-contain" 
          />
        </div>
      )
    }
    return (
      <div className={`w-24 h-24 rounded-full ${getBgColor()} flex items-center justify-center overflow-hidden p-2`}>
        <img 
          src={iconSrc || "/placeholder.svg"} 
          alt={`${name} icon`} 
          className="w-20 h-20 object-contain" 
        />
      </div>
    )
  }

  // Fallback to emoji if no image found
  return <div className={`w-24 h-24 rounded-full ${getBgColor()} flex items-center justify-center text-3xl`}>{getIcon()}</div>
} 