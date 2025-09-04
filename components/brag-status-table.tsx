interface BragStatusTableProps {
  className?: string
}

export default function BragStatusTable({ className = '' }: BragStatusTableProps) {
  const statusData = [
    { status: 'Blue', description: 'Exceeded Objective' },
    { status: 'Red', description: 'Missing/No longer Achieved/Delayed' },
    { status: 'Amber', description: 'Delayed but timelines still achieveable' },
    { status: 'Green', description: 'On track or completed as planned' },
    { status: 'N/A', description: 'Not Applicable' },
    { status: 'NYS', description: 'Not Yet Started' },
    { status: 'Stopped', description: 'Decision to Discontinue' }
  ]

  const getStatusCellStyle = (status: string) => {
    switch (status) {
      case 'Blue': return 'bg-blue-600 text-white font-semibold'
      case 'Red': return 'bg-red-600 text-white font-semibold'
      case 'Amber': return 'bg-amber-500 text-white font-semibold'
      case 'Green': return 'bg-green-600 text-white font-semibold'
      case 'N/A': return 'bg-white text-black font-semibold border-gray-300'
      case 'NYS': return 'bg-white text-black font-semibold border-gray-300'
      case 'Stopped': return 'bg-gray-400 text-white font-semibold'
      default: return 'bg-white text-black'
    }
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
              BRAG Status
            </th>
            <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
              Description
            </th>
          </tr>
        </thead>
        <tbody>
          {statusData.map((row, index) => (
            <tr key={index}>
              <td className={`border border-gray-300 px-4 py-2 ${getStatusCellStyle(row.status)}`}>
                {row.status}
              </td>
              <td className={`border border-gray-300 px-4 py-2 text-gray-700 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                {row.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}