interface StatusCircleProps {
  status: string
}

export function StatusCircle({ status }: StatusCircleProps) {
  const getStatusColor = (status: string) => {
    if (!status) return "bg-gray-500";
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
      className={`w-3 h-3 rounded-full ${getStatusColor(status)}`}
      title={status}
    />
  )
} 