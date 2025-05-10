"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown } from "lucide-react"

interface DropdownProps {
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
  label: string
  placeholder?: string
  labelWidth?: string
}

export function Dropdown({
  options,
  value,
  onChange,
  label,
  placeholder = "Select...",
  labelWidth = "w-32",
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const selectedOption = options.find((option) => option.value === value)

  return (
    <div className="relative w-full flex items-center" ref={dropdownRef}>
      <label className={`font-medium text-lg ${labelWidth} flex-shrink-0`}>{label}</label>
      <div
        className="flex items-center justify-between w-full p-2 border border-gray-300 rounded-md bg-white cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? "text-gray-900" : "text-gray-500"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={16} className="text-gray-500" />
      </div>

      {isOpen && (
        <div
          className="absolute z-10 w-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
          style={{ top: "100%", marginLeft: labelWidth }}
        >
          {options.map((option) => (
            <div
              key={option.value}
              className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                value === option.value ? "bg-purple-50 text-purple-700" : ""
              }`}
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
