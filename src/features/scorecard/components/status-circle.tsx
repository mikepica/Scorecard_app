interface StatusCircleProps {
  status: "exceeded" | "on-track" | "delayed" | "missed" | string
}

export function StatusCircle({ status }: StatusCircleProps) {
  const getStatusColor = (status: string) => {
    if (!status) return "bg-gray-500";
    switch (status.toLowerCase()) {
      case "exceeded":
        return "bg-blue-400"
      case "on-track":
        return "bg-green-500"
      case "delayed":
        return "bg-yellow-400"
      case "missed":
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