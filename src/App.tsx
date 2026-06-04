import { useEffect, useState } from 'react'
import { Header } from './components/Header'
import { HeroStats } from './components/HeroStats'
import { Heatmap } from './components/Heatmap'
import { ApplicationsTable } from './components/ApplicationsTable'
import { ApplicationDrawer } from './components/ApplicationDrawer'
import { ApplicationForm } from './components/ApplicationForm'
import { ToastContainer } from './components/Toast'
import { useStore } from './store/useStore'
import type { Application } from './types'

type FormState =
  | { open: false }
  | { open: true; mode: 'new' }
  | { open: true; mode: 'edit'; app: Application }

export default function App() {
  const applications = useStore((s) => s.applications)
  const hasHydrated = useStore((s) => s.hasHydrated)

  const [search, setSearch] = useState('')
  const [drawerId, setDrawerId] = useState<string | null>(null)
  const [formState, setFormState] = useState<FormState>({ open: false })

  // Derive the *live* application from the store so the Drawer always
  // shows the latest data (status, timeline, etc.) after in-Drawer edits.
  const drawerApp = drawerId ? applications.find((a) => a.id === drawerId) ?? null : null

  // Keyboard shortcut: n = new
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const isInput =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable
      if (isInput) return
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        setFormState({ open: true, mode: 'new' })
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="min-h-screen bg-bg">
      <Header
        search={search}
        onSearchChange={setSearch}
        onAdd={() => setFormState({ open: true, mode: 'new' })}
      />

      <main className="container-page flex flex-col gap-6 py-8">
        <HeroStats applications={applications} />
        <Heatmap applications={applications} />
        <ApplicationsTable
          search={search}
          onEdit={(app) => setDrawerId(app.id)}
        />
      </main>

      <footer className="container-page pb-8 pt-2">
        <div className="flex items-center justify-between text-xs text-ink-3">
          <span className="font-mono">
            共 <span className="num">{applications.length}</span> 条记录 · 本地存储
          </span>
          <span className="font-mono">
            按{' '}
            <kbd className="rounded border border-border bg-bg-soft px-1 py-0.5 text-[10px] text-ink-2">
              N
            </kbd>{' '}
            新建
          </span>
        </div>
      </footer>

      <ApplicationDrawer
        open={drawerApp !== null}
        application={drawerApp}
        onClose={() => setDrawerId(null)}
      />

      <ApplicationForm
        open={formState.open}
        initial={formState.open && formState.mode === 'edit' ? formState.app : undefined}
        onClose={() => setFormState({ open: false })}
      />

      <ToastContainer />

      {!hasHydrated && (
        <div className="pointer-events-none fixed inset-0 grid place-items-center bg-bg/60 backdrop-blur-sm">
          <div className="font-mono text-xs text-ink-3">加载中…</div>
        </div>
      )}
    </div>
  )
}
