import type React from "react"
import Image from "next/image"

interface PillarCardProps {
  title: string
  description: string
  imageUrl?: string
}

const PillarCard: React.FC<PillarCardProps> = ({ title, description, imageUrl }) => {
  return (
    <div className="border rounded-md overflow-hidden h-full flex flex-col">
      {imageUrl && <Image src={imageUrl || "/placeholder.svg"} alt={title} className="w-full h-48 object-cover" width={400} height={192} />}
      <div className="p-4 flex-1">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-gray-700">{description}</p>
      </div>
    </div>
  )
}

export default PillarCard
