import { createContext, useContext, useState, useMemo, useEffect } from 'react'

export const PLANTS = [
  { value: 'all', label: 'All' },
  { value: '1nl', label: '1NL' },
]

export const ANALYSIS_TYPES = [
  { value: 'product_run',    label: 'Product Run' },
  { value: 'color_analysis', label: 'Color Analysis' },
]

export const AREAS = {
  all:  ['All', 'PE'],
  '1nl': ['All', 'PE'],
}

// Mock parameter data — replace with API/config calls later
export const LINES = ['L-19', 'L-20', 'L-21', 'L-22', 'L-23', 'L-24']

export const PRODUCT_FAMILIES = ['Good Life', 'ArmorGuard', 'Sanctuary']

export const COLORS = [
  { id: 'stone-gray',   label: 'Stone Gray',  hex: '#8a9090', families: ['Good Life', 'ArmorGuard'] },
  { id: 'cabana',       label: 'Cabana',       hex: '#b89560', families: ['Good Life'] },
  { id: 'cottage',      label: 'Cottage',      hex: '#a8ad8a', families: ['Good Life', 'Sanctuary'] },
  { id: 'bungalow',     label: 'Bungalow',     hex: '#c4b070', families: ['Good Life'] },
  { id: 'beach-house',  label: 'Beach House',  hex: '#c8a040', families: ['Good Life'] },
  { id: 'earl-grey',    label: 'Earl Grey',    hex: '#707878', families: ['Good Life', 'ArmorGuard'] },
  { id: 'coastal-gray', label: 'Coastal Gray', hex: '#5a6060', families: ['ArmorGuard'] },
]

// Seed-based pseudo-random so values look realistic but are deterministic
function fakeMetric(base, range, seed) {
  return Math.round((base + ((seed * 7919) % range) - range / 2) * 10) / 10
}

// Returns [{label, isoDate, time?}] derived from the actual date range + groupBy
function buildGroupOptions(groupBy, startDate, endDate) {
  const start = new Date(startDate + 'T00:00:00')
  const end   = new Date(endDate   + 'T00:00:00')

  if (groupBy === 'month') {
    const opts = []
    const d = new Date(start.getFullYear(), start.getMonth(), 1)
    while (d <= end && opts.length < 6) {
      opts.push({ label: d.toLocaleDateString('en-US', { month: 'short' }), date: new Date(d) })
      d.setMonth(d.getMonth() + 1)
    }
    return opts.length ? opts : [{ label: 'Jan', date: start }]
  }

  if (groupBy === 'week') {
    const opts = []
    const d = new Date(start)
    let n = 1
    while (d <= end && opts.length < 8) {
      opts.push({ label: `Week ${n}`, date: new Date(d) })
      d.setDate(d.getDate() + 7)
      n++
    }
    return opts.length ? opts : [{ label: 'Week 1', date: start }]
  }

  if (groupBy === 'day') {
    const opts = []
    const d = new Date(start)
    while (d <= end && opts.length < 7) {
      const iso = d.toISOString().slice(0, 10)
      opts.push({ label: iso, date: new Date(d) })
      d.setDate(d.getDate() + 1)
    }
    return opts.length ? opts : [{ label: startDate, date: start }]
  }

  if (groupBy === 'shift') {
    // 2-2-3 pitman schedule, 7-7 shifts: A & B = day (07:00–19:00), C & D = night (19:00–07:00)
    return [
      { label: 'Shift A', date: start, isDay: true  },
      { label: 'Shift B', date: start, isDay: true  },
      { label: 'Shift C', date: start, isDay: false },
      { label: 'Shift D', date: start, isDay: false },
    ]
  }

  if (groupBy === 'run') {
    const totalDays = Math.max(1, Math.ceil((end - start) / 86400000))
    const count = Math.min(Math.max(Math.ceil(totalDays / 7), 3), 6)
    const step  = Math.floor(totalDays / count)
    return Array.from({ length: count }, (_, i) => {
      const d = new Date(start)
      d.setDate(d.getDate() + i * step)
      return { label: `WO-${10021 + i}`, date: new Date(d) }
    })
  }

  return buildGroupOptions('month', startDate, endDate)
}

function getRowTimes(groupBy, option) {
  const fmt  = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const iso  = (d) => d.toISOString().slice(0, 10)

  if (groupBy === 'month') {
    const endOfMonth = new Date(option.date.getFullYear(), option.date.getMonth() + 1, 0)
    return { startTime: `${fmt(option.date)} 07:00`, endTime: `${fmt(endOfMonth)} 19:00` }
  }
  if (groupBy === 'week') {
    const weekEnd = new Date(option.date)
    weekEnd.setDate(weekEnd.getDate() + 6)
    return { startTime: `${fmt(option.date)} 07:00`, endTime: `${fmt(weekEnd)} 19:00` }
  }
  if (groupBy === 'day') {
    return { startTime: `${option.label} 07:00`, endTime: `${option.label} 19:00` }
  }
  if (groupBy === 'shift') {
    if (option.isDay) {
      return { startTime: `${iso(option.date)} 07:00`, endTime: `${iso(option.date)} 19:00` }
    }
    const nextDay = new Date(option.date)
    nextDay.setDate(nextDay.getDate() + 1)
    return { startTime: `${iso(option.date)} 19:00`, endTime: `${iso(nextDay)} 07:00` }
  }
  if (groupBy === 'run') {
    const runEnd = new Date(option.date)
    runEnd.setDate(runEnd.getDate() + 4)
    return { startTime: `${fmt(option.date)} 07:00`, endTime: `${fmt(runEnd)} 19:00` }
  }
  return { startTime: `${iso(option.date)} 07:00`, endTime: `${iso(option.date)} 19:00` }
}

function buildMockRows(groupBy, selectedLines, startDate, endDate) {
  const lines   = [...selectedLines]
  const options = buildGroupOptions(groupBy, startDate, endDate)
  const rows    = []
  lines.forEach((line, li) => {
    options.forEach((option, gi) => {
      const seed        = li * options.length + gi
      const targetRate  = 1200 + li * 50
      const actualRate  = Math.round(targetRate * fakeMetric(0.91, 0.12, seed + 1) * 10) / 10
      const duration    = fakeMetric(8.0, 2.0, seed + 2)
      const runTime     = Math.round(duration * fakeMetric(0.88, 0.1, seed + 3) * 10) / 10
      const unplannedDT = Math.round((duration - runTime) * 0.6 * 10) / 10
      const plannedDT   = Math.round((duration - runTime - unplannedDT) * 10) / 10
      const oee         = fakeMetric(83, 14, seed + 4)
      const availability = fakeMetric(88, 10, seed + 5)
      const performance  = fakeMetric(91, 8,  seed + 6)
      const quality      = fakeMetric(95, 6,  seed + 7)
      const infeed       = Math.round(targetRate * fakeMetric(1.02, 0.06, seed + 8))
      const outfeed      = Math.round(infeed * fakeMetric(0.96, 0.06, seed + 9))
      const scrap        = infeed - outfeed
      const scrapPct     = Math.round((scrap / infeed) * 1000) / 10
      const { startTime, endTime } = getRowTimes(groupBy, option)
      rows.push({
        line,
        groupedOption: option.label,
        startTime,
        endTime,
        duration:      `${duration} hrs`,
        runTime:       `${runTime} hrs`,
        unplannedDT:   `${unplannedDT} hrs`,
        plannedDT:     `${plannedDT} hrs`,
        oee, availability, performance, quality,
        infeed, outfeed, scrap, scrapPct,
        targetRate, actualRate,
      })
    })
  })
  return rows
}

const MOCK_RESULTS = {
  totalColors: 7,
  totalLines: 6,
  kpis: {
    oee: {
      value: 82.3, vsPrev: +1.5,
      details: [
        { label: 'Availability', value: '87.4%' },
        { label: 'Performance',  value: '91.2%' },
        { label: 'Quality',      value: '94.7%' },
      ],
    },
    availability: {
      value: 87.4, vsPrev: +2.1,
      details: [
        { label: 'Run Time',  value: '14.2 hrs' },
        { label: 'Down Time', value: '1.8 hrs'  },
      ],
    },
    performance: {
      value: 91.2, vsPrev: -0.8,
      details: [
        { label: 'Actual Rate', value: '94 lbs/hr'  },
        { label: 'Target Rate', value: '103 lbs/hr' },
      ],
    },
    quality: {
      value: 94.7, vsPrev: +1.3,
      details: [
        { label: 'Good Lbs',  value: '1,240' },
        { label: 'Scrap Lbs', value: '87'    },
      ],
    },
  },
}

const AnalysisContext = createContext(null)

export function AnalysisProvider({ children }) {
  const [plant,            setPlant]            = useState('all')
  const [area,             setArea]             = useState('All')
  const [analysisType,     setAnalysisType]     = useState('')
  const [startDate,        setStartDate]        = useState('2025-01-01')
  const [endDate,          setEndDate]          = useState('2025-03-31')
  const [groupBy,          setGroupBy]          = useState('')
  const [selectedLines,    setSelectedLines]    = useState(new Set(LINES))
  const [selectedFamilies, setSelectedFamilies] = useState(new Set())
  const [selectedColors,   setSelectedColors]   = useState(new Set(COLORS.map(c => c.id)))
  const [analysisResults,  setAnalysisResults]  = useState(null)
  const [isRunning,        setIsRunning]        = useState(false)
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null)

  // Filter colors by selected product families (empty selection = show all)
  const availableColors = useMemo(() => {
    if (selectedFamilies.size === 0) return COLORS
    return COLORS.filter(c => c.families.some(f => selectedFamilies.has(f)))
  }, [selectedFamilies])

  const dateError =
    startDate && endDate && endDate < startDate
      ? 'End date cannot be before start date'
      : null

  const canRun =
    startDate !== '' &&
    endDate   !== '' &&
    !dateError &&
    selectedLines.size > 0 &&
    (analysisType !== '' || groupBy !== '')

  function toggle(setter, value) {
    setter(prev => {
      const next = new Set(prev)
      next.has(value) ? next.delete(value) : next.add(value)
      return next
    })
  }

  function toggleAllFamilies() {
    setSelectedFamilies(new Set())
  }

  function toggleAllColors() {
    const ids = availableColors.map(c => c.id)
    const allOn = ids.every(id => selectedColors.has(id))
    setSelectedColors(allOn ? new Set() : new Set(ids))
  }

  function clearAll() {
    setPlant('all')
    setArea('All')
    setAnalysisType('')
    setStartDate('')
    setEndDate('')
    setGroupBy('')
    setSelectedLines(new Set(LINES))
    setSelectedFamilies(new Set())
    setSelectedColors(new Set(COLORS.map(c => c.id)))
    setAnalysisResults(null)
    setIsRunning(false)
    setSelectedWorkOrder(null)
  }

  function runAnalysis() {
    if (!canRun) return
    setSelectedWorkOrder(null)
    setIsRunning(true)
    setAnalysisResults(null)
    // Snapshot filter state at call time so async result reflects what was selected
    const effectiveGroupBy = groupBy || (analysisType === 'product_run' ? 'run' : 'month')
    if (!groupBy) setGroupBy(effectiveGroupBy)
    const snap = { groupBy: effectiveGroupBy, selectedLines, startDate, endDate }
    setTimeout(() => {
      setAnalysisResults({
        ...MOCK_RESULTS,
        groupBy: snap.groupBy,
        rows: buildMockRows(snap.groupBy, snap.selectedLines, snap.startDate, snap.endDate),
      })
      setIsRunning(false)
    }, 600)
  }

  // Auto-initialize Product Run Analysis when navigating to it with no existing results
  useEffect(() => {
    if (analysisType === 'product_run' && !analysisResults && !isRunning) {
      runAnalysis()
    }
  }, [analysisType]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AnalysisContext.Provider value={{
      plant,        setPlant,
      area,         setArea,
      analysisType, setAnalysisType,
      startDate,    setStartDate,
      endDate,      setEndDate,
      groupBy,      setGroupBy,
      selectedLines,    toggleLine:       v => toggle(setSelectedLines,    v),
      selectedFamilies, toggleFamily:     v => toggle(setSelectedFamilies, v),
      selectedColors,   toggleColor:      v => toggle(setSelectedColors,   v),
      toggleAllFamilies,
      toggleAllColors,
      clearAll,
      availableColors,
      dateError,
      canRun,
      runAnalysis,
      analysisResults,
      isRunning,
      selectedWorkOrder, setSelectedWorkOrder,
    }}>
      {children}
    </AnalysisContext.Provider>
  )
}

export function useAnalysis() {
  const ctx = useContext(AnalysisContext)
  if (!ctx) throw new Error('useAnalysis must be used within AnalysisProvider')
  return ctx
}
