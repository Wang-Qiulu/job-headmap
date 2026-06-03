import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
}

const fieldBase =
  'w-full rounded-md border border-border bg-bg px-3 text-sm text-ink-1 placeholder:text-ink-3 ' +
  'transition-colors focus:border-ink-1 focus:outline-none ' +
  'h-9 font-mono'

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, className, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs text-ink-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(fieldBase, error && 'border-red-400', className)}
          {...props}
        />
        {hint && !error && <p className="text-xs text-ink-3">{hint}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    )
  },
)
Input.displayName = 'Input'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, className, id, ...props }, ref) => {
    const inputId = id || `ta-${Math.random().toString(36).slice(2, 9)}`
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs text-ink-2">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-ink-1 placeholder:text-ink-3 transition-colors focus:border-ink-1 focus:outline-none font-mono',
            error && 'border-red-400',
            className,
          )}
          {...props}
        />
        {hint && !error && <p className="text-xs text-ink-3">{hint}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    )
  },
)
Textarea.displayName = 'Textarea'
