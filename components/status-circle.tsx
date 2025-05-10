export function StatusCircle({ status }: { status?: string }) {
  const getStatusColor = (status?: string) => {
    if (!status) return "bg-gray-300"

    switch (status.toLowerCase()) {
      case "exceeded":
      case "blue":
        return "bg-blue-500"
      case "on-track":
      case "green":
        return "bg-green-500"
      case "delayed":
      case "amber":
        return "bg-yellow-500"
      case "missed":
      case "red":
        return "bg-red-500"
      default:
        return "bg-gray-300"
    }
  }

  return <div className={`w-6 h-6 rounded-full ${getStatusColor(status)} mx-auto`} title={status}></div>
}
