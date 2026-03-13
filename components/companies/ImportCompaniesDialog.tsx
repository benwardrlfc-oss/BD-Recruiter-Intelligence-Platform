'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle, X, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface ParsedRow {
  name: string
  sector: string
  subsector?: string
  stage?: string
  geography?: string
  website?: string
  summary?: string
  employeeCount?: number
  fundingTotal?: number
}

interface ImportResult {
  created: number
  updated: number
  skipped: number
  errors: string[]
}

const CSV_HEADERS = ['name', 'sector', 'subsector', 'stage', 'geography', 'website', 'summary', 'employeeCount', 'fundingTotal']
const REQUIRED_HEADERS = ['name', 'sector']

const EXAMPLE_CSV = `name,sector,subsector,stage,geography,website,summary,employeeCount,fundingTotal
Acme Bio,Life Sciences,Biotech,Series B,San Francisco CA,https://acmebio.com,RNA therapeutics company targeting neurological disorders,120,85000000
Vertex Pharma,Life Sciences,Pharma,Growth,Boston MA,https://vertexpharma.com,Specialty pharma focused on rare genetic diseases,2400,450000000`

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/[\s"]/g, ''))
  const rows: ParsedRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue

    // Handle quoted fields with commas inside
    const values: string[] = []
    let current = ''
    let inQuotes = false
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim())

    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h] = values[idx] || ''
    })

    if (!row.name || !row.sector) continue

    rows.push({
      name: row.name,
      sector: row.sector,
      subsector: row.subsector || undefined,
      stage: row.stage || undefined,
      geography: row.geography || undefined,
      website: row.website || undefined,
      summary: row.summary || undefined,
      employeeCount: row.employeecount ? parseInt(row.employeecount) || undefined : undefined,
      fundingTotal: row.fundingtotal ? parseFloat(row.fundingtotal) || undefined : undefined,
    })
  }

  return rows
}

function downloadExampleCSV() {
  const blob = new Blob([EXAMPLE_CSV], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'company-import-template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

interface Props {
  open: boolean
  onClose: () => void
  onSuccess?: (result: ImportResult) => void
}

export function ImportCompaniesDialog({ open, onClose, onSuccess }: Props) {
  const [dragOver, setDragOver] = useState(false)
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setParsedRows([])
    setParseError(null)
    setResult(null)
  }

  const handleFile = (file: File) => {
    setParseError(null)
    setResult(null)

    if (!file.name.endsWith('.csv')) {
      setParseError('Please upload a .csv file.')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      try {
        const rows = parseCSV(text)
        if (rows.length === 0) {
          setParseError('No valid rows found. Make sure the CSV has "name" and "sector" columns.')
          return
        }
        setParsedRows(rows)
      } catch {
        setParseError('Failed to parse CSV. Check the file format.')
      }
    }
    reader.readAsText(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleImport = async () => {
    if (parsedRows.length === 0) return
    setIsImporting(true)
    try {
      const res = await fetch('/api/companies/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companies: parsedRows }),
      })
      const data = await res.json()
      if (!res.ok) {
        setParseError(data.error || 'Import failed.')
        return
      }
      setResult(data)
      onSuccess?.(data)
      setParsedRows([])
    } catch {
      setParseError('Network error during import.')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose() } }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Companies from CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Template download */}
          <div className="flex items-center justify-between rounded-lg bg-slate-800/60 border border-slate-700 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-white">Required columns: name, sector</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Optional: subsector, stage, geography, website, summary, employeeCount, fundingTotal
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={downloadExampleCSV} className="gap-2 shrink-0">
              <Download className="h-3.5 w-3.5" />
              Template
            </Button>
          </div>

          {/* Result state */}
          {result && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-900/15 px-4 py-4 space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <CheckCircle className="h-4 w-4" />
                Import complete
              </div>
              <div className="text-sm text-slate-300 space-y-0.5 mt-1">
                <p><span className="text-white font-medium">{result.created}</span> companies created</p>
                <p><span className="text-white font-medium">{result.updated}</span> companies updated</p>
                {result.skipped > 0 && (
                  <p className="text-slate-500">{result.skipped} rows skipped (missing name/sector or errors)</p>
                )}
              </div>
              {result.errors.length > 0 && (
                <p className="text-xs text-amber-400 mt-2">Failed rows: {result.errors.join(', ')}</p>
              )}
              <Button size="sm" variant="outline" className="mt-3" onClick={onClose}>Done</Button>
            </div>
          )}

          {/* Drop zone */}
          {!result && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-12 cursor-pointer transition-colors',
                dragOver
                  ? 'border-indigo-500 bg-indigo-900/10'
                  : parsedRows.length > 0
                    ? 'border-emerald-600/50 bg-emerald-900/10'
                    : 'border-slate-700 hover:border-slate-600 bg-slate-900/30'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="sr-only"
                onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }}
              />

              {parsedRows.length > 0 ? (
                <>
                  <FileText className="h-8 w-8 text-emerald-400 mb-3" />
                  <p className="text-sm font-medium text-white">{parsedRows.length} companies ready to import</p>
                  <p className="text-xs text-slate-400 mt-1">Click to replace with a different file</p>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-slate-500 mb-3" />
                  <p className="text-sm font-medium text-white">Drop CSV here or click to browse</p>
                  <p className="text-xs text-slate-400 mt-1">Max 500 companies per import</p>
                </>
              )}
            </div>
          )}

          {/* Parse error */}
          {parseError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-900/15 px-4 py-3">
              <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
              <p className="text-sm text-red-300">{parseError}</p>
            </div>
          )}

          {/* Preview table */}
          {parsedRows.length > 0 && !result && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                Preview — first {Math.min(5, parsedRows.length)} of {parsedRows.length} rows
              </p>
              <div className="rounded-lg border border-slate-800 overflow-hidden text-xs">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-800/60">
                      <th className="text-left px-3 py-2 text-slate-400 font-medium">Name</th>
                      <th className="text-left px-3 py-2 text-slate-400 font-medium">Sector</th>
                      <th className="text-left px-3 py-2 text-slate-400 font-medium">Stage</th>
                      <th className="text-left px-3 py-2 text-slate-400 font-medium">Geography</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-t border-slate-800">
                        <td className="px-3 py-2 text-white font-medium">{row.name}</td>
                        <td className="px-3 py-2 text-slate-300">{row.sector}</td>
                        <td className="px-3 py-2 text-slate-400">{row.stage || '—'}</td>
                        <td className="px-3 py-2 text-slate-400">{row.geography || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action buttons */}
          {parsedRows.length > 0 && !result && (
            <div className="flex items-center justify-between pt-1">
              <Button variant="ghost" size="sm" onClick={reset} className="text-slate-400">
                <X className="h-3.5 w-3.5 mr-1.5" />
                Clear
              </Button>
              <Button onClick={handleImport} disabled={isImporting} className="gap-2">
                {isImporting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isImporting ? 'Importing…' : `Import ${parsedRows.length} Companies`}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
