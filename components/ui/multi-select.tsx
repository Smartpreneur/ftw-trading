'use client'

import * as React from 'react'
import { Check } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

interface MultiSelectProps {
  options: { value: string; label: string }[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  className?: string
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Auswählen...',
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  const handleToggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const displayText = placeholder

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('justify-between h-9', className)}
        >
          <span className="truncate">{displayText}</span>
          <svg
            className="ml-2 h-4 w-4 shrink-0 opacity-50"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-2" align="start">
        <div className="space-y-1">
          {options.map((option) => {
            const isSelected = selected.includes(option.value)
            return (
              <div
                key={option.value}
                className="flex items-center space-x-2 rounded-sm px-2 py-1.5 hover:bg-accent cursor-pointer"
                onClick={() => handleToggle(option.value)}
              >
                <Checkbox checked={isSelected} />
                <label className="flex-1 text-sm cursor-pointer">
                  {option.label}
                </label>
              </div>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
