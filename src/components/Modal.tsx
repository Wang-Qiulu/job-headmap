import { useEffect, useRef, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, scale: 0.98, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={cn(
              'relative z-10 w-full max-w-md rounded-xl border border-border bg-bg p-6 shadow-lg',
              className,
            )}
          >
            {title && (
              <h2 className="mb-4 text-lg font-semibold text-ink-1">{title}</h2>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
