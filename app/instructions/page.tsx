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
              <div className="bg-white rounded-lg shadow-lg p-2 flex flex-col">
                <h3 className="text-lg font-bold mb-2 text-center">OODA Loop</h3>
                <div className="flex-1 flex items-center justify-center">
                  <div 
                    className="relative cursor-pointer hover:opacity-80 transition-opacity w-full h-full flex items-center justify-center"
                    onClick={() => setShowModal(true)}
                    title="Click to view full size"
                  >
                    <Image
                      src="/OODA-loop-words.jpg"
                      alt="OODA Loop Diagram"
                      width={300}
                      height={300}
                      className="rounded-lg shadow-md object-contain max-w-full max-h-full"
                      style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '100%' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for full-size OODA diagram */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-5xl max-h-full bg-white rounded-lg p-4">
            <button
              onClick={() => setShowModal(false)}
              className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 z-10 shadow-lg"
              aria-label="Close modal"
            >
              <X size={24} />
            </button>
            <div className="bg-white p-4 rounded-lg">
              <Image
                src="/OODA.Boyd.svg"
                alt="OODA Loop - Full Diagram"
                width={900}
                height={700}
                className="rounded-lg shadow-xl"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}