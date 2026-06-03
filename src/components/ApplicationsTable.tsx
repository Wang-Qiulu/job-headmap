import { useMemo, useState } from 'react'
import { Pencil, Trash2, Search } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useStore } from '@/store/useStore'
import { StatusDropdown } from './StatusDropdown'
import { STATUSES, STATUS_LABEL, type Application, type Status } from '@/types'
import { cn } from '@/lib/utils'
import { toast } from './Toast'

interface ApplicationsTableProps {
  search: string
  onEdit: (app: Application) => void
}

type SortKey = 'applyDate' | 'company' | 'position' | 'status'
type SortDir = 'asc' | 'desc'

const STATUS_FILTERS: Array<{ value: Status | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'applied', label: STATUS_LABEL.applied },
  { value: 'written', label: STATUS_LABEL.written },
  { value: '1st', label: STATUS_LABEL['1st'] },
  { value: '2nd', label: STATUS_LABEL['2nd'] },
  { value: '3rd', label: STATUS_LABEL['3rd'] },
  { value: 'offer', label: STATUS_LABEL.offer },
  { value: 'rejected', label: STATUS_LABEL.rejected },
]

const statusRank: Record<Status, number> = {
  planned: 0,
  applied: 1,
  written: 2,
  '1st': 3,
  '2nd': 4,
  '3rd': 5,
  offer: 6,
  rejected: 7,
}

export function ApplicationsTable({ search, onEdit }: ApplicationsTableProps) {
  const applications = useStore((s) => s.applications)
  const changeStatus = useStore((s) => s.changeStatus)
  const deleteApplication = useStore((s) => s.deleteApplication)

  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all')
  const [sortKey, setSortKey] = useState<SortKey>('applyDate')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 20

  // Count per status (for the filter chip badges)
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: applications.length }
    for (const s of STATUSES) c[s] = 0
    for (const app of applications) c[app.status]++
    return c
  }, [applications])

  // Filter + sort
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = applications
    if (statusFilter !== 'all') list = list.filter((a) => a.status === statusFilter)
    if (q) {
      list = list.filter(
        (a) =>
          a.company.toLowerCase().includes(q) ||
          a.position.toLowerCase().includes(q) ||
          (a.notes ?? '').toLowerCase().includes(q),
      )
    }
    const sorted = [...list].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'applyDate') cmp = a.applyDate.localeCompare(b.applyDate)
      else if (sortKey === 'company') cmp = a.company.localeCompare(b.company)
      else if (sortKey === 'position') cmp = a.position.localeCompare(b.position)
      else if (sortKey === 'status') cmp = statusRank[a.status] - statusRank[b.status]
      return sortDir === 'asc' ? cmp : -cmp
    })
    return sorted
  }, [applications, statusFilter, search, sortKey, sortDir])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const pageItems = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir(key === 'applyDate' ? 'desc' : 'asc')
    }
  }

  const onDelete = (app: Application) => {
    if (!confirm(`Delete application for ${app.company} — ${app.position}?`)) return
    deleteApplication(app.id)
    toast('Application deleted', 'success')
  }

  if (applications.length === 0) {
    return (
      <section className="card px-6 py-12 text-center">
        <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-bg-mute text-ink-3">
          <Search size={16} />
        </div>
        <h3 className="text-md font-semibold text-ink-1">No applications yet</h3>
        <p className="mt-1 text-sm text-ink-2">
          Add your first one to start tracking.
        </p>
      </section>
    )
  }

  return (
    <section className="card overflow-hidden">
      {/* Status filter tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-border-soft px-6 py-3 no-scrollbar">
        {STATUS_FILTERS.map((f) => {
          const active = statusFilter === f.value
          const count = counts[f.value] ?? 0
          return (
            <button
              key={f.value}
              onClick={() => {
                setStatusFilter(f.value)
                setPage(0)
              }}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-colors',
                active
                  ? 'text-ink-1'
                  : 'text-ink-3 hover:text-ink-2',
              )}
            >
              <span
                className={cn(
                  'border-b-2 pb-0.5 font-mono',
                  active ? 'border-ink-1' : 'border-transparent',
                )}
              >
                {f.label}
              </span>
              <span
                className={cn(
                  'num rounded px-1.5 py-0.5 font-mono text-[10px]',
                  active ? 'bg-ink-1 text-bg' : 'bg-bg-mute text-ink-2',
                )}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-soft text-xs uppercase tracking-wider text-ink-3">
              <Th onClick={() => handleSort('company')} active={sortKey === 'company'} dir={sortDir}>
                Company
              </Th>
              <Th onClick={() => handleSort('position')} active={sortKey === 'position'} dir={sortDir}>
                Position
              </Th>
              <Th onClick={() => handleSort('applyDate')} active={sortKey === 'applyDate'} dir={sortDir}>
                Applied
              </Th>
              <Th onClick={() => handleSort('status')} active={sortKey === 'status'} dir={sortDir}>
                Status
              </Th>
              <th className="w-24 px-4 py-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-sm text-ink-3">
                  No applications match the current filters.
                </td>
              </tr>
            ) : (
              pageItems.map((app) => (
                <tr
                  key={app.id}
                  onClick={() => onEdit(app)}
                  className="group cursor-pointer border-b border-border-soft transition-colors hover:bg-bg-soft"
                  style={{ height: 40 }}
                >
                  <td className="px-4 py-2">
                    <span className="font-medium text-ink-1">{app.company}</span>
                  </td>
                  <td className="px-4 py-2 text-ink-2">{app.position}</td>
                  <td className="px-4 py-2 font-mono text-xs text-ink-2 num">
                    {formatDate(app.applyDate)}
                  </td>
                  <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                    <StatusDropdown
                      value={app.status}
                      onChange={(s) => {
                        if (s === app.status) return
                        changeStatus(app.id, s)
                        toast(`Status updated: ${STATUS_LABEL[s]}`, 'success')
                      }}
                    />
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onEdit(app)
                        }}
                        className="grid h-6 w-6 place-items-center rounded text-ink-3 hover:bg-bg-mute hover:text-ink-1"
                        aria-label="Edit"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(app)
                        }}
                        className="grid h-6 w-6 place-items-center rounded text-ink-3 hover:bg-bg-mute hover:text-red-600"
                        aria-label="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between border-t border-border-soft px-6 py-3 text-xs text-ink-2">
          <span className="font-mono">
            Showing{' '}
            <span className="text-ink-1 num">
              {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, filtered.length)}
            </span>{' '}
            of <span className="text-ink-1 num">{filtered.length}</span>
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="rounded px-2 py-1 font-mono text-ink-2 hover:bg-bg-soft disabled:opacity-30"
            >
              ‹ Prev
            </button>
            <span className="px-2 font-mono text-ink-2">
              <span className="text-ink-1 num">{safePage + 1}</span> /{' '}
              <span className="num">{pageCount}</span>
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={safePage >= pageCount - 1}
              className="rounded px-2 py-1 font-mono text-ink-2 hover:bg-bg-soft disabled:opacity-30"
            >
              Next ›
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

function Th({
  children,
  onClick,
  active,
  dir,
}: {
  children: React.ReactNode
  onClick: () => void
  active: boolean
  dir: 'asc' | 'desc'
}) {
  return (
    <th className="px-4 py-2 text-left font-medium">
      <button
        onClick={onClick}
        className={cn(
          'inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider',
          active ? 'text-ink-1' : 'text-ink-3',
        )}
      >
        {children}
        {active && <span className="text-ink-2">{dir === 'asc' ? '↑' : '↓'}</span>}
      </button>
    </th>
  )
}
