import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trash2, ExternalLink, Check, Clock } from 'lucide-react'
import { Input, Textarea } from './Input'
import { Button } from './Button'
import { StatusDropdown } from './StatusDropdown'
import { useStore } from '@/store/useStore'
import { cn, formatDate, formatDateTime, formatRelative } from '@/lib/utils'
import { STATUS_LABEL, type Application, type Status, type StatusChange } from '@/types'
import { toast } from './Toast'

interface ApplicationDrawerProps {
  open: boolean
  application: Application | null
  onClose: () => void
}

type SaveState = 'idle' | 'saving' | 'saved'

export function ApplicationDrawer({ open, application, onClose }: ApplicationDrawerProps) {
  const updateApplication = useStore((s) => s.updateApplication)
  const changeStatus = useStore((s) => s.changeStatus)
  const deleteApplication = useStore((s) => s.deleteApplication)

  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [draft, setDraft] = useState<Application | null>(application)
  const saveTimer = useRef<number | null>(null)

  // Sync draft when target application changes / opens
  useEffect(() => {
    if (application) {
      setDraft(application)
      setSaveState('idle')
    }
  }, [application])

  // ESC closes
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Debounced autosave on any draft change. Note: status is excluded — the
  // store's `updateApplication` type forbids it, and status changes go
  // through `changeStatus` so the timeline gets appended.
  useEffect(() => {
    if (!draft || !application) return
    if (
      draft.company === application.company &&
      draft.position === application.position &&
      draft.applyDate === application.applyDate &&
      draft.status === application.status &&
      (draft.url ?? '') === (application.url ?? '') &&
      (draft.notes ?? '') === (application.notes ?? '')
    ) {
      return
    }
    setSaveState('saving')
    if (saveTimer.current) window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      updateApplication(application.id, {
        company: draft.company,
        position: draft.position,
        applyDate: draft.applyDate,
        url: draft.url || undefined,
        notes: draft.notes || undefined,
      })
      setSaveState('saved')
      window.setTimeout(() => setSaveState('idle'), 1200)
    }, 500)
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current)
    }
  }, [draft, application, updateApplication])

  if (!application || !draft) return null

  const handleStatusChange = (s: Status) => {
    if (s === application.status) return
    setDraft({ ...draft, status: s })
    changeStatus(application.id, s)
    toast(`状态已更新为：${STATUS_LABEL[s]}`, 'success')
  }

  const handleDelete = () => {
    if (!confirm(`确认删除「${application.company} — ${application.position}」？`))
      return
    deleteApplication(application.id)
    toast('记录已删除', 'success')
    onClose()
  }

  // Build a chronological reverse list (newest first) for the timeline
  const reversedHistory: StatusChange[] = [...application.statusHistory].reverse()

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[560px] flex-col border-l border-border bg-bg shadow-drawer"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border-soft px-6 py-4">
              <SaveIndicator state={saveState} />
              <div className="flex items-center gap-1">
                <button
                  onClick={handleDelete}
                  className="grid h-7 w-7 place-items-center rounded text-ink-3 hover:bg-bg-mute hover:text-red-600"
                  aria-label="Delete"
                >
                  <Trash2 size={14} />
                </button>
                <button
                  onClick={onClose}
                  className="grid h-7 w-7 place-items-center rounded text-ink-3 hover:bg-bg-mute hover:text-ink-1"
                  aria-label="Close"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Body — scrollable */}
            <div className="flex-1 overflow-y-auto">
              {/* Title block */}
              <div className="px-6 pt-6">
                <input
                  value={draft.company}
                  onChange={(e) => setDraft({ ...draft, company: e.target.value })}
                  className="w-full bg-transparent text-xl font-semibold tracking-tight text-ink-1 focus:outline-none"
                  placeholder="Company"
                />
                <input
                  value={draft.position}
                  onChange={(e) => setDraft({ ...draft, position: e.target.value })}
                  className="mt-1 w-full bg-transparent text-md text-ink-2 focus:outline-none"
                  placeholder="Position"
                />
                <div className="mt-2 flex items-center gap-1.5 text-xs text-ink-3">
                  <span>投递</span>
                  <input
                    type="date"
                    value={draft.applyDate}
                    onChange={(e) => setDraft({ ...draft, applyDate: e.target.value })}
                    className="font-mono text-ink-2 focus:outline-none"
                  />
                  <span>·</span>
                  <span>{formatRelative(application.createdAt)}</span>
                </div>
              </div>

              {/* Fields */}
              <div className="flex flex-col gap-4 px-6 pt-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-ink-2">状态</label>
                  <div>
                    <StatusDropdown
                      value={draft.status}
                      onChange={handleStatusChange}
                      size="md"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-ink-2">职位链接</label>
                  <div className="relative">
                    <Input
                      type="url"
                      value={draft.url ?? ''}
                      onChange={(e) => setDraft({ ...draft, url: e.target.value })}
                      placeholder="https://..."
                    />
                    {draft.url && (
                      <a
                        href={draft.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink-1"
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>

                <Textarea
                  label="备注"
                  value={draft.notes ?? ''}
                  onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                  placeholder="招聘人、内推、下一步…"
                  rows={5}
                />
              </div>

              {/* Timeline */}
              <div className="px-6 pt-8 pb-10">
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-ink-3">
                    时间线
                  </span>
                  <div className="h-px flex-1 bg-border-soft" />
                </div>

                <ol className="relative ml-2">
                  {/* vertical dashed line */}
                  <div className="absolute left-[5px] top-1 h-[calc(100%-12px)] w-px border-l border-dashed border-border" />
                  {reversedHistory.map((change, idx) => {
                    const isLatest = idx === 0
                    const isOffer = change.status === 'offer'
                    return (
                      <li
                        key={`${change.changedAt}-${idx}`}
                        className="relative pb-5 pl-6 last:pb-0"
                      >
                        <span
                          className={cn(
                            'absolute left-0 top-1 grid h-3 w-3 place-items-center rounded-full border-2 bg-bg',
                            isLatest && isOffer && 'border-success bg-success animate-pulse-soft',
                            isLatest && !isOffer && 'border-ink-1 bg-ink-1 animate-pulse-soft',
                            !isLatest && isOffer && 'border-success',
                            !isLatest && !isOffer && 'border-ink-2',
                          )}
                        />
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'text-sm font-medium',
                                isOffer ? 'text-success' : 'text-ink-1',
                              )}
                            >
                              {STATUS_LABEL[change.status]}
                            </span>
                            {isLatest && (
                              <span className="rounded-sm bg-bg-mute px-1.5 py-0.5 text-[10px] font-mono text-ink-2">
                                当前
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-xs text-ink-3">
                            {formatDateTime(change.changedAt)}
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ol>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border-soft px-6 py-3">
              <div className="font-mono text-xs text-ink-3">
                ID <span className="text-ink-2">{application.id.slice(0, 8)}</span>
              </div>
              <Button variant="secondary" onClick={onClose}>
                关闭
              </Button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

function SaveIndicator({ state }: { state: SaveState }) {
  return (
    <AnimatePresence mode="wait">
      {state !== 'idle' && (
        <motion.div
          key={state}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="flex items-center gap-1.5 font-mono text-xs text-ink-3"
        >
          {state === 'saving' ? (
            <>
              <Clock size={12} className="animate-pulse-soft" />
              保存中…
            </>
          ) : (
            <>
              <Check size={12} className="text-success" />
              <span className="text-ink-2">已保存</span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export const _ = formatDate
