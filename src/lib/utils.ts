import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, parseISO, startOfDay, subDays } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { Application, Status } from '@/types'
import { INTERVIEW_STATUSES } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─────────────────────────────────────────────────────────
// Date helpers
// ─────────────────────────────────────────────────────────
export function toISODate(d: Date | string): string {
  const date = typeof d === 'string' ? parseISO(d) : d
  return format(date, 'yyyy-MM-dd')
}

export function toISODateTime(d: Date | string = new Date()): string {
  const date = typeof d === 'string' ? parseISO(d) : d
  return date.toISOString()
}

export function formatDate(iso: string, fmt = 'yyyy-MM-dd'): string {
  try {
    return format(parseISO(iso), fmt)
  } catch {
    return iso
  }
}

export function formatRelative(iso: string): string {
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true, locale: zhCN })
  } catch {
    return iso
  }
}

export function formatDateTime(iso: string): string {
  try {
    return format(parseISO(iso), 'yyyy年M月d日 · HH:mm')
  } catch {
    return iso
  }
}

// ─────────────────────────────────────────────────────────
// Heatmap level (5 tiers: 0-4)
// ─────────────────────────────────────────────────────────
export function getHeatmapLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0
  if (count === 1) return 1
  if (count <= 3) return 2
  if (count <= 5) return 3
  return 4
}

// ─────────────────────────────────────────────────────────
// Heatmap aggregation
// ─────────────────────────────────────────────────────────
export type HeatmapMode = 'applications' | 'interviews'

/**
 * Build a Map<dateISO, count> from applications for the last `days` days.
 * - "applications" counts every application with applyDate == that day.
 * - "interviews" counts every status change to a 1st/2nd/3rd round on that day.
 */
export function buildHeatmap(
  applications: Application[],
  days: number,
  mode: HeatmapMode,
): Map<string, number> {
  const map = new Map<string, number>()

  if (mode === 'applications') {
    for (const app of applications) {
      if (!app.applyDate) continue
      map.set(app.applyDate, (map.get(app.applyDate) ?? 0) + 1)
    }
  } else {
    for (const app of applications) {
      for (const change of app.statusHistory) {
        if (!INTERVIEW_STATUSES.includes(change.status as Status)) continue
        const day = change.changedAt.slice(0, 10) // YYYY-MM-DD
        map.set(day, (map.get(day) ?? 0) + 1)
      }
    }
  }

  // Ensure every day in the window exists with at least 0
  const today = startOfDay(new Date())
  for (let i = 0; i < days; i++) {
    const d = subDays(today, i)
    const key = toISODate(d)
    if (!map.has(key)) map.set(key, 0)
  }
  return map
}

// ─────────────────────────────────────────────────────────
// Funnel — cumulative, history-based
// ─────────────────────────────────────────────────────────
// A record's statusHistory lists every status it has *reached*. The funnel
// counts, for each stage, how many applications have ever touched that
// stage — regardless of where they are now. So a record that went
// planned → applied → written → 1st contributes +1 to planned, applied,
// written, AND 1st, not just the current snapshot.
export interface FunnelStats {
  /** Cumulative count: how many applications ever reached "已投递". */
  applied: number
  written: number
  first: number
  second: number
  third: number
  offer: number
  rejected: number
  /** 回复率: deduped apps that reached written OR any interview / offer stage. */
  replyRate: number
  /** 进面率: deduped apps that ever reached 1st round. */
  interviewRate: number
  /** Offer 率: deduped apps that ever reached offer. */
  offerRate: number
}

export function computeFunnel(apps: Application[]): FunnelStats {
  const counts: Record<Status, number> = {
    planned: 0,
    applied: 0,
    written: 0,
    '1st': 0,
    '2nd': 0,
    '3rd': 0,
    offer: 0,
    rejected: 0,
  }

  // Deduped ID-sets: count each application only once per rate metric
  const repliedIds = new Set<string>()
  const interviewedIds = new Set<string>()
  const offerIds = new Set<string>()

  for (const app of apps) {
    const reached = new Set<Status>()
    reached.add(app.status)
    for (const h of app.statusHistory) reached.add(h.status)
    for (const s of reached) counts[s]++

    // 回复率：到达过笔试或任意面试/offer 阶段（同一应用多阶段只计 1 次）
    if (
      reached.has('written') ||
      reached.has('1st') ||
      reached.has('2nd') ||
      reached.has('3rd') ||
      reached.has('offer')
    ) {
      repliedIds.add(app.id)
    }

    // 进面率：到达过一面
    if (reached.has('1st')) {
      interviewedIds.add(app.id)
    }

    // Offer 率：到达过 offer
    if (reached.has('offer')) {
      offerIds.add(app.id)
    }
  }

  const applied = counts.applied
  return {
    applied,
    written: counts.written,
    first: counts['1st'],
    second: counts['2nd'],
    third: counts['3rd'],
    offer: counts.offer,
    rejected: counts.rejected,
    replyRate: applied > 0 ? (repliedIds.size / applied) * 100 : 0,
    interviewRate: applied > 0 ? (interviewedIds.size / applied) * 100 : 0,
    offerRate: applied > 0 ? (offerIds.size / applied) * 100 : 0,
  }
}

// ─────────────────────────────────────────────────────────
// Streak — consecutive days from today backwards with >=1 activity
// ─────────────────────────────────────────────────────────
export function computeStreak(heatmap: Map<string, number>): {
  current: number
  longest: number
} {
  const today = startOfDay(new Date())
  let current = 0
  let cursor = new Date(today)
  while (true) {
    const key = toISODate(cursor)
    const count = heatmap.get(key) ?? 0
    if (count > 0) {
      current++
      cursor = subDays(cursor, 1)
    } else {
      break
    }
  }

  // Longest streak in the map (simple linear scan over sorted keys)
  const sortedKeys = Array.from(heatmap.keys()).sort()
  let longest = 0
  let run = 0
  let prev: Date | null = null
  for (const key of sortedKeys) {
    const d = parseISO(key)
    const count = heatmap.get(key) ?? 0
    if (count === 0) {
      run = 0
      prev = d
      continue
    }
    if (prev && Math.round((d.getTime() - prev.getTime()) / 86_400_000) === 1) {
      run++
    } else {
      run = 1
    }
    if (run > longest) longest = run
    prev = d
  }
  return { current, longest: Math.max(longest, current) }
}
