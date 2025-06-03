"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      setError("Please select a JSON file")
      return
    }

    if (file.type !== "application/json") {
      setError("Only JSON files are supported")
      return
    }

    setLoading(true)

    try {
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

      // Redirect to the scorecard view
      router.push("/")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-bold mb-6">Upload Scorecard Data</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
          <input
            type="file"
            id="file-upload"
            onChange={handleFileChange}
            className="hidden"
            accept="application/json"
          />
          <label htmlFor="file-upload" className="cursor-pointer text-blue-600 hover:text-blue-800">
            {file ? file.name : "Choose a JSON file"}
          </label>
          <p className="text-sm text-gray-500 mt-2">{file ? "Click upload to continue" : "or drag and drop here"}</p>
        </div>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}

        <button
          type="submit"
          disabled={loading || !file}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? "Uploading..." : "Upload Scorecard Data"}
        </button>
      </form>
    </div>
  )
}
