import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { v4 as uuid } from 'uuid'
import {
  STORAGE_VERSION,
  StorageSchema,
  isValidTransition,
  type Application,
  type Status,
} from '@/types'
import { toISODate, toISODateTime } from '@/lib/utils'
import { createAppStorage } from '@/lib/persistStorage'

const STORAGE_KEY = 'job-dashboard:v1'

// ─────────────────────────────────────────────────────────
// Sample seed data so a fresh visit feels alive
// ─────────────────────────────────────────────────────────
function buildSampleData(): Application[] {
  const now = new Date()
  const today = toISODate(now)
  const yesterday = toISODate(new Date(now.getTime() - 86_400_000))
  const threeDaysAgo = toISODate(new Date(now.getTime() - 3 * 86_400_000))
  const weekAgo = toISODate(new Date(now.getTime() - 7 * 86_400_000))
  const twoWeeksAgo = toISODate(new Date(now.getTime() - 14 * 86_400_000))
  const monthAgo = toISODate(new Date(now.getTime() - 30 * 86_400_000))

  return [
    {
      id: uuid(),
      company: 'ByteDance',
      position: 'Senior Frontend Engineer',
      applyDate: threeDaysAgo,
      status: '1st',
      statusHistory: [
        { status: 'applied', changedAt: toISODateTime(new Date(now.getTime() - 3 * 86_400_000)) },
        { status: '1st', changedAt: toISODateTime(new Date(now.getTime() - 1 * 86_400_000)) },
      ],
      url: 'https://jobs.bytedance.com',
      notes: 'Recruiter: Sarah\nReferral: yes\nNext: take-home by Fri',
      createdAt: toISODateTime(),
      updatedAt: toISODateTime(),
    },
    {
      id: uuid(),
      company: 'Anthropic',
      position: 'Design Engineer',
      applyDate: weekAgo,
      status: 'written',
      statusHistory: [
        { status: 'applied', changedAt: toISODateTime(new Date(now.getTime() - 7 * 86_400_000)) },
        { status: 'written', changedAt: toISODateTime(new Date(now.getTime() - 2 * 86_400_000)) },
      ],
      url: 'https://anthropic.com/careers',
      notes: 'Take-home: 4h design system implementation',
      createdAt: toISODateTime(),
      updatedAt: toISODateTime(),
    },
    {
      id: uuid(),
      company: 'Vercel',
      position: 'Software Engineer',
      applyDate: twoWeeksAgo,
      status: 'applied',
      statusHistory: [
        { status: 'applied', changedAt: toISODateTime(new Date(now.getTime() - 14 * 86_400_000)) },
      ],
      url: '',
      notes: '',
      createdAt: toISODateTime(),
      updatedAt: toISODateTime(),
    },
    {
      id: uuid(),
      company: 'Linear',
      position: 'Frontend Engineer',
      applyDate: monthAgo,
      status: 'offer',
      statusHistory: [
        { status: 'applied', changedAt: toISODateTime(new Date(now.getTime() - 30 * 86_400_000)) },
        { status: 'written', changedAt: toISODateTime(new Date(now.getTime() - 25 * 86_400_000)) },
        { status: '1st', changedAt: toISODateTime(new Date(now.getTime() - 20 * 86_400_000)) },
        { status: '2nd', changedAt: toISODateTime(new Date(now.getTime() - 10 * 86_400_000)) },
        { status: 'offer', changedAt: toISODateTime(new Date(now.getTime() - 1 * 86_400_000)) },
      ],
      url: 'https://linear.app/careers',
      notes: '🎉',
      createdAt: toISODateTime(),
      updatedAt: toISODateTime(),
    },
    {
      id: uuid(),
      company: 'Stripe',
      position: 'SWE, Payments',
      applyDate: yesterday,
      status: 'applied',
      statusHistory: [
        { status: 'applied', changedAt: toISODateTime(new Date(now.getTime() - 86_400_000)) },
      ],
      url: '',
      notes: '',
      createdAt: toISODateTime(),
      updatedAt: toISODateTime(),
    },
    {
      id: uuid(),
      company: 'Figma',
      position: 'Web Engineer',
      applyDate: today,
      status: 'planned',
      statusHistory: [
        { status: 'planned', changedAt: toISODateTime() },
      ],
      url: '',
      notes: 'Draft cover letter',
      createdAt: toISODateTime(),
      updatedAt: toISODateTime(),
    },
  ]
}

// ─────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────
interface AppState {
  applications: Application[]
  hasHydrated: boolean

  // actions
  addApplication: (input: Omit<Application, 'id' | 'statusHistory' | 'createdAt' | 'updatedAt'>) => Application
  // status changes go through `changeStatus` so the timeline is appended —
  // updateApplication's type forbids `status` to make that a compile error.
  updateApplication: (id: string, patch: Partial<Omit<Application, 'id' | 'createdAt' | 'status'>>) => void
  changeStatus: (id: string, status: Status, changedAt?: string) => void
  deleteApplication: (id: string) => void
  clearAll: () => void
  loadSampleData: () => void
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      applications: buildSampleData(),
      hasHydrated: false,

      addApplication: (input) => {
        const now = toISODateTime()
        const app: Application = {
          id: uuid(),
          ...input,
          statusHistory: [{ status: input.status, changedAt: now }],
          createdAt: now,
          updatedAt: now,
        }
        set((s) => ({ applications: [app, ...s.applications] }))
        return app
      },

      updateApplication: (id, patch) => {
        set((s) => ({
          applications: s.applications.map((a) =>
            a.id === id
              ? { ...a, ...patch, updatedAt: toISODateTime() }
              : a,
          ),
        }))
      },

      changeStatus: (id, status, changedAt) => {
        set((s) => ({
          applications: s.applications.map((a) => {
            if (a.id !== id) return a
            if (a.status === status) return a
            if (!isValidTransition(a.status, status)) {
              throw new Error(`非法状态转换: ${a.status} → ${status}`)
            }
            const at = changedAt ?? toISODateTime()
            return {
              ...a,
              status,
              updatedAt: at,
              statusHistory: [
                ...a.statusHistory,
                { status, changedAt: at },
              ],
            }
          }),
        }))
      },

      deleteApplication: (id) => {
        set((s) => ({ applications: s.applications.filter((a) => a.id !== id) }))
      },

      clearAll: () => set({ applications: [] }),

      loadSampleData: () => set({ applications: buildSampleData() }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => createAppStorage()),
      version: STORAGE_VERSION,
      // Persist only the application list; transient flags like hasHydrated stay in memory.
      partialize: (s) => ({ applications: s.applications }),
      onRehydrateStorage: () => (state, error) => {
        if (error || !state) return
        // Validate on rehydrate; drop corrupt entries silently
        const result = StorageSchema.safeParse({
          version: STORAGE_VERSION,
          applications: state.applications ?? [],
        })
        state.applications = result.success ? result.data.applications : []
        state.hasHydrated = true
      },
    },
  ),
)

// First-launch bootstrap: if storage is empty, flush the in-code sample data
// once after hydrate finishes so the user sees fixtures on next start and the
// data file actually appears under app_data_dir(). Best-effort: errors swallowed.
void (async () => {
  if (typeof window === 'undefined') return
  try {
    const raw = await createAppStorage().getItem(STORAGE_KEY)
    if (raw != null) return

    // No-op set re-triggers persist write with current state -> creates data.json.
    const flush = () =>
      useStore.setState({ applications: useStore.getState().applications })

    // hydrate may already be done (subscribe only fires on FUTURE changes), so
    // check the current state first; otherwise wait for the hasHydrated flip.
    if (useStore.getState().hasHydrated) {
      flush()
    } else {
      const unsub = useStore.subscribe((s) => {
        if (!s.hasHydrated) return
        unsub()
        flush()
      })
    }
  } catch {
    /* best-effort */
  }
})()
