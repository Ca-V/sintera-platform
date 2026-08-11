'use client'

import { cn } from '@/lib/utils'
import { fieldClass } from './field'
import { type InputHTMLAttributes, forwardRef, useId } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, id, ...props }, ref) => {
    // id estável e único (evita colisão quando dois campos têm o mesmo label).
    const autoId = useId()
    const inputId = id ?? autoId
    const errorId = `${inputId}-error`

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
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            // Reusa a SUPERFÍCIE canônica do campo (não reimplementa o estilo).
            className={fieldClass({ error: !!error, className: cn(icon && 'pl-10', className) })}
            {...props}
          />
        </div>
        {error && (
          <p id={errorId} role="alert" className="text-xs text-red-500 font-body">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input
