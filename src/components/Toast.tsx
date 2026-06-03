import { useEffect, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: string
  type: ToastType
  message: string
}

let listeners: Array<(t: ToastItem) => void> = []

export function toast(message: string, type: ToastType = 'info') {
  const item: ToastItem = { id: Math.random().toString(36).slice(2), type, message }
  listeners.forEach((l) => l(item))
}

export function ToastContainer() {
  const [items, setItems] = useState<ToastItem[]>([])

  const onToast = useCallback((t: ToastItem) => {
    setItems((prev) => [...prev, t])
    setTimeout(() => {
      setItems((prev) => prev.filter((x) => x.id !== t.id))
    }, 2400)
  }, [])

  useEffect(() => {
    listeners.push(onToast)
    return () => {
      listeners = listeners.filter((l) => l !== onToast)
    }
  }, [onToast])

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[60] flex flex-col gap-2">
      <AnimatePresence>
        {items.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'pointer-events-auto flex items-center gap-2 rounded-md border bg-bg px-3 py-2 text-sm shadow-lg',
              t.type === 'success' && 'border-success/30 text-ink-1',
              t.type === 'error' && 'border-red-300 text-ink-1',
              t.type === 'info' && 'border-border text-ink-1',
            )}
          >
            <span
              className={cn(
                'inline-flex h-4 w-4 items-center justify-center rounded-full',
                t.type === 'success' && 'bg-success text-white',
                t.type === 'error' && 'bg-red-500 text-white',
                t.type === 'info' && 'bg-ink-2 text-bg',
              )}
            >
              {t.type === 'success' ? (
                <Check size={10} strokeWidth={3} />
              ) : t.type === 'error' ? (
                <X size={10} strokeWidth={3} />
              ) : (
                <span className="text-[8px]">i</span>
              )}
            </span>
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
