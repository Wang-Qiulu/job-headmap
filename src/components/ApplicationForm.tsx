import { useEffect, useState } from 'react'
import { Modal } from './Modal'
import { Input, Textarea } from './Input'
import { Button } from './Button'
import { StatusDropdown } from './StatusDropdown'
import { useStore } from '@/store/useStore'
import type { Application, Status } from '@/types'
import { formatDate, toISODate, toISODateTime } from '@/lib/utils'
import { toast } from './Toast'

interface ApplicationFormProps {
  open: boolean
  initial?: Application
  onClose: () => void
}

const todayISO = () => toISODate(new Date())

// When creating a fresh record, the only legal starting states are
// "计划中" (haven't applied yet) and "已投递" (already sent). Anything else
// (interview rounds, offer, rejected) is logically impossible at t=0.
// The `satisfies` clause ensures every member of NEW_RECORD_OPTIONS is a
// real Status at compile time.
const NEW_RECORD_OPTIONS = ['planned', 'applied'] as const satisfies readonly Status[]

export function ApplicationForm({ open, initial, onClose }: ApplicationFormProps) {
  const addApplication = useStore((s) => s.addApplication)
  const updateApplication = useStore((s) => s.updateApplication)
  const changeStatus = useStore((s) => s.changeStatus)

  const [company, setCompany] = useState('')
  const [position, setPosition] = useState('')
  const [applyDate, setApplyDate] = useState(todayISO())
  const [status, setStatus] = useState<Status>('applied')
  const [url, setUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form when opening / initial changes
  useEffect(() => {
    if (!open) return
    if (initial) {
      setCompany(initial.company)
      setPosition(initial.position)
      setApplyDate(initial.applyDate)
      setStatus(initial.status)
      setUrl(initial.url ?? '')
      setNotes(initial.notes ?? '')
    } else {
      setCompany('')
      setPosition('')
      setApplyDate(todayISO())
      setStatus('applied')
      setUrl('')
      setNotes('')
    }
    setErrors({})
  }, [open, initial])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!company.trim()) errs.company = '必填'
    if (!position.trim()) errs.position = '必填'
    if (!applyDate) errs.applyDate = '必填'
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    if (initial) {
      updateApplication(initial.id, {
        company: company.trim(),
        position: position.trim(),
        applyDate,
        url: url.trim() || undefined,
        notes: notes.trim() || undefined,
      })
      // Status changes go through `changeStatus` so the timeline is appended
      if (status !== initial.status) {
        try {
          changeStatus(initial.id, status)
        } catch (err) {
          toast(err instanceof Error ? err.message : '状态变更失败', 'error')
          return
        }
      }
      toast('记录已更新', 'success')
    } else {
      addApplication({
        company: company.trim(),
        position: position.trim(),
        applyDate,
        status,
        url: url.trim() || undefined,
        notes: notes.trim() || undefined,
      })
      toast('记录已添加', 'success')
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? '编辑记录' : '新建记录'}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="公司"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="公司名称"
            error={errors.company}
            autoFocus
          />
          <Input
            label="职位"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder="岗位名称"
            error={errors.position}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="投递日期"
            type="date"
            value={applyDate}
            onChange={(e) => setApplyDate(e.target.value)}
            error={errors.applyDate}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-ink-2">状态</label>
            <div className="h-9">
              <StatusDropdown
                value={status}
                onChange={setStatus}
                size="md"
                align="left"
                options={initial ? undefined : NEW_RECORD_OPTIONS}
              />
            </div>
          </div>
        </div>

        <Input
          label="职位链接"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          type="url"
        />

        <Textarea
          label="备注"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="岗位信息，面试反馈，后续跟进"
          rows={4}
        />

        <div className="mt-2 flex items-center justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button type="submit">{initial ? '保存' : '创建'}</Button>
        </div>
      </form>
    </Modal>
  )
}

// helper: expose current date for placeholder
export const _now = () => toISODateTime()
export const _fmt = formatDate
