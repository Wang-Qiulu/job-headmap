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
  planned: 'Planned',
  applied: 'Applied',
  written: 'Written',
  '1st': '1st Round',
  '2nd': '2nd Round',
  '3rd': '3rd Round',
  offer: 'Offer',
  rejected: 'Rejected',
}

// Status groups used in the funnel / heatmap-counting logic
export const INTERVIEW_STATUSES: Status[] = ['1st', '2nd', '3rd']
export const ACTIVE_STATUSES: Status[] = [
  'planned',
  'applied',
  'written',
  ...INTERVIEW_STATUSES,
  'offer',
]
export const TERMINAL_STATUSES: Status[] = ['offer', 'rejected']

// ─────────────────────────────────────────────────────────
// Schemas
// ─────────────────────────────────────────────────────────
export const StatusChangeSchema = z.object({
  status: z.enum(STATUSES),
  changedAt: z.string().datetime(),
})

export const ApplicationSchema = z.object({
  id: z.string().uuid(),
  company: z.string().min(1, 'Company required'),
  position: z.string().min(1, 'Position required'),
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
