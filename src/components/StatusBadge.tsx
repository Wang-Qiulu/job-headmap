import { cn } from '@/lib/utils'
import { STATUS_LABEL, type Status } from '@/types'

interface StatusBadgeProps {
  status: Status
  size?: 'sm' | 'md'
  className?: string
}

/**
 * Restrained palette: only "offer" gets the green pop.
 * Everything else is grayscale with the dot acting as the indicator.
 */
export function StatusBadge({ status, size = 'sm', className }: StatusBadgeProps) {
  const isOffer = status === 'offer'
  const isRejected = status === 'rejected'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border font-mono',
        size === 'sm' ? 'h-6 px-2 text-xs' : 'h-7 px-2.5 text-sm',
        isOffer && 'border-success/30 bg-success-soft text-ink-1',
        !isOffer && !isRejected && 'border-border bg-bg text-ink-1',
        isRejected && 'border-border bg-bg-mute text-ink-3',
        className,
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
      {STATUS_LABEL[status]}
    </span>
  )
}
