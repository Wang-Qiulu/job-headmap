import { useMemo, useState, useRef, useEffect } from 'react'
import {
  addDays,
  addWeeks,
  endOfWeek,
  format,
  isSameDay,
  parseISO,
  startOfWeek,
  subWeeks,
} from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Calendar, Briefcase, Clock, TrendingUp } from 'lucide-react'
import { buildHeatmap, computeStreak, getHeatmapLevel, cn, type HeatmapMode } from '@/lib/utils'
import type { Application, Status } from '@/types'
import { INTERVIEW_STATUSES, STATUS_LABEL } from '@/types'

const PAST_WEEKS = 12
const FUTURE_WEEKS = 3
const TOTAL_WEEKS = PAST_WEEKS + 1 + FUTURE_WEEKS // 16
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

const DAY_LABELS = ['', '一', '', '三', '', '五', '']

export function Heatmap({ applications }: HeatmapProps) {
  const [mode, setMode] = useState<HeatmapMode>('applications')
  const [hover, setHover] = useState<HoverState | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { weeks, heatmap, totals, streak, monthLabels } = useMemo(() => {
    const today = new Date()
    const gridEnd = endOfWeek(addWeeks(today, FUTURE_WEEKS), { weekStartsOn: 0 })
    const gridStart = startOfWeek(subWeeks(today, PAST_WEEKS), { weekStartsOn: 0 })

    const days: Date[] = []
    for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) days.push(d)

    const heatmap = buildHeatmap(applications, TOTAL_WEEKS * 7, mode)
    const totals = Array.from(heatmap.values()).reduce((a, b) => a + b, 0)
    const streak = computeStreak(heatmap)

    // Group into weeks (column-major)
    const weeks: Date[][] = []
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7))
    }

    // Month label: show "M月" on the first week whose first day starts a new month
    const labels: (string | null)[] = []
    let lastMonth = -1
    weeks.forEach((week) => {
      const d = week[0]
      if (d && d.getMonth() !== lastMonth) {
        lastMonth = d.getMonth()
        labels.push(format(d, 'M月'))
      } else {
        labels.push(null)
      }
    })

    return { weeks, heatmap, totals, streak, monthLabels: labels }
  }, [applications, mode])

  // ── Right panel: weekly summary + recent activity ──
  const { thisWeekApplied, thisWeekInterviews, recentActivities } = useMemo(() => {
    const today = new Date()
    const ws = format(startOfWeek(today, { weekStartsOn: 0 }), 'yyyy-MM-dd')
    const we = format(endOfWeek(today, { weekStartsOn: 0 }), 'yyyy-MM-dd')

    const thisWeekApplied = applications.filter((a) => a.applyDate >= ws && a.applyDate <= we).length
    const thisWeekInterviews = applications.reduce((sum, a) => {
      return (
        sum +
        a.statusHistory.filter((h) => {
          const day = format(parseISO(h.changedAt), 'yyyy-MM-dd')
          return INTERVIEW_STATUSES.includes(h.status as Status) && day >= ws && day <= we
        }).length
      )
    }, 0)

    const EXCLUDE_STATUSES: Status[] = ['planned', 'applied']

    const all: { changedAt: string; company: string; position: string; from: Status; to: Status }[] = []
    for (const a of applications) {
      const history = a.statusHistory
      for (let i = 1; i < history.length; i++) {
        const to = history[i].status as Status
        if (EXCLUDE_STATUSES.includes(to)) continue
        all.push({
          changedAt: history[i].changedAt,
          company: a.company,
          position: a.position,
          from: history[i - 1].status as Status,
          to,
        })
      }
    }

    all.sort((a, b) => b.changedAt.localeCompare(a.changedAt))

    return { thisWeekApplied, thisWeekInterviews, recentActivities: all.slice(0, 5) }
  }, [applications])

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
            次{mode === 'applications' ? '投递' : '面试'} · 近 4 个月
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-xs text-ink-2">
            <Flame size={12} className="text-ink-3" />
            <span className="font-mono">
              最长连续{' '}
              <span className="text-ink-1 num">{streak.longest}</span> 天
            </span>
          </div>
        </div>
      </div>

      {/* Body — split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* ── Left: Heatmap ── */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 px-6 pt-4">
            <SegmentedControl
              value={mode}
              onChange={setMode}
              options={[
                {
                  value: 'applications',
                  label: '投递',
                  icon: <Briefcase size={11} />,
                },
                {
                  value: 'interviews',
                  label: '面试',
                  icon: <Calendar size={11} />,
                },
              ]}
            />
          </div>

          <div className="px-6 py-5">
            <div ref={containerRef} className="relative">
              <div className="flex w-full items-stretch gap-x-2">
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
                  <div
                    className="mb-1.5 grid"
                    style={{
                      gridTemplateColumns: `repeat(${TOTAL_WEEKS}, minmax(0, 22px))`,
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

                  <div
                    className="grid"
                    style={{
                      gridTemplateColumns: `repeat(${TOTAL_WEEKS}, minmax(0, 22px))`,
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
              <div className="mt-5 ml-8 flex items-center justify-start gap-1.5 text-[10px] text-ink-3">
                <span className="font-mono">少</span>
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
                <span className="font-mono">多</span>
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
                    <div className="text-ink-1">
                      <span className="num font-mono">{hover.count}</span>{' '}
                      <span className="font-mono">次</span>
                    </div>
                    <div className="font-mono text-[10px] text-ink-3">
                      {format(parseISO(hover.date), 'yyyy年M月d日')}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ── Right: Weekly Overview ── */}
        <div className="border-l border-border-soft px-5 py-4">
          <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-ink-3">
            <TrendingUp size={12} />
            本周概要
          </div>

          {/* Mini stats */}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border px-3 py-3">
              <div className="num font-mono text-sm font-semibold text-ink-1">{thisWeekApplied}</div>
              <div className="text-sm text-ink-2">本周投递</div>
            </div>
            <div className="rounded-lg border border-border px-3 py-3">
              <div className="num font-mono text-sm font-semibold text-ink-1">{thisWeekInterviews}</div>
              <div className="text-sm text-ink-2">本周面试</div>
            </div>
          </div>

          {/* Recent activity */}
          <div className="mt-5">
            <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-ink-3">
              <Clock size={12} />
              最近动态
            </div>

            {recentActivities.length === 0 ? (
              <p className="mt-3 text-xs text-ink-3">本周暂无动态</p>
            ) : (
              <div className="mt-2 space-y-2">
                {recentActivities.map((item, i) => (
                  <div
                    key={i}
                    className="flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-bg-soft"
                  >
                    <span className="shrink-0 font-mono text-xs text-ink-3">
                      {format(parseISO(item.changedAt), 'MM-dd')}
                    </span>
                    <span className="font-mono text-ink-3">·</span>
                    <span className="font-medium text-ink-1">{item.company}</span>
                    <span className="font-mono text-ink-3">·</span>
                    <span className="text-ink-2">{item.position}</span>
                    <span className="shrink-0 rounded bg-bg-mute px-1 py-0.5 font-mono text-xs text-ink-2">
                      {STATUS_LABEL[item.from]} → {STATUS_LABEL[item.to]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
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
              'inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-sm font-medium transition-colors',
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
