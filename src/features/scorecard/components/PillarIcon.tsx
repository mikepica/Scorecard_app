import { Beaker, Users, Microscope, Rocket, Heart, TrendingUp } from "lucide-react"

interface PillarIconProps {
  name: string
}

export function PillarIcon({ name }: PillarIconProps) {
  const getIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case "science & innovation":
        return <Beaker className="w-5 h-5" />
      case "growth & ta leadership":
        return <TrendingUp className="w-5 h-5" />
      case "people & sustainability":
        return <Users className="w-5 h-5" />
      case "precision medicine":
        return <Microscope className="w-5 h-5" />
      case "pipeline acceleration":
        return <Rocket className="w-5 h-5" />
      case "patient engagement":
        return <Heart className="w-5 h-5" />
      default:
        return null
    }
  }

  return <div className="flex-shrink-0">{getIcon(name)}</div>
} 