interface StatusCircleProps {
  status: string
}

export function StatusCircle({ status }: StatusCircleProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "on-track":
        return "bg-green-500"
      case "at-risk":
        return "bg-yellow-500"
      case "off-track":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div
      className={`w-2 h-2 rounded-full ${getStatusColor(status)}`}
      title={status}
    />
  )
} 