import { useEffect, useRef, useState } from 'react'
import { computeFunnel, type FunnelStats } from '@/lib/utils'
import type { Application } from '@/types'
import { cn } from '@/lib/utils'

interface HeroStatsProps {
  applications: Application[]
}

interface CounterProps {
  value: number
  className?: string
}

function Counter({ value, className }: CounterProps) {
  // count-up animation when value changes
  const [display, setDisplay] = useState(value)
  const previous = useRef(value)

  useEffect(() => {
    if (value === previous.current) return
    const start = previous.current
    const end = value
    const duration = 300
    const startTime = performance.now()
    let raf = 0
    const step = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      const v = Math.round(start + (end - start) * eased)
      setDisplay(v)
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    previous.current = end
    return () => cancelAnimationFrame(raf)
  }, [value])

  return <span className={className}>{display.toString().padStart(0, ' ')}</span>
}

interface StatCellProps {
  value: number
  label: string
  sublabel?: string
  highlight?: boolean
}

function StatCell({ value, label, sublabel, highlight }: StatCellProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1 px-1 first:pl-0 last:pr-0">
      <Counter
        value={value}
        className={cn(
          'num font-mono font-semibold leading-none tracking-tight',
          highlight ? 'text-2xl text-success' : 'text-2xl text-ink-1',
        )}
      />
      <div className="text-sm text-ink-1">{label}</div>
      {sublabel && <div className="text-xs text-ink-3">{sublabel}</div>}
    </div>
  )
}

export function HeroStats({ applications }: HeroStatsProps) {
  const stats: FunnelStats = computeFunnel(applications)

  return (
    <section className="card">
      <div className="flex items-stretch px-6 py-6">
        <StatCell value={stats.applied} label="已投递" sublabel="累计" />
        <Divider />
        <StatCell value={stats.written} label="笔试" />
        <Divider />
        <StatCell value={stats.first} label="一面" />
        <Divider />
        <StatCell value={stats.second} label="二面" />
        <Divider />
        <StatCell value={stats.third} label="三面" />
        <Divider />
        <StatCell value={stats.offer} label="Offer" highlight />
        <Divider />
        <StatCell value={stats.rejected} label="已拒绝" />
      </div>
      <div className="flex items-center gap-3 border-t border-border-soft px-6 py-3 text-xs text-ink-2">
        <span className="font-mono">
          回复率 <span className="text-ink-1 num">{stats.replyRate.toFixed(1)}%</span>
        </span>
        <span className="text-ink-3">·</span>
        <span className="font-mono">
          进面率 <span className="text-ink-1 num">{stats.interviewRate.toFixed(1)}%</span>
        </span>
        <span className="text-ink-3">·</span>
        <span className="font-mono">
          Offer 率 <span className="text-ink-1 num">{stats.offerRate.toFixed(1)}%</span>
        </span>
      </div>
    </section>
  )
}

function Divider() {
  return <div className="mx-4 w-px self-stretch bg-border-soft" />
}
