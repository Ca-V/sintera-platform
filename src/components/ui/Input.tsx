'use client'

import { cn } from '@/lib/utils'
import { type InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-onyx/80 font-body">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-mauve">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full rounded-xl border border-border bg-white px-4 py-3',
              'text-sm text-onyx placeholder:text-mauve/60 font-body',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-petal/30 focus:border-petal',
              'hover:border-petal-light',
              icon && 'pl-10',
              error && 'border-red-300 focus:ring-red-200 focus:border-red-400',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-red-500 font-body">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input
