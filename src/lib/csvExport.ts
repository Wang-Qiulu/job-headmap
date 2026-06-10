// CSV serialization for Application records.
// Used by the export feature: user clicks Download in Header, picks a save
// location via the native save dialog, we hand the result to Rust's
// write_file command which writes atomically.

import { STATUS_LABEL, type Application } from '@/types'

// RFC 4180: fields containing comma, double-quote, CR, or LF must be wrapped
// in double quotes; embedded double quotes are escaped by doubling them.
function csvEscape(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

const HEADER = [
  '公司',
  '职位',
  '投递日期',
  '当前状态',
  '投递链接',
  '备注',
] as const

/** Serialize the application list into a CSV body (no BOM, no header
 *  decorations — caller adds the BOM if exporting to a file).
 *
 *  We deliberately drop `createdAt` / `updatedAt` — those are internal
 *  audit fields (ISO-8601 UTC, e.g. "2026-06-10T07:30:13.425Z") that look
 *  like bugs to anyone reading the spreadsheet. The CSV is for sharing
 *  (HR / 猎头 / Excel 二次加工), not for backups; the source of truth stays
 *  in `~/Library/Application Support/com.jobheadmap.dashboard/data.json`. */
export function applicationsToCsv(apps: Application[]): string {
  const rows = apps.map((a) =>
    [
      a.company,
      a.position,
      a.applyDate,
      STATUS_LABEL[a.status],
      a.url ?? '',
      a.notes ?? '',
    ]
      .map(csvEscape)
      .join(','),
  )
  return [HEADER.join(','), ...rows].join('\r\n') // RFC 4180 says CRLF
}

/** UTF-8 BOM prepended — Excel for Mac / Numbers for Mac rely on the BOM to
 *  recognize UTF-8 instead of falling back to GBK. Without it, the first
 *  column header "公司" renders as garbled bytes. */
export function applicationsToCsvFile(apps: Application[]): string {
  return '﻿' + applicationsToCsv(apps)
}

/** `求职记录-YYYYMMDD.csv` style default name. */
export function defaultExportFilename(now: Date = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `求职记录-${y}${m}${d}.csv`
}
