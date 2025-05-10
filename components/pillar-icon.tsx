export function PillarIcon({ name }: { name: string }) {
  const getIconSrc = () => {
    const lowerName = name.toLowerCase()

    // Updated icon mapping according to requirements
    if (lowerName.includes("patient engagement")) {
      return "/icons/science-icon.png"
    } else if (lowerName.includes("precision medicine")) {
      return "/icons/growth-icon.png"
    } else if (lowerName.includes("pipeline acceleration")) {
      return "/icons/people-icon.png"
    } else if (lowerName.includes("science")) {
      return "/icons/science-icon.png"
    } else if (lowerName.includes("growth")) {
      return "/icons/growth-icon.png"
    } else if (lowerName.includes("people")) {
      return "/icons/people-icon.png"
    }

    return null
  }

  const getBgColor = () => {
    const lowerName = name.toLowerCase()

    if (lowerName.includes("science") || lowerName.includes("patient engagement")) {
      return "bg-cyan-400"
    } else if (lowerName.includes("growth") || lowerName.includes("precision medicine")) {
      return "bg-pink-600"
    } else if (lowerName.includes("people") || lowerName.includes("pipeline acceleration")) {
      return "bg-lime-400"
    }

    return "bg-gray-300"
  }

  const iconSrc = getIconSrc()

  // If we have an icon source, use the img tag
  if (iconSrc) {
    return (
      <div className={`w-8 h-8 rounded-full ${getBgColor()} flex items-center justify-center overflow-hidden`}>
        <img src={iconSrc || "/placeholder.svg"} alt={`${name} icon`} className="w-5 h-5 object-contain" />
      </div>
    )
  }

  // Fallback to the original icon display
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

  return <div className={`w-8 h-8 rounded-full ${getBgColor()} flex items-center justify-center`}>{getIcon()}</div>
}
