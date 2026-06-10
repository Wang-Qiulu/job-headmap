// Mini modal: "Export data to CSV". User picks a save location via the
// native macOS save dialog (Tauri dialog plugin), then we hand the path to
// the Rust write_file command which writes atomically.

import { useState } from 'react'
import { Download, FileText } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'
import { toast } from './Toast'
import {
  applicationsToCsvFile,
  defaultExportFilename,
} from '@/lib/csvExport'
import { useStore } from '@/store/useStore'
import { isTauri } from '@/lib/persistStorage'

export function ExportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const applications = useStore((s) => s.applications)
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    if (applications.length === 0) {
      toast('当前没有可导出的记录', 'error')
      return
    }

    setExporting(true)
    try {
      const defaultName = defaultExportFilename()
      const csv = applicationsToCsvFile(applications)

      if (isTauri()) {
        // Native save dialog (Tauri dialog plugin)
        const { save } = await import('@tauri-apps/plugin-dialog')
        const { invoke } = await import('@tauri-apps/api/core')
        const path = await save({
          defaultPath: defaultName,
          filters: [{ name: 'CSV (UTF-8)', extensions: ['csv'] }],
          title: '导出 CSV',
        })
        if (!path) {
          // User cancelled — do nothing.
          setExporting(false)
          return
        }
        await invoke('write_file', { path, content: csv })
        toast(`已导出 ${applications.length} 条记录`, 'success')
        onClose()
      } else {
        // Browser fallback (dev:web) — Blob + anchor download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = defaultName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast(`已导出 ${applications.length} 条记录到下载目录`, 'success')
        onClose()
      }
    } catch (err) {
      toast(`导出失败：${err instanceof Error ? err.message : String(err)}`, 'error')
    } finally {
      setExporting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="导出数据">
      <p className="mb-1 text-sm text-ink-2">
        将当前 {applications.length} 条记录导出为 CSV 文件，CSV 可用 Excel / Numbers 打开。
      </p>
      <p className="mb-5 text-xs text-ink-3">
        文件包含：公司、职位、投递日期、当前状态、链接、备注。
      </p>

      <div className="mb-5 flex items-start gap-2 rounded-md border border-border bg-bg-mute p-3 font-mono text-xs text-ink-2">
        <FileText size={14} className="mt-0.5 shrink-0" />
        <div>
          将保存为：
          <span className="ml-1 text-ink-1">{defaultExportFilename()}</span>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose} disabled={exporting}>
          取消
        </Button>
        <Button onClick={handleExport} disabled={exporting || applications.length === 0}>
          <Download size={14} />
          {exporting ? '导出中…' : '选择位置并导出'}
        </Button>
      </div>
    </Modal>
  )
}
