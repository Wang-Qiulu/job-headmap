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

export function ApplicationForm({ open, initial, onClose }: ApplicationFormProps) {
  const addApplication = useStore((s) => s.addApplication)
  const updateApplication = useStore((s) => s.updateApplication)

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
    if (!company.trim()) errs.company = 'Required'
    if (!position.trim()) errs.position = 'Required'
    if (!applyDate) errs.applyDate = 'Required'
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    if (initial) {
      updateApplication(initial.id, {
        company: company.trim(),
        position: position.trim(),
        applyDate,
        status,
        url: url.trim() || undefined,
        notes: notes.trim() || undefined,
      })
      toast('Application updated', 'success')
    } else {
      addApplication({
        company: company.trim(),
        position: position.trim(),
        applyDate,
        status,
        url: url.trim() || undefined,
        notes: notes.trim() || undefined,
      })
      toast('Application added', 'success')
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit application' : 'New application'}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="ByteDance"
            error={errors.company}
            autoFocus
          />
          <Input
            label="Position"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder="Senior Frontend Engineer"
            error={errors.position}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Apply date"
            type="date"
            value={applyDate}
            onChange={(e) => setApplyDate(e.target.value)}
            error={errors.applyDate}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-ink-2">Status</label>
            <div className="h-9">
              <StatusDropdown
                value={status}
                onChange={setStatus}
                size="md"
                align="left"
              />
            </div>
          </div>
        </div>

        <Input
          label="Job URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          type="url"
        />

        <Textarea
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Recruiter, referral, next steps..."
          rows={4}
        />

        <div className="mt-2 flex items-center justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{initial ? 'Save' : 'Create'}</Button>
        </div>
      </form>
    </Modal>
  )
}

// helper: expose current date for placeholder
export const _now = () => toISODateTime()
export const _fmt = formatDate
