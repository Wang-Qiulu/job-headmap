import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { STATUSES, STATUS_LABEL, type Status } from '@/types'

interface StatusDropdownProps {
  value: Status
  onChange: (status: Status) => void
  align?: 'left' | 'right'
  size?: 'sm' | 'md'
}

export function StatusDropdown({
  value,
  onChange,
  align = 'left',
  size = 'sm',
}: StatusDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const isOffer = value === 'offer'
  const isRejected = value === 'rejected'

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((o) => !o)
        }}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md border font-mono transition-colors',
          size === 'sm' ? 'h-7 px-2 text-xs' : 'h-8 px-2.5 text-sm',
          isOffer && 'border-success/30 bg-success-soft text-ink-1',
          !isOffer && !isRejected && 'border-border bg-bg text-ink-1 hover:bg-bg-soft',
          isRejected && 'border-border bg-bg-mute text-ink-3 hover:bg-bg-soft',
        )}
      >
        <span
          className={cn(
            'inline-block h-1.5 w-1.5 rounded-full',
            isOffer && 'bg-success',
            !isOffer && !isRejected && 'bg-ink-1',
            isRejected && 'bg-ink-3',
          )}
        />
        {STATUS_LABEL[value]}
        <ChevronDown size={12} className="text-ink-3" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -2 }}
            transition={{ duration: 0.1 }}
            className={cn(
              'absolute z-20 mt-1 min-w-[140px] overflow-hidden rounded-md border border-border bg-bg shadow-lg',
              align === 'right' ? 'right-0' : 'left-0',
            )}
          >
            {STATUSES.map((s) => {
              const isCurrent = s === value
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    onChange(s)
                    setOpen(false)
                  }}
                  className="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs font-mono text-ink-1 hover:bg-bg-soft"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        'inline-block h-1.5 w-1.5 rounded-full',
                        s === 'offer' && 'bg-success',
                        s !== 'offer' && s !== 'rejected' && 'bg-ink-1',
                        s === 'rejected' && 'bg-ink-3',
                      )}
                    />
                    {STATUS_LABEL[s]}
                  </span>
                  {isCurrent && <Check size={12} className="text-ink-2" />}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
