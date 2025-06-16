"use client"

import Link from "next/link"
import { BarChart2, Menu, Camera, FileText } from "lucide-react"

export default function InstructionsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-lime-400 py-2 px-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">ORD Scorecard: Instructions</h1>
        
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-md transition-colors text-sm"
          >
            <BarChart2 size={16} />
            <span>Goal-level view</span>
          </Link>

          <Link
            href="/details"
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-md transition-colors text-sm"
          >
            <BarChart2 size={16} />
            <span>Program View</span>
          </Link>
        </div>
      </header>
      
      <div className="container mx-auto px-4 pt-8 flex-1">
        <h1 className="text-3xl font-bold mb-6">Pending Instructions to create</h1>
      </div>
    </div>
  )
}