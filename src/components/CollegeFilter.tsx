'use client'

import { COLLEGES } from '@/lib/constants'
import type { College } from '@/lib/constants'

interface CollegeFilterProps {
  selected: College
  onChange: (college: College) => void
}

export function CollegeFilter({ selected, onChange }: CollegeFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto py-3 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {COLLEGES.map((college) => (
        <button
          key={college}
          onClick={() => onChange(college)}
          className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            selected === college
              ? 'bg-primary text-white'
              : 'border border-gray-300 text-gray-600 hover:border-gray-400'
          }`}
        >
          {college}
        </button>
      ))}
    </div>
  )
}
