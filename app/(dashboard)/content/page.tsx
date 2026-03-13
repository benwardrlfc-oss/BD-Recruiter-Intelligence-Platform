'use client'

import { useState, useEffect } from 'react'
import {
  Sparkles,
  Copy,
  CheckCircle,
  Loader2,
  Linkedin,
  FileText,
  BarChart3,
  Save,
  RotateCcw,
  Search,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { mockSignals } from '@/lib/mock-data'
import { getSignalTypeColor, formatTimeAgo, cn } from '@/lib/utils'

const contentTypes = [
  {
    id: 'linkedin_post',
    label: 'LinkedIn Post',
    icon: Linkedin,
    description: '250-400 word thought leadership post',
  },
  {
    id: 'newsletter',
    label: 'Newsletter Section',
    icon: FileText,
    description: 'Market intelligence digest format',
  },
  {
    id: 'market_commentary',
    label: 'Market Commentary',
    icon: BarChart3,
    description: 'Long-form analysis piece',
  },
]

export default function ContentPage() {
  const [selectedType, setSelectedType] = useState('linkedin_post')
  const [selectedSignals, setSelectedSignals] = useState<string[]>([])
  const [selectedTone, setSelectedTone] = useState('')
  const [selectedLength, setSelectedLength] = useState('')
  const [signalTypeFilter, setSignalTypeFilter] = useState('all')
  const [signalSearch, setSignalSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [generatedContent, setGeneratedContent] = useState('')
  const [copied, setCopied] = useState(false)
  const [savedItems, setSavedItems] = useState<Array<{ type: string; content: string; date: Date }>>([])
  const [lengthWarning, setLengthWarning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filteredSignals = mockSignals.filter((s) => {
    const typeMatch = signalTypeFilter === 'all' || s.signalType === signalTypeFilter
    const searchMatch = !signalSearch || s.title.toLowerCase().includes(signalSearch.toLowerCase())
    return typeMatch && searchMatch
  })

  const signalTypes = ['all', ...Array.from(new Set(mockSignals.map((s) => s.signalType)))]

  const toggleSignal = (id: string) => {
    setSelectedSignals((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const handleGenerate = async () => {
    if (!selectedLength) {
      setLengthWarning(true)
      setTimeout(() => setLengthWarning(false), 3000)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: selectedType,
          signalIds: selectedSignals.length > 0 ? selectedSignals : undefined,
          tone: selectedTone || 'professional',
          length: selectedLength,
        }),
      })
      if (!response.ok) throw new Error(`API error ${response.status}`)
      const data = await response.json()
      setGeneratedContent(data.draftText || '')
    } catch (err) {
      setError('Failed to generate content. Check your API key in Settings.')
      console.error('Error generating content:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    fetch('/api/content/save')
      .then((r) => r.json())
      .then((items) => {
        if (Array.isArray(items)) {
          setSavedItems(
            items.map((i: any) => ({
              type: i.contentType,
              content: i.draftText,
              date: new Date(i.createdAt),
            }))
          )
        }
      })
      .catch(() => {})
  }, [])

  const handleSave = () => {
    if (!generatedContent) return
    setSavedItems((prev) => [
      { type: selectedType, content: generatedContent, date: new Date() },
      ...prev,
    ])
    fetch('/api/content/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contentType: selectedType,
        draftText: generatedContent,
        linkedSignals: selectedSignals,
      }),
    }).catch(() => {})
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Content Studio</h1>
        <p className="text-sm text-slate-400 mt-1">
          Generate thought leadership content from market intelligence
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Config */}
        <div className="space-y-4">
          {/* Content Type */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Content Type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {contentTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={cn(
                    'w-full flex items-start gap-3 rounded-lg border p-3 text-left transition-colors',
                    selectedType === type.id
                      ? 'border-indigo-500 bg-indigo-900/20'
                      : 'border-slate-700 hover:border-slate-600'
                  )}
                >
                  <type.icon
                    className={cn('h-4 w-4 mt-0.5', selectedType === type.id ? 'text-indigo-400' : 'text-slate-500')}
                  />
                  <div>
                    <p className={cn('text-sm font-medium', selectedType === type.id ? 'text-indigo-300' : 'text-white')}>
                      {type.label}
                    </p>
                    <p className="text-xs text-slate-500">{type.description}</p>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Tone of Voice */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Tone of Voice</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { key: 'professional', label: 'Professional' },
                  { key: 'conversational', label: 'Conversational' },
                  { key: 'analytical', label: 'Analytical' },
                  { key: 'bold', label: 'Bold / Thought Leader' },
                ].map((tone) => (
                  <button
                    key={tone.key}
                    onClick={() => setSelectedTone(tone.key)}
                    className={cn(
                      'px-2.5 py-2 rounded-lg text-xs border text-left transition-colors',
                      selectedTone === tone.key
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-600'
                    )}
                  >
                    {tone.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Post Length */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                Post Length
                {lengthWarning && (
                  <span className="flex items-center gap-1 text-rose-400 font-normal">
                    <AlertCircle className="h-3 w-3" />
                    Required
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-1.5">
                {[
                  { key: 'short', label: 'Short', desc: '~150w' },
                  { key: 'medium', label: 'Medium', desc: '~300w' },
                  { key: 'long', label: 'Long', desc: '~500w' },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setSelectedLength(opt.key)}
                    className={cn(
                      'flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg text-xs border transition-colors',
                      selectedLength === opt.key
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : lengthWarning
                        ? 'bg-slate-900 text-slate-400 border-rose-600/50 hover:border-slate-600'
                        : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-600'
                    )}
                  >
                    <span className="font-medium">{opt.label}</span>
                    <span className="opacity-70">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Signal Selector */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Select Signal</CardTitle>
                <span className="text-xs text-slate-500">{selectedSignals.length} selected</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search signals..."
                  value={signalSearch}
                  onChange={(e) => setSignalSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
              {/* Type filter */}
              <div className="flex gap-1 flex-wrap">
                {signalTypes.slice(0, 5).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSignalTypeFilter(type)}
                    className={cn(
                      'px-2 py-0.5 rounded text-xs border transition-colors capitalize',
                      signalTypeFilter === type
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-900 text-slate-500 border-slate-800 hover:border-slate-600'
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {filteredSignals.slice(0, 10).map((signal) => (
                  <label
                    key={signal.id}
                    className={cn(
                      'flex items-start gap-2 rounded-lg border p-2 transition-colors',
                      isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                      selectedSignals.includes(signal.id)
                        ? 'border-indigo-500/50 bg-indigo-900/10'
                        : 'border-slate-800 hover:border-slate-700'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSignals.includes(signal.id)}
                      onChange={() => !isLoading && toggleSignal(signal.id)}
                      disabled={isLoading}
                      className="mt-0.5 accent-indigo-500"
                    />
                    <div>
                      <p className="text-xs font-medium text-white line-clamp-1">{signal.title}</p>
                      <div className={`mt-0.5 inline-flex text-xs px-1.5 py-0.5 rounded-full border ${getSignalTypeColor(signal.signalType)}`}>
                        {signal.signalType}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleGenerate} disabled={isLoading} className="w-full gap-2">
            {isLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Generate Content</>
            )}
          </Button>
        </div>

        {/* Right: Generated Content */}
        <div className="col-span-2 space-y-4">
          {error && (
            <div className="rounded-lg border border-rose-700/40 bg-rose-900/10 px-4 py-3 text-sm text-rose-400">
              {error}
            </div>
          )}
          <Card className="flex-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Generated Content</CardTitle>
                {generatedContent && (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleSave}>
                      <Save className="h-3 w-3" />
                      Save
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleCopy}>
                      {copied ? (
                        <><CheckCircle className="h-3 w-3 text-emerald-400" /> Copied</>
                      ) : (
                        <><Copy className="h-3 w-3" /> Copy</>
                      )}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setGeneratedContent('')}>
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {generatedContent ? (
                <Textarea
                  value={generatedContent}
                  onChange={(e) => setGeneratedContent(e.target.value)}
                  className="min-h-[400px] text-sm text-slate-200"
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="h-16 w-16 rounded-full bg-purple-600/20 flex items-center justify-center mb-4">
                    <Sparkles className="h-8 w-8 text-purple-400" />
                  </div>
                  <p className="text-lg font-medium text-white">Ready to create</p>
                  <p className="text-sm text-slate-400 mt-2 max-w-sm">
                    Select a content type, optionally pick signals, then generate
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Saved Items */}
          {savedItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Saved Content ({savedItems.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {savedItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between rounded-lg border border-slate-800 p-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-indigo-400 bg-indigo-900/30 px-2 py-0.5 rounded">
                            {item.type.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-slate-600">{formatTimeAgo(item.date)}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.content}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs ml-2 shrink-0"
                        onClick={() => {
                          navigator.clipboard.writeText(item.content)
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
