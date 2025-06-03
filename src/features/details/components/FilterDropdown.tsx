"use client"

import { ChangeEvent } from 'react'

interface Option {
  value: string
  label: string
}

interface FilterDropdownProps {
  options: Option[]
  value: string
  onChange: (value: string) => void
  label: string
  placeholder?: string
  labelWidth?: string
}

export function FilterDropdown({
  options,
  value,
  onChange,
  label,
  placeholder = "Select an option...",
  labelWidth = "w-24"
}: FilterDropdownProps) {
  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value)
  }

  return (
    <div className="flex items-center">
      <label className={`${labelWidth} text-sm font-medium text-gray-700`}>
        {label}
      </label>
      <select
        value={value}
        onChange={handleChange}
        className="ml-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
