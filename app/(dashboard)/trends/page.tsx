'use client'

import { TrendingUp, MapPin, DollarSign, Users, BarChart3, ArrowUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const growingSubsectors = [
  { name: 'Radiopharmaceuticals', growth: 'Very High', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { name: 'AI Drug Discovery', growth: 'Very High', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { name: 'RNA Editing', growth: 'High', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  { name: 'Antibody-Drug Conjugates', growth: 'High', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  { name: 'Cell Therapy (Next Gen)', growth: 'Growing', color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
  { name: 'Digital Therapeutics', growth: 'Growing', color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
]

const capitalFlows = [
  { area: 'Oncology – Targeted Therapies', amount: '$4.2B', change: '+18% QoQ' },
  { area: 'Gene & Cell Therapy', amount: '$2.8B', change: '+12% QoQ' },
  { area: 'AI-Enabled Drug Discovery', amount: '$1.9B', change: '+34% QoQ' },
  { area: 'Rare Disease', amount: '$1.4B', change: '+9% QoQ' },
  { area: 'Diagnostics – Liquid Biopsy', amount: '$890M', change: '+22% QoQ' },
]

const geographicHotspots = [
  { city: 'Boston, MA', activity: 'Very High', companies: 48, signals: 23 },
  { city: 'San Francisco Bay Area', activity: 'High', companies: 41, signals: 19 },
  { city: 'San Diego, CA', activity: 'High', companies: 35, signals: 16 },
  { city: 'New York Metro', activity: 'Growing', companies: 28, signals: 12 },
  { city: 'Cambridge, UK', activity: 'Growing', companies: 19, signals: 8 },
]

const stageActivity = [
  { stage: 'Series A', signals: 18, pct: 35 },
  { stage: 'Series B', signals: 14, pct: 27 },
  { stage: 'Seed', signals: 10, pct: 19 },
  { stage: 'Series C', signals: 7, pct: 13 },
  { stage: 'Growth / Pre-IPO', signals: 3, pct: 6 },
]

const upcomingHires = [
  {
    role: 'Chief Scientific Officer',
    likelihood: 'Very High',
    signals: 12,
    reasoning: 'Post-Series B oncology companies building R&D leadership',
  },
  {
    role: 'VP Translational Biology',
    likelihood: 'High',
    signals: 9,
    reasoning: 'Clinical-stage companies advancing from discovery to clinic',
  },
  {
    role: 'Head of Clinical Strategy',
    likelihood: 'High',
    signals: 8,
    reasoning: 'Phase 2 completions driving Phase 3 planning hires',
  },
  {
    role: 'VP Regulatory Affairs',
    likelihood: 'High',
    signals: 7,
    reasoning: 'FDA submissions and Breakthrough Designations driving demand',
  },
  {
    role: 'Chief Medical Officer',
    likelihood: 'Growing',
    signals: 5,
    reasoning: 'Series C+ companies adding medical oversight for clinical programs',
  },
]

export default function TrendsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Market Intelligence</h1>
        <p className="text-sm text-slate-400 mt-1">
          Predictive market insights, capital flow patterns, and upcoming hiring signals
        </p>
      </div>

      {/* Growing Subsectors + Capital Flow */}
      <div className="grid grid-cols-2 gap-6">
        <Card className="card-hover">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <CardTitle className="text-base">Fastest Growing Areas</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {growingSubsectors.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-lg border border-slate-800 px-3 py-2.5"
                >
                  <span className="text-sm text-white">{item.name}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${item.bg} ${item.color}`}>
                    {item.growth}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-amber-400" />
              <CardTitle className="text-base">Capital Flow Patterns</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {capitalFlows.map((item) => (
                <div
                  key={item.area}
                  className="flex items-center justify-between rounded-lg border border-slate-800 px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm text-white">{item.area}</p>
                    <p className="text-xs text-emerald-400 font-medium mt-0.5">{item.change}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-bold text-white">{item.amount}</p>
                    <ArrowUp className="h-3 w-3 text-emerald-400" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Geographic Hotspots + Stage Activity */}
      <div className="grid grid-cols-2 gap-6">
        <Card className="card-hover">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-indigo-400" />
              <CardTitle className="text-base">Geographic Growth Hotspots</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {geographicHotspots.map((item, idx) => (
                <div
                  key={item.city}
                  className="flex items-center gap-3 rounded-lg border border-slate-800 px-3 py-2.5"
                >
                  <span className="text-xs font-bold text-slate-500 w-4">{idx + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm text-white">{item.city}</p>
                    <p className="text-xs text-slate-500">
                      {item.companies} companies · {item.signals} active signals
                    </p>
                  </div>
                  <Badge
                    variant={item.activity === 'Very High' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {item.activity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-400" />
              <CardTitle className="text-base">Company Stage Activity</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stageActivity.map((item) => (
                <div key={item.stage} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white">{item.stage}</span>
                    <span className="text-xs text-slate-400">
                      {item.signals} signals ({item.pct}%)
                    </span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-500"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Likely Upcoming Leadership Hires */}
      <Card className="card-hover">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-400" />
            <CardTitle className="text-base">Likely Upcoming Leadership Hires</CardTitle>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Predicted hiring patterns based on current market signals
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcomingHires.map((item) => (
              <div
                key={item.role}
                className="rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3"
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-white">{item.role}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-indigo-400">{item.signals} signals</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        item.likelihood === 'Very High'
                          ? 'bg-emerald-400/10 text-emerald-400'
                          : item.likelihood === 'High'
                          ? 'bg-amber-400/10 text-amber-400'
                          : 'bg-indigo-400/10 text-indigo-400'
                      }`}
                    >
                      {item.likelihood}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-500">{item.reasoning}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
