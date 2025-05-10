"use client"

import { useState, useRef, useEffect } from "react"
import { X, Send } from "lucide-react"
import { Overlay } from "./overlay"

type Message = {
  id: string
  text: string
  sender: "user" | "ai"
  timestamp: Date
}

export function AIChat({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "Hello! I'm your AI assistant. How can I help you with your scorecard today?",
      sender: "ai",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Handle sending a message
  const handleSendMessage = () => {
    if (!input.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: "user",
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInput("")

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getAIResponse(input),
        sender: "ai",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiResponse])
    }, 1000)
  }

  // Simple AI response generator
  const getAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase()

    if (input.includes("hello") || input.includes("hi")) {
      return "Hello! How can I help you with your scorecard today?"
    } else if (input.includes("help")) {
      return "I can help you understand your scorecard data, suggest improvements, or answer questions about specific metrics."
    } else if (input.length < 10) {
      return "Could you provide more details so I can better assist you?"
    } else {
      return "I've analyzed your scorecard data. Would you like me to suggest improvements for any specific pillar or category?"
    }
  }

  // Format timestamp
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  if (!isOpen) return null

  return (
    <>
      <Overlay isVisible={isOpen} onClick={onClose} />
      <div
        className={`fixed right-0 top-0 h-full w-full md:w-96 bg-white shadow-lg z-50 flex flex-col transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-purple-600 text-white">
          <h2 className="text-lg font-semibold">AI Chat</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-purple-700">
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex flex-col ${message.sender === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.sender === "user" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-800"
                }`}
              >
                {message.text}
              </div>
              <span className="text-xs text-gray-500 mt-1">{formatTime(message.timestamp)}</span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Type your message..."
              className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim()}
              className="p-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
