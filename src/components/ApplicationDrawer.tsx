import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trash2, ExternalLink, Check, Clock, AlertTriangle } from 'lucide-react'
import { Input, Textarea } from './Input'
import { Button } from './Button'
import { Modal } from './Modal'
import { StatusDropdown } from './StatusDropdown'
import { useStore } from '@/store/useStore'
import { cn, formatDate, formatRelative, toISODate, toISODateTime } from '@/lib/utils'
import {
  STATUS_LABEL,
  TERMINAL_STATUSES,
  isValidTransition,
  type Application,
  type Status,
  type StatusChange,
} from '@/types'
import { parseISO } from 'date-fns'
import { toast } from './Toast'

interface ApplicationDrawerProps {
  open: boolean
  application: Application | null
  onClose: () => void
}

type SaveState = 'idle' | 'saving' | 'saved'

interface PendingStatus {
  status: Status
  /** YYYY-MM-DD — the date the change actually happened (editable). */
  changedAt: string
}

export function ApplicationDrawer({ open, application, onClose }: ApplicationDrawerProps) {
  const updateApplication = useStore((s) => s.updateApplication)
  const changeStatus = useStore((s) => s.changeStatus)
  const deleteApplication = useStore((s) => s.deleteApplication)

  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [draft, setDraft] = useState<Application | null>(application)
  const [pending, setPending] = useState<PendingStatus | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmReopen, setConfirmReopen] = useState(false)
  const saveTimer = useRef<number | null>(null)
  // Keep the latest draft / application available to flushSave without making
  // it re-create on every render. Autosave effect updates these refs in lockstep.
  const latestRef = useRef({ draft, application })
  latestRef.current = { draft, application }

  // Sync draft when target application changes / opens. Also clear any
  // pending status change from a previous open of the same record.
  useEffect(() => {
    if (application) {
      setDraft(application)
      setSaveState('idle')
      setPending(null)
    }
  }, [application])

  // ─────────────────────────────────────────────────────────
  // Autosave (debounced) + flushSave (synchronous, for close)
  // ─────────────────────────────────────────────────────────
  const performSave = () => {
    const { draft: d, application: a } = latestRef.current
    if (!d || !a) return
    if (
      d.company === a.company &&
      d.position === a.position &&
      d.applyDate === a.applyDate &&
      (d.url ?? '') === (a.url ?? '') &&
      (d.notes ?? '') === (a.notes ?? '')
    ) {
      return
    }
    updateApplication(a.id, {
      company: d.company,
      position: d.position,
      applyDate: d.applyDate,
      url: d.url || undefined,
      notes: d.notes || undefined,
    })
    setSaveState('saved')
    window.setTimeout(() => setSaveState('idle'), 1200)
  }

  // Debounced autosave on any draft change. status is excluded — see
  // `handleStatusChange` below. updateApplication is stable (Zustand) so we
  // intentionally leave it out of deps to keep the effect noise-free.
  useEffect(() => {
    const { draft: d, application: a } = latestRef.current
    if (!d || !a) return
    if (
      d.company === a.company &&
      d.position === a.position &&
      d.applyDate === a.applyDate &&
      (d.url ?? '') === (a.url ?? '') &&
      (d.notes ?? '') === (a.notes ?? '')
    ) {
      return
    }
    setSaveState('saving')
    if (saveTimer.current) window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(performSave, 500)
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, application])

  /** Synchronously flush any pending autosave. Called before close. */
  const flushSave = () => {
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current)
      saveTimer.current = null
    }
    performSave()
  }

  /** Wrap onClose so user input is never lost to the 500ms debounce. */
  const handleClose = () => {
    flushSave()
    onClose()
  }

  // ESC closes (with flush)
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        flushSave()
        onClose()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, onClose])

  if (!application || !draft) return null

  // ─────────────────────────────────────────────────────────
  // Status change: two-step flow (3.1 + 3.4)
  // ─────────────────────────────────────────────────────────
  const handleStatusChange = (s: Status) => {
    // Picking the saved status → clear any pending change
    if (s === draft.status) {
      setPending(null)
      return
    }
    if (!isValidTransition(draft.status, s)) {
      toast(
        `非法状态转换：${STATUS_LABEL[draft.status]} → ${STATUS_LABEL[s]}`,
        'error',
      )
      return
    }
    // Terminal → non-terminal needs an extra explicit "are you sure".
    // We don't apply the change here — the confirm modal sets
    // `confirmReopen`; the user then sees the inline PendingStatus block
    // and hits "Save" there to actually commit. (Two-step by design:
    // Modal confirms *intent to leave terminal*, inline confirms *the
    // target status + date*.)
    const fromTerminal = TERMINAL_STATUSES.includes(draft.status)
    const toTerminal = TERMINAL_STATUSES.includes(s)
    if (fromTerminal && !toTerminal) {
      setPending({ status: s, changedAt: toISODate(new Date()) })
      setConfirmReopen(true)
      return
    }
    setPending({ status: s, changedAt: toISODate(new Date()) })
  }

  const handleCancelPending = () => setPending(null)

  const handleConfirmPending = () => {
    if (!pending) return
    const changedAt = toISODateTime(parseISO(pending.changedAt))
    try {
      changeStatus(application.id, pending.status, changedAt)
    } catch (err) {
      toast(err instanceof Error ? err.message : '状态变更失败', 'error')
      setPending(null)
      return
    }
    toast(`状态已更新为：${STATUS_LABEL[pending.status]}`, 'success')
    setPending(null)
    // draft is reset by the [application] effect once the store propagates
  }

  const isReopen =
    pending !== null &&
    TERMINAL_STATUSES.includes(draft.status) &&
    !TERMINAL_STATUSES.includes(pending.status)

  const handleDelete = () => {
    setConfirmDelete(true)
  }

  const performDelete = () => {
    deleteApplication(application.id)
    toast('记录已删除', 'success')
    setConfirmDelete(false)
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
            onClick={handleClose}
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
                  onClick={handleClose}
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
                {/* Status + pending confirmation block (3.1 + 3.4) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-ink-2">状态</label>
                  <div>
                    <StatusDropdown
                      value={pending?.status ?? draft.status}
                      onChange={handleStatusChange}
                      size="md"
                    />
                  </div>
                  <AnimatePresence>
                    {pending && (
                      <motion.div
                        key="pending"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden"
                      >
                        <PendingStatusBlock
                          pending={pending}
                          isReopen={isReopen}
                          onChange={(v) => setPending({ ...pending, changedAt: v })}
                          onConfirm={handleConfirmPending}
                          onCancel={handleCancelPending}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
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
                            {formatDate(change.changedAt)}
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
              <Button variant="secondary" onClick={handleClose}>
                关闭
              </Button>
            </div>
          </motion.aside>

          <Modal
            open={confirmDelete}
            onClose={() => setConfirmDelete(false)}
            title="确认删除"
          >
            <p className="mb-5 text-sm text-ink-2">
              确认删除「{application.company} — {application.position}」？此操作不可恢复。
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                取消
              </Button>
              <Button variant="danger" onClick={performDelete}>
                删除
              </Button>
            </div>
          </Modal>

          <Modal
            open={confirmReopen}
            onClose={() => {
              setConfirmReopen(false)
              setPending(null)
            }}
            title="重新打开这条记录？"
          >
            <p className="mb-5 text-sm text-ink-2">
              当前状态为「{STATUS_LABEL[application.status]}」，已属于结束态。重新打开后可以继续记录后续状态变更。
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setConfirmReopen(false)
                  setPending(null)
                }}
              >
                取消
              </Button>
              <Button variant="primary" onClick={() => setConfirmReopen(false)}>
                继续
              </Button>
            </div>
          </Modal>
        </>
      )}
    </AnimatePresence>
  )
}

// ─────────────────────────────────────────────────────────
// Pending status confirmation block
// ─────────────────────────────────────────────────────────
interface PendingStatusBlockProps {
  pending: PendingStatus
  isReopen: boolean
  onChange: (changedAt: string) => void
  onConfirm: () => void
  onCancel: () => void
}

function PendingStatusBlock({
  pending,
  isReopen,
  onChange,
  onConfirm,
  onCancel,
}: PendingStatusBlockProps) {
  return (
    <div
      className={cn(
        'mt-2 rounded-md border p-3 flex flex-col gap-2.5',
        isReopen
          ? 'border-amber-300/40 bg-amber-50/40'
          : 'border-border bg-bg-soft',
      )}
    >
      <div className="flex items-center gap-2 text-xs">
        {isReopen && (
          <AlertTriangle size={12} className="text-amber-600" />
        )}
        <span className={cn(isReopen ? 'text-amber-700' : 'text-ink-2')}>
          {isReopen ? '重新打开' : '状态变更'}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <label className="shrink-0 text-xs text-ink-2">变更日期</label>
        <input
          type="date"
          value={pending.changedAt}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono text-xs text-ink-1 focus:outline-none"
        />
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
          取消
        </Button>
        <Button type="button" size="sm" onClick={onConfirm}>
          {isReopen ? '确认重新打开' : '确认变更'}
        </Button>
      </div>
    </div>
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

