import { useMemo, useState, useRef, useEffect } from 'react'
import {
  addDays,
  endOfWeek,
  format,
  isSameDay,
  parseISO,
  startOfWeek,
  subWeeks,
} from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Calendar, Briefcase } from 'lucide-react'
import { buildHeatmap, computeStreak, getHeatmapLevel, cn, type HeatmapMode } from '@/lib/utils'
import type { Application } from '@/types'

const WEEKS = 26
const GAP = 3

interface HeatmapProps {
  applications: Application[]
}

interface HoverState {
  date: string
  count: number
  x: number
  y: number
}

const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', '']

export function Heatmap({ applications }: HeatmapProps) {
  const [mode, setMode] = useState<HeatmapMode>('applications')
  const [hover, setHover] = useState<HoverState | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { weeks, heatmap, totals, streak, monthLabels } = useMemo(() => {
    const today = new Date()
    const gridEnd = endOfWeek(today, { weekStartsOn: 0 })
    const gridStart = startOfWeek(subWeeks(gridEnd, WEEKS - 1), { weekStartsOn: 0 })

    const days: Date[] = []
    for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) days.push(d)

    const heatmap = buildHeatmap(applications, WEEKS * 7, mode)
    const totals = Array.from(heatmap.values()).reduce((a, b) => a + b, 0)
    const streak = computeStreak(heatmap)

    // Group into weeks (column-major)
    const weeks: Date[][] = []
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7))
    }

    // Month label: show "MMM" on the first week whose first day starts a new month
    const labels: (string | null)[] = []
    let lastMonth = -1
    weeks.forEach((week) => {
      const d = week[0]
      if (d && d.getMonth() !== lastMonth) {
        lastMonth = d.getMonth()
        labels.push(format(d, 'MMM'))
      } else {
        labels.push(null)
      }
    })

    return { weeks, heatmap, totals, streak, monthLabels: labels }
  }, [applications, mode])

  // Track mouse for tooltip positioning
  useEffect(() => {
    if (!hover) return
    const onMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      setHover((h) =>
        h ? { ...h, x: e.clientX - rect.left, y: e.clientY - rect.top } : h,
      )
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [hover])

  return (
    <section className="card">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-soft px-6 py-4">
        <div className="flex items-baseline gap-2">
          <span className="num font-mono text-2xl font-semibold tracking-tight text-ink-1">
            {totals}
          </span>
          <span className="text-sm text-ink-2">
            {mode === 'applications' ? 'applications' : 'interviews'} in the last 6 months
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-xs text-ink-2">
            <Flame size={12} className="text-ink-3" />
            <span className="font-mono">
              Longest streak{' '}
              <span className="text-ink-1 num">{streak.longest}</span> days
            </span>
          </div>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex items-center gap-2 px-6 pt-4">
        <SegmentedControl
          value={mode}
          onChange={setMode}
          options={[
            {
              value: 'applications',
              label: 'Applications',
              icon: <Briefcase size={11} />,
            },
            {
              value: 'interviews',
              label: 'Interviews',
              icon: <Calendar size={11} />,
            },
          ]}
        />
      </div>

      {/* Heatmap grid */}
      <div className="px-6 py-5">
        <div ref={containerRef} className="relative">
          <div className="flex w-full items-stretch gap-x-2">
            {/* Day-of-week labels — grid rows stretch to match the cell rows */}
            <div
              className="grid shrink-0 grid-rows-7"
              style={{ width: 24, rowGap: `${GAP}px` }}
            >
              {DAY_LABELS.map((label, i) => (
                <div
                  key={i}
                  className="flex items-center text-[10px] font-mono uppercase tracking-wider text-ink-3"
                  style={{ lineHeight: 1 }}
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="flex-1 min-w-0">
              {/* Month labels — share the same column template as the cells */}
              <div
                className="mb-1.5 grid"
                style={{
                  gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))`,
                  columnGap: `${GAP}px`,
                }}
              >
                {monthLabels.map((label, i) => (
                  <div
                    key={i}
                    className="truncate text-[10px] font-mono uppercase tracking-wider text-ink-3"
                  >
                    {label ?? ''}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div
                className="grid"
                style={{
                  gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))`,
                  columnGap: `${GAP}px`,
                }}
                onMouseLeave={() => setHover(null)}
              >
                {weeks.map((week, wi) => (
                  <div
                    key={wi}
                    className="grid grid-rows-7"
                    style={{ rowGap: `${GAP}px` }}
                  >
                    {week.map((day) => {
                      const dateISO = format(day, 'yyyy-MM-dd')
                      const count = heatmap.get(dateISO) ?? 0
                      const level = getHeatmapLevel(count)
                      const isToday = isSameDay(day, new Date())
                      return (
                        <div
                          key={dateISO}
                          onMouseEnter={(e) => {
                            const rect = containerRef.current!.getBoundingClientRect()
                            setHover({
                              date: dateISO,
                              count,
                              x: e.clientX - rect.left,
                              y: e.clientY - rect.top,
                            })
                          }}
                          className={cn(
                            'aspect-square w-full rounded-[2px] transition-all duration-150',
                            level === 0 && 'bg-heatmap-0',
                            level === 1 && 'bg-heatmap-1',
                            level === 2 && 'bg-heatmap-2',
                            level === 3 && 'bg-heatmap-3',
                            level === 4 && 'bg-heatmap-4',
                            isToday && 'ring-1 ring-ink-1 ring-inset',
                            'hover:scale-110 hover:ring-1 hover:ring-ink-1 hover:ring-inset',
                          )}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center justify-end gap-1.5 text-[10px] text-ink-3">
            <span className="font-mono">Less</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={cn(
                  'h-3 w-3 rounded-[2px]',
                  level === 0 && 'bg-heatmap-0',
                  level === 1 && 'bg-heatmap-1',
                  level === 2 && 'bg-heatmap-2',
                  level === 3 && 'bg-heatmap-3',
                  level === 4 && 'bg-heatmap-4',
                )}
              />
            ))}
            <span className="font-mono">More</span>
          </div>

          {/* Tooltip */}
          <AnimatePresence>
            {hover && (
              <motion.div
                initial={{ opacity: 0, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -2 }}
                transition={{ duration: 0.1 }}
                className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border border-border bg-bg px-2.5 py-1.5 text-xs shadow-lg"
                style={{
                  left: hover.x,
                  top: hover.y - 8,
                }}
              >
                <div className="font-mono text-ink-1 num">
                  {hover.count} {hover.count === 1 ? 'contribution' : 'contributions'}
                </div>
                <div className="font-mono text-[10px] text-ink-3">
                  {format(parseISO(hover.date), 'MMMM d, yyyy')}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────
// Segmented control — small, on-brand toggle
// ─────────────────────────────────────────────────────────
interface SegmentedOption<T extends string> {
  value: T
  label: string
  icon?: React.ReactNode
}

function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: SegmentedOption<T>[]
}) {
  return (
    <div className="inline-flex items-center rounded-md border border-border bg-bg-mute p-0.5">
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium transition-colors',
              active
                ? 'bg-ink-1 text-bg'
                : 'text-ink-2 hover:text-ink-1',
            )}
          >
            {opt.icon}
            <span className="font-mono">{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}
