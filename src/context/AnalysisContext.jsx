import { createContext, useContext, useState, useMemo } from 'react'

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
  }

  function runAnalysis() {
    if (!canRun) return
    setIsRunning(true)
    setAnalysisResults(null)
    setTimeout(() => {
      setAnalysisResults(MOCK_RESULTS)
      setIsRunning(false)
    }, 600)
  }

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
