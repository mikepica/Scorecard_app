"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"

interface ToastProps {
  message: string
  type?: "success" | "error" | "warning" | "info"
  duration?: number
  onClose: () => void
}

export function Toast({ message, type = "info", duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Allow time for fade-out animation
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const getBackgroundColor = () => {
    switch (type) {
      case "success":
        return "bg-green-500"
      case "error":
        return "bg-red-500"
      case "warning":
        return "bg-yellow-500"
      default:
        return "bg-blue-500"
    }
  }

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center p-4 mb-4 text-white rounded-md shadow-lg transition-opacity duration-300 ${getBackgroundColor()} ${isVisible ? "opacity-100" : "opacity-0"}`}
    >
      <div className="mr-3">{message}</div>
      <button
        onClick={() => {
          setIsVisible(false)
          setTimeout(onClose, 300)
        }}
        className="ml-auto text-white hover:text-gray-200"
      >
        <X size={18} />
      </button>
    </div>
  )
}
