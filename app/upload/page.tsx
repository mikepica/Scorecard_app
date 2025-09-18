"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"

type UploadType = 'scorecard' | 'programs'

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploadType, setUploadType] = useState<UploadType>('scorecard')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError(null)
      setSuccess(null)
    }
  }

  const handleUploadTypeChange = (type: UploadType) => {
    setUploadType(type)
    setFile(null)
    setError(null)
    setSuccess(null)
  }

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/admin/programs/upload')
      if (!response.ok) {
        throw new Error('Failed to download template')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'strategic_programs_template.xlsx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download template')
    }
  }

  const validateFile = (): boolean => {
    if (!file) {
      setError("Please select a file")
      return false
    }

    if (uploadType === 'scorecard') {
      if (file.type !== "application/json") {
        setError("Only JSON files are supported for scorecard data")
        return false
      }
    } else if (uploadType === 'programs') {
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ]
      if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
        setError("Only Excel files (.xlsx, .xls) are supported for program data")
        return false
      }
    }

    return true
  }

  const handleScorecardUpload = async (): Promise<void> => {
    if (!file) return

    const fileContent = await file.text()
    const jsonData = JSON.parse(fileContent)

    // Validate the structure
    if (!jsonData.pillars || !Array.isArray(jsonData.pillars)) {
      throw new Error('Invalid JSON structure. The file must contain a "pillars" array.')
    }

    // Send to API
    const response = await fetch("/api/scorecard", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(jsonData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to upload scorecard data")
    }

    setSuccess("Scorecard data uploaded successfully!")
    setTimeout(() => router.push("/"), 2000)
  }

  const handleProgramsUpload = async (): Promise<void> => {
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/admin/programs/upload', {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Failed to upload Excel file')
    }

    setSuccess(`${result.message} (Created: ${result.details.created}, Updated: ${result.details.updated})`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateFile()) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      if (uploadType === 'scorecard') {
        await handleScorecardUpload()
      } else {
        await handleProgramsUpload()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Upload Data</h1>

      {/* Upload Type Selection */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Select Upload Type</h2>
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => handleUploadTypeChange('scorecard')}
            className={`px-4 py-2 rounded-md border ${
              uploadType === 'scorecard'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Scorecard Data (JSON)
          </button>
          <button
            type="button"
            onClick={() => handleUploadTypeChange('programs')}
            className={`px-4 py-2 rounded-md border ${
              uploadType === 'programs'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Strategic Programs (Excel)
          </button>
        </div>
      </div>

      {/* Upload Instructions */}
      <div className="mb-6 p-4 bg-blue-50 rounded-md">
        {uploadType === 'scorecard' ? (
          <>
            <h3 className="font-semibold text-blue-900 mb-2">Scorecard Data Upload</h3>
            <p className="text-blue-800 text-sm">
              Upload a JSON file containing the complete scorecard structure with pillars, categories, goals, and programs.
            </p>
          </>
        ) : (
          <>
            <h3 className="font-semibold text-blue-900 mb-2">Strategic Programs Upload</h3>
            <p className="text-blue-800 text-sm mb-3">
              Upload an Excel file (.xlsx or .xls) to bulk update the strategic_programs table.
              The file will update existing programs and create new ones based on the program IDs.
            </p>
            <button
              type="button"
              onClick={downloadTemplate}
              className="text-blue-600 hover:text-blue-800 underline text-sm"
            >
              Download Excel Template
            </button>
          </>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
          <input
            type="file"
            id="file-upload"
            onChange={handleFileChange}
            className="hidden"
            accept={uploadType === 'scorecard' ? 'application/json' : '.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel'}
          />
          <label htmlFor="file-upload" className="cursor-pointer text-blue-600 hover:text-blue-800">
            {file ? file.name : `Choose ${uploadType === 'scorecard' ? 'a JSON' : 'an Excel'} file`}
          </label>
          <p className="text-sm text-gray-500 mt-2">
            {file ? "Click upload to continue" : "or drag and drop here"}
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <p className="font-semibold">Success:</p>
            <p>{success}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !file}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? "Uploading..." : `Upload ${uploadType === 'scorecard' ? 'Scorecard Data' : 'Programs'}`}
        </button>
      </form>

      {/* File Format Information */}
      <div className="mt-8 p-4 bg-gray-50 rounded-md">
        <h3 className="font-semibold text-gray-900 mb-2">File Format Requirements</h3>
        {uploadType === 'scorecard' ? (
          <div className="text-sm text-gray-700">
            <p>JSON file must contain:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>A &quot;pillars&quot; array at the root level</li>
              <li>Complete hierarchical structure: pillars → categories → goals → programs</li>
            </ul>
          </div>
        ) : (
          <div className="text-sm text-gray-700">
            <p>Excel file requirements:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Required columns:</strong> Text, Goal ID, Category ID, Pillar ID</li>
              <li><strong>Optional columns:</strong> Q1-Q4 Objectives/Status, Personnel fields, Progress updates</li>
              <li><strong>Status values:</strong> exceeded, on-track, delayed, missed</li>
              <li><strong>Array fields:</strong> Use comma-separated values (e.g., &quot;John Doe, Jane Smith&quot;)</li>
              <li>If ID column is provided, existing programs will be updated; otherwise new programs are created</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
