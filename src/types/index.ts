import { z } from 'zod'

// ─────────────────────────────────────────────────────────
// Status — 8 stages, single source of truth
// ─────────────────────────────────────────────────────────
export const STATUSES = [
  'planned',
  'applied',
  'written',
  '1st',
  '2nd',
  '3rd',
  'offer',
  'rejected',
] as const

export type Status = (typeof STATUSES)[number]

export const STATUS_LABEL: Record<Status, string> = {
  planned: '计划中',
  applied: '已投递',
  written: '笔试',
  '1st': '一面',
  '2nd': '二面',
  '3rd': '三面',
  offer: 'Offer',
  rejected: '已拒绝',
}

// Status groups used in the funnel / heatmap-counting logic
export const INTERVIEW_STATUSES: Status[] = ['1st', '2nd', '3rd']

// Statuses that represent a closed loop — used to gate "re-open" actions
export const TERMINAL_STATUSES: Status[] = ['offer', 'rejected']

// Legal next-state transitions. Direction rules:
//   - planned / applied: can jump directly to any later state
//   - written: cannot go back to planned / applied
//   - 1st / 2nd / 3rd (interview): cannot go backward
//   - offer: locked except to rejected
//   - rejected: explicit re-apply path back to applied
// Skipping intermediate stages (e.g. no written → 1st, no 2nd → offer) is OK.
export const STATUS_TRANSITIONS: Record<Status, readonly Status[]> = {
  planned: ['applied', 'written', '1st', '2nd', '3rd', 'offer', 'rejected'],
  applied: ['written', '1st', '2nd', '3rd', 'offer', 'rejected'],
  written: ['1st', '2nd', '3rd', 'offer', 'rejected'],
  '1st': ['2nd', '3rd', 'offer', 'rejected'],
  '2nd': ['3rd', 'offer', 'rejected'],
  '3rd': ['offer', 'rejected'],
  offer: ['rejected'],
  rejected: ['applied'],
}

export function isValidTransition(from: Status, to: Status): boolean {
  if (from === to) return true
  return STATUS_TRANSITIONS[from].includes(to)
}

// ─────────────────────────────────────────────────────────
// Schemas
// ─────────────────────────────────────────────────────────
export const StatusChangeSchema = z.object({
  status: z.enum(STATUSES),
  changedAt: z.string().datetime(),
})

export const ApplicationSchema = z.object({
  id: z.string().uuid(),
  company: z.string().min(1, '公司必填'),
  position: z.string().min(1, '职位必填'),
  applyDate: z.string(), // ISO date YYYY-MM-DD
  status: z.enum(STATUSES),
  statusHistory: z.array(StatusChangeSchema).min(1),
  url: z.string().url().or(z.literal('')).optional(),
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type Application = z.infer<typeof ApplicationSchema>
export type StatusChange = z.infer<typeof StatusChangeSchema>

// ─────────────────────────────────────────────────────────
// Storage schema (versioned for future migrations)
// ─────────────────────────────────────────────────────────
export const STORAGE_VERSION = 1

export const StorageSchema = z.object({
  version: z.number(),
  applications: z.array(ApplicationSchema),
})
