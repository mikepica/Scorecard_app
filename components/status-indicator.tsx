export function StatusIndicator({ status }: { status?: string }) {
  const getStatusColor = () => {
    if (!status) return "bg-gray-300"

    switch (status) {
      case "exceeded":
        return "bg-blue-400"
      case "on-track":
        return "bg-green-500"
      case "delayed":
        return "bg-yellow-400"
      case "missed":
        return "bg-red-500"
      default:
        return "bg-gray-300"
    }
  }

  return <div className={`w-5 h-5 rounded-full ${getStatusColor()} flex-shrink-0`} title={status || "Not defined"}></div>
}
