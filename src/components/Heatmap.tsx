import { useMemo, useState, useRef, useEffect } from 'react'
import {
  addDays,
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  parseISO,
  startOfWeek,
  subWeeks,
} from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Calendar, Briefcase } from 'lucide-react'
import { buildHeatmap, computeStreak, getHeatmapLevel, type HeatmapMode } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Application } from '@/types'

const DAYS = 26 * 7 // ~26 weeks (6 months) — backfill to whole weeks
const CELL = 12
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

export function Heatmap({ applications }: HeatmapProps) {
  const [mode, setMode] = useState<HeatmapMode>('applications')
  const [hover, setHover] = useState<HoverState | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Build the heatmap data over the last 26 weeks
  const { grid, heatmap, totals, streak, monthLabels } = useMemo(() => {
    const today = new Date()
    // End the grid on the Saturday of the current week
    const gridEnd = endOfWeek(today, { weekStartsOn: 0 })
    const gridStart = startOfWeek(subWeeks(gridEnd, 25), { weekStartsOn: 0 })
    const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

    const heatmap = buildHeatmap(applications, DAYS, mode)
    const totals = Array.from(heatmap.values()).reduce((a, b) => a + b, 0)
    const streak = computeStreak(heatmap)

    // Build month labels by scanning week columns
    const monthLabels: Array<{ weekIndex: number; label: string }> = []
    let lastMonth = -1
    days.forEach((d, i) => {
      const weekIndex = Math.floor(i / 7)
      if (i % 7 === 0 && d.getMonth() !== lastMonth) {
        lastMonth = d.getMonth()
        monthLabels.push({ weekIndex, label: format(d, "MMM ''yy") })
      }
    })

    return { grid: days, heatmap, totals, streak, monthLabels }
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
        <div ref={containerRef} className="relative inline-block">
          {/* Month labels */}
          <div
            className="ml-7 mb-1.5 grid"
            style={{
              gridTemplateColumns: `repeat(${grid.length / 7}, ${CELL}px)`,
              columnGap: `${GAP}px`,
            }}
          >
            {Array.from({ length: grid.length / 7 }).map((_, weekIndex) => {
              const month = monthLabels.find((m) => m.weekIndex === weekIndex)
              return (
                <div key={weekIndex} className="h-3 text-[10px] font-mono text-ink-3">
                  {month ? month.label : ''}
                </div>
              )
            })}
          </div>

          {/* Grid: 7 rows × N weeks */}
          <div className="flex gap-0">
            {/* Day-of-week labels */}
            <div className="mr-2 flex flex-col" style={{ rowGap: `${GAP}px` }}>
              {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((label, i) => (
                <div
                  key={i}
                  className="text-[10px] font-mono text-ink-3"
                  style={{ height: `${CELL}px`, lineHeight: `${CELL}px` }}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div
              className="grid"
              style={{
                gridTemplateRows: `repeat(7, ${CELL}px)`,
                gridAutoFlow: 'column',
                columnGap: `${GAP}px`,
                rowGap: `${GAP}px`,
              }}
              onMouseLeave={() => setHover(null)}
            >
              {grid.map((day) => {
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
                      'rounded-[2px] transition-all duration-150',
                      level === 0 && 'bg-heatmap-0',
                      level === 1 && 'bg-heatmap-1',
                      level === 2 && 'bg-heatmap-2',
                      level === 3 && 'bg-heatmap-3',
                      level === 4 && 'bg-heatmap-4',
                      isToday && 'ring-1 ring-ink-1 ring-inset',
                      'hover:scale-110 hover:ring-1 hover:ring-ink-1 hover:ring-inset',
                    )}
                    style={{ width: CELL, height: CELL }}
                  />
                )
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-ink-3">
            <span className="font-mono">Less</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={cn(
                  'rounded-[2px]',
                  level === 0 && 'bg-heatmap-0',
                  level === 1 && 'bg-heatmap-1',
                  level === 2 && 'bg-heatmap-2',
                  level === 3 && 'bg-heatmap-3',
                  level === 4 && 'bg-heatmap-4',
                )}
                style={{ width: CELL, height: CELL }}
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

// helper used elsewhere if needed
export const _addDays = addDays
