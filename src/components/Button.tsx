import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const variants: Record<Variant, string> = {
  primary:
    'bg-ink-1 text-bg hover:bg-black border border-ink-1 disabled:bg-ink-3 disabled:border-ink-3',
  secondary:
    'bg-bg text-ink-1 border border-border hover:bg-bg-soft',
  ghost:
    'bg-transparent text-ink-2 hover:bg-bg-soft hover:text-ink-1',
  danger:
    'bg-bg text-ink-2 border border-border hover:border-red-300 hover:text-red-600',
}

const sizes: Record<Size, string> = {
  sm: 'h-7 px-2.5 text-xs',
  md: 'h-8 px-3 text-sm',
  lg: 'h-9 px-4 text-sm',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-1 focus-visible:ring-offset-1',
          'disabled:cursor-not-allowed disabled:opacity-60',
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'
