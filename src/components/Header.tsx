import { Search, Plus } from 'lucide-react'
import { Button } from './Button'

interface HeaderProps {
  search: string
  onSearchChange: (s: string) => void
  onAdd: () => void
}

export function Header({ search, onSearchChange, onAdd }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/80 backdrop-blur-md">
      <div className="container-page flex h-14 items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-ink-1 text-bg">
            <svg width="14" height="14" viewBox="0 0 16 16" className="text-success">
              <g fill="currentColor">
                <rect x="1"  y="1"  width="3" height="3" rx="0.5"/>
                <rect x="5"  y="1"  width="3" height="3" rx="0.5"/>
                <rect x="9"  y="1"  width="3" height="3" rx="0.5"/>
                <rect x="1"  y="5"  width="3" height="3" rx="0.5" opacity="0.7"/>
                <rect x="5"  y="5"  width="3" height="3" rx="0.5"/>
                <rect x="9"  y="5"  width="3" height="3" rx="0.5" opacity="0.5"/>
                <rect x="1"  y="9"  width="3" height="3" rx="0.5"/>
                <rect x="5"  y="9"  width="3" height="3" rx="0.5" opacity="0.7"/>
                <rect x="9"  y="9"  width="3" height="3" rx="0.5"/>
              </g>
            </svg>
          </div>
          <span className="text-md font-semibold tracking-tight text-ink-1">
            Job Dashboard
          </span>
          <span className="hidden font-mono text-xs text-ink-3 sm:inline">
            v0.1
          </span>
        </div>

        <div className="flex flex-1 items-center justify-end gap-3">
          <div className="relative hidden w-72 sm:block">
            <Search
              size={14}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="搜索公司、职位…"
              className="h-8 w-full rounded-md border border-border bg-bg-mute pl-8 pr-3 font-mono text-xs text-ink-1 placeholder:text-ink-3 focus:border-ink-1 focus:bg-bg focus:outline-none"
            />
          </div>
          <Button onClick={onAdd} size="md" className="font-mono">
            <Plus size={14} strokeWidth={2.5} />
            <span className="hidden sm:inline">新建</span>
            <kbd className="hidden font-mono text-[10px] text-bg/60 md:inline">N</kbd>
          </Button>
        </div>
      </div>
    </header>
  )
}
