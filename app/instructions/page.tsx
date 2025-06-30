"use client"

import Link from "next/link"
import { BarChart2, Menu, Camera, FileText, X } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { useState, useEffect } from "react"
import Image from "next/image"

export default function InstructionsPage() {
  const [showModal, setShowModal] = useState(false)
  const [mainContent, setMainContent] = useState('')
  const [aiContent, setAiContent] = useState('')
  const [oodaContent, setOodaContent] = useState('')

  useEffect(() => {
    // Load markdown content
    Promise.all([
      fetch('/api/markdown/main-instructions').then(res => res.text()),
      fetch('/api/markdown/ai-usage').then(res => res.text()),
      fetch('/api/markdown/ooda-ai-integration').then(res => res.text())
    ]).then(([main, ai, ooda]) => {
      setMainContent(main)
      setAiContent(ai)
      setOodaContent(ooda)
    }).catch(err => console.error('Failed to load markdown:', err))
  }, [])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowModal(false)
      }
    }
    
    if (showModal) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [showModal])

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
      
      <div className="max-w-full mx-auto px-2 pt-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
          {/* Left Panel - Main Instructions */}
          <div className="bg-white rounded-lg shadow-lg p-6 overflow-y-auto">
            <div className="prose prose-lg max-w-none">
              <ReactMarkdown>{mainContent}</ReactMarkdown>
            </div>
          </div>

          {/* Right Panel */}
          <div className="flex flex-col gap-4">
            {/* Top Right - AI Usage */}
            <div className="bg-white rounded-lg shadow-lg p-6 flex-1 overflow-y-auto">
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{aiContent}</ReactMarkdown>
              </div>
            </div>

            {/* Bottom Right - Split between OODA AI Integration and OODA Loop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
              {/* Bottom Left - OODA AI Integration */}
              <div className="bg-white rounded-lg shadow-lg p-4 overflow-y-auto">
                <div className="prose prose-xs max-w-none">
                  <ReactMarkdown>{oodaContent}</ReactMarkdown>
                </div>
              </div>

              {/* Bottom Right - OODA Loop Diagram */}
              <div className="bg-white rounded-lg shadow-lg p-4 flex flex-col items-center justify-center">
                <h3 className="text-lg font-bold mb-4 text-center">OODA Loop</h3>
                <div 
                  className="relative cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setShowModal(true)}
                  title="Click to view full size"
                >
                  <Image
                    src="/OODA-loop-words.jpg"
                    alt="OODA Loop Diagram"
                    width={200}
                    height={200}
                    className="rounded-lg shadow-md"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for full-size OODA diagram */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setShowModal(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 z-10"
              aria-label="Close modal"
            >
              <X size={32} />
            </button>
            <Image
              src="/OODA.Boyd.svg"
              alt="OODA Loop - Full Diagram"
              width={800}
              height={600}
              className="rounded-lg shadow-xl"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}