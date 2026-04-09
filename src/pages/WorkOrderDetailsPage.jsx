import { useState, useRef, useEffect } from 'react'
import styles from './WorkOrderDetailsPage.module.css'
import { useAnalysis } from '../context/AnalysisContext'

// ── Constants ────────────────────────────────────────────────────────────────

const MOCK_WO_DESCRIPTIONS = {
  'WO-10021': 'Black PE Pipe 1.25" OD',
  'WO-10022': 'Red HDPE Conduit 2.0" OD',
  'WO-10023': 'White PVC Tube 0.75" OD',
  'WO-10024': 'Gray PVC Conduit 3.0" OD',
  'WO-10025': 'White HDPE Pipe 0.5" OD',
  'WO-10026': 'Black PE Tube 1.0" OD',
}

const TOOL_DEFS = [
  { toolName: 'Die',                   maxCapacity: '50,000 lbs',  basePct: 45, materialBase: 840  },
  { toolName: 'Extruder Screw',        maxCapacity: '200,000 lbs', basePct: 22, materialBase: 3200 },
  { toolName: 'Extruder Barrel',       maxCapacity: '150,000 lbs', basePct: 18, materialBase: 2900 },
  { toolName: 'Co-Extruder Screw S1',  maxCapacity: '100,000 lbs', basePct: 31, materialBase: 1400 },
  { toolName: 'Co-Extruder Screw S2',  maxCapacity: '100,000 lbs', basePct: 28, materialBase: 1350 },
  { toolName: 'Co-Extruder Barrel S1', maxCapacity: '80,000 lbs',  basePct: 35, materialBase: 1100 },
  { toolName: 'Co-Extruder Barrel S2', maxCapacity: '80,000 lbs',  basePct: 33, materialBase: 1050 },
]

const DOWNTIME_REASONS = [
  { parent: 'Equipment', child: 'Die Jam'             },
  { parent: 'Material',  child: 'Surge'               },
  { parent: 'Equipment', child: 'Barrel Heater Fault' },
  { parent: 'Operator',  child: 'Setup Time'          },
  { parent: 'Equipment', child: 'Puller Fault'        },
]

// Fixed sequence template — durations are varied per WO via seed
const STATE_SEQUENCE = [
  { stateName: 'Running',      minMins: 60, maxMins: 120 },
  { stateName: 'Unplanned DT', minMins: 8,  maxMins: 18,  reasonBase: 0 },
  { stateName: 'Running',      minMins: 50, maxMins: 100 },
  { stateName: 'Planned DT',   minMins: 15, maxMins: 25,  reasonBase: 2 },
  { stateName: 'Running',      minMins: 70, maxMins: 130 },
  { stateName: 'Idle',         minMins: 10, maxMins: 20  },
  { stateName: 'Running',      minMins: 40, maxMins: 90  },
  { stateName: 'Unplanned DT', minMins: 5,  maxMins: 15,  reasonBase: 1 },
  { stateName: 'Running',      minMins: 60, maxMins: 110 },
]

const STATE_COLORS = {
  'Running':      'var(--color-success, #16a34a)',
  'Planned DT':   'var(--color-warning, #ca8a04)',
  'Unplanned DT': 'var(--color-danger,  #dc2626)',
  'Idle':         'var(--color-text-muted, #9ca3af)',
}

const TABS = [
  { id: 'trending',     label: 'Trending'      },
  { id: 'realtime',     label: 'Realtime'      },
  { id: 'notes',        label: 'Notes'         },
  { id: 'raw_material', label: 'Raw Material'  },
]

const MOCK_OPERATOR_NOTES = [
  {
    id: 1,
    author:    'J. Martinez',
    timestamp: 'Jan 6, 2025 08:14',
    text:      'Die pressure running slightly high at startup. Adjusted barrel temps +5°F. Stabilized after ~10 min.',
  },
  {
    id: 2,
    author:    'T. Nguyen',
    timestamp: 'Jan 6, 2025 10:42',
    text:      'Surge event — material feed interrupted for ~8 min. Cleared blockage at hopper throat. Back to normal rate.',
  },
  {
    id: 3,
    author:    'J. Martinez',
    timestamp: 'Jan 6, 2025 13:05',
    text:      'Planned changeover for die cleaning. 20 min downtime. All dimensions back in spec after restart.',
  },
  {
    id: 4,
    author:    'R. Okafor',
    timestamp: 'Jan 6, 2025 15:30',
    text:      'End-of-shift check: OEE tracking below target. Notified supervisor. Co-extruder S2 showing intermittent pressure drop.',
  },
]

// ── Mock Data Builders ───────────────────────────────────────────────────────

function buildMockTools(workOrder) {
  const seed = parseInt(workOrder.groupedOption?.replace('WO-', '') ?? '10021')
  return TOOL_DEFS.map((def, i) => {
    const pctOffset      = ((seed * 7919 + i * 31) % 200) - 100
    const pctLifeUsed    = Math.max(1, Math.min(99, Math.round((def.basePct + pctOffset * 0.1) * 10) / 10))
    const materialOffset = ((seed * 3571 + i * 17) % 200) - 100
    const materialRaw    = def.materialBase + materialOffset
    return {
      toolName: def.toolName,
      materialConsumed: `${materialRaw.toLocaleString()} lbs`,
      maxCapacity: def.maxCapacity,
      pctLifeUsed,
    }
  })
}

function buildMockStates(workOrder) {
  const seed      = parseInt(workOrder.groupedOption?.replace('WO-', '') ?? '10021')
  const totalMins = Math.round((parseFloat(workOrder.duration) || 8) * 60)

  const baseDate = new Date(workOrder.startTime)
  const useDate  = !isNaN(baseDate.getTime())

  const formatTime = (offsetMins) => {
    if (useDate) {
      const d = new Date(baseDate.getTime() + offsetMins * 60000)
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    }
    const h = Math.floor(offsetMins / 60)
    const m = offsetMins % 60
    return `+${h}h${m > 0 ? ` ${m}m` : ''}`
  }

  const states = []
  let elapsed  = 0

  for (let i = 0; i < STATE_SEQUENCE.length && elapsed < totalMins; i++) {
    const def          = STATE_SEQUENCE[i]
    const range        = def.maxMins - def.minMins
    const durationMins = def.minMins + ((seed * 3571 + i * 17) % range)
    const actual       = Math.min(durationMins, totalMins - elapsed)

    let downtimeReason = null
    if (def.reasonBase !== undefined) {
      downtimeReason = DOWNTIME_REASONS[(def.reasonBase + seed) % DOWNTIME_REASONS.length]
    }

    states.push({
      stateName:     def.stateName,
      startTime:     formatTime(elapsed),
      endTime:       formatTime(elapsed + actual),
      durationMs:    actual * 60000,
      downtimeReason,
    })

    elapsed += actual
  }

  return states
}

// ── Mock Tag Data ────────────────────────────────────────────────────────────

const MOCK_TAGS = [
  { id: 'feed_barrel',  label: 'Feed Barrel Zone',  group: 'Barrel Zones', setpoint: 50  },
  { id: 'barrel_1',    label: 'Barrel Zone 1',      group: 'Barrel Zones', setpoint: 200 },
  { id: 'barrel_2',    label: 'Barrel Zone 2',      group: 'Barrel Zones', setpoint: 200 },
  { id: 'barrel_3',    label: 'Barrel Zone 3',      group: 'Barrel Zones', setpoint: 200 },
  { id: 'barrel_4',    label: 'Barrel Zone 4',      group: 'Barrel Zones', setpoint: 195 },
  { id: 'barrel_5',    label: 'Barrel Zone 5',      group: 'Barrel Zones', setpoint: 195 },
  { id: 'barrel_6',    label: 'Barrel Zone 6',      group: 'Barrel Zones', setpoint: 190 },
  { id: 'barrel_7',    label: 'Barrel Zone 7',      group: 'Barrel Zones', setpoint: 185 },
  { id: 'barrel_8',    label: 'Barrel Zone 8',      group: 'Barrel Zones', setpoint: 180 },
  { id: 'barrel_9',    label: 'Barrel Zone 9',      group: 'Barrel Zones', setpoint: 175 },
  { id: 'barrel_10',   label: 'Barrel Zone 10',     group: 'Barrel Zones', setpoint: 170 },
  { id: 'barrel_11',   label: 'Barrel Zone 11',     group: 'Barrel Zones', setpoint: 165 },
  { id: 'barrel_12',   label: 'Barrel Zone 12',     group: 'Barrel Zones', setpoint: 150 },
  { id: 'aux_adapter', label: 'Aux Adapter Zone',   group: 'Barrel Zones', setpoint: 165 },
  { id: 'aux_die_1',   label: 'Aux Die Zone 1',     group: 'Die Zones',    setpoint: 160 },
  { id: 'aux_die_2',   label: 'Aux Die Zone 2',     group: 'Die Zones',    setpoint: 160 },
  { id: 'aux_die_3',   label: 'Aux Die Zone 3',     group: 'Die Zones',    setpoint: 165 },
  { id: 'aux_die_4',   label: 'Aux Die Zone 4',     group: 'Die Zones',    setpoint: 165 },
  { id: 'aux_die_5',   label: 'Aux Die Zone 5',     group: 'Die Zones',    setpoint: 170 },
  { id: 'aux_die_6',   label: 'Aux Die Zone 6',     group: 'Die Zones',    setpoint: 175 },
  { id: 'aux_die_7',   label: 'Aux Die Zone 7',     group: 'Die Zones',    setpoint: 175 },
  { id: 'aux_die_8',   label: 'Aux Die Zone 8',     group: 'Die Zones',    setpoint: 180 },
  { id: 'aux_die_9',   label: 'Aux Die Zone 9',     group: 'Die Zones',    setpoint: 180 },
]

const TAG_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
]

function buildMockTagSeries(tag, startIso, endIso, nPoints = 60) {
  const t0   = new Date(startIso).getTime()
  const t1   = new Date(endIso).getTime()
  const step = (t1 - t0) / (nPoints - 1)
  return Array.from({ length: nPoints }, (_, i) => {
    const ts    = new Date(t0 + i * step)
    const seed  = tag.id.charCodeAt(0) * 31 + i
    const noise = ((seed * 7919) % 100) / 100 - 0.5
    const actual = Math.round((tag.setpoint + noise * tag.setpoint * 0.04) * 10) / 10
    return { ts, setpoint: tag.setpoint, actual }
  })
}

// ── Mock Material Data ───────────────────────────────────────────────────────

const MOCK_MATERIALS = [
  { id: '12279', name: 'RCY Pellets',    baseConsumption: 24432 },
  { id: '12288', name: 'Repro Mix',      baseConsumption: 5656  },
  { id: '12289', name: 'Repro Trim',     baseConsumption: 0     },
  { id: '12477', name: 'Coupling Agent', baseConsumption: 727   },
  { id: '12478', name: 'Liquid Lube',    baseConsumption: 922   },
  { id: '12536', name: 'Wood',           baseConsumption: 39255 },
]

function buildMockMaterials(startIso, endIso, rangeStartIso, rangeEndIso) {
  const woDuration    = new Date(endIso).getTime()        - new Date(startIso).getTime()
  const rangeDuration = new Date(rangeEndIso).getTime()   - new Date(rangeStartIso).getTime()
  const ratio = woDuration > 0 ? Math.min(1, Math.max(0, rangeDuration / woDuration)) : 1
  return MOCK_MATERIALS.map(m => ({
    ...m,
    consumption: Math.round(m.baseConsumption * ratio),
  }))
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function lifeClass(pct) {
  if (pct >= 80) return styles.lifeHigh
  if (pct >= 50) return styles.lifeMid
  return styles.lifeLow
}

function formatDuration(ms) {
  const mins = Math.round(ms / 60000)
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

// ── Sub-Components ───────────────────────────────────────────────────────────

function TagSelector({ selectedTags, onToggle, onGroupToggle }) {
  const groups = [...new Set(MOCK_TAGS.map(t => t.group))]

  return (
    <div className={styles.tagSelector}>
      {groups.map(group => {
        const tags       = MOCK_TAGS.filter(t => t.group === group)
        const allSelected = tags.every(t => selectedTags.has(t.id))
        return (
          <div key={group} className={styles.tagGroup}>
            <div className={styles.tagGroupHeader}>
              <span>{group}</span>
              <button
                className={styles.tagGroupBtn}
                onClick={() => onGroupToggle(group, allSelected)}
              >
                {allSelected ? 'Clear' : 'Select All'}
              </button>
            </div>
            {tags.map(tag => (
              <label key={tag.id} className={styles.tagRow}>
                <input
                  type="checkbox"
                  checked={selectedTags.has(tag.id)}
                  onChange={() => onToggle(tag.id)}
                />
                <span>{tag.label}</span>
              </label>
            ))}
          </div>
        )
      })}
    </div>
  )
}

function TrendChart({ workOrder, selectedTags, selectedTimestamp, onTimestampSelect }) {
  const PAD = { top: 16, right: 16, bottom: 28, left: 44 }
  const W   = 800
  const H   = 280

  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top  - PAD.bottom

  const t0 = workOrder?.startTime ? new Date(workOrder.startTime).getTime() : 0
  const t1 = workOrder?.endTime   ? new Date(workOrder.endTime).getTime()   : t0 + 3600000

  const seriesData = selectedTags.map(tag =>
    buildMockTagSeries(tag, workOrder?.startTime ?? '', workOrder?.endTime ?? '')
  )

  const allActuals = seriesData.flatMap(s => s.map(p => p.actual))
  const yMin = allActuals.length ? Math.min(...allActuals) * 0.97 : 0
  const yMax = allActuals.length ? Math.max(...allActuals) * 1.03 : 100

  function toX(ts) {
    return PAD.left + ((ts - t0) / (t1 - t0)) * plotW
  }
  function toY(val) {
    return PAD.top + plotH - ((val - yMin) / (yMax - yMin)) * plotH
  }

  function handleClick(e) {
    const svg    = e.currentTarget
    const rect   = svg.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const svgX   = (clickX / rect.width) * W
    const ratio  = Math.max(0, Math.min(1, (svgX - PAD.left) / plotW))
    onTimestampSelect(new Date(t0 + ratio * (t1 - t0)))
  }

  const cursorX = selectedTimestamp
    ? toX(selectedTimestamp.getTime())
    : null

  if (selectedTags.length === 0) {
    return (
      <div className={styles.trendChart}>
        <p className={styles.trendEmpty}>Select tags above to view trends.</p>
      </div>
    )
  }

  return (
    <div className={styles.trendChart}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height: '100%', cursor: 'crosshair' }}
        onClick={handleClick}
      >
        {/* Y-axis ticks */}
        {[0, 0.25, 0.5, 0.75, 1].map(frac => {
          const val = yMin + frac * (yMax - yMin)
          const y   = toY(val)
          return (
            <g key={frac}>
              <line x1={PAD.left} x2={PAD.left + plotW} y1={y} y2={y} stroke="var(--color-border, #e5e7eb)" strokeWidth="0.5" />
              <text x={PAD.left - 4} y={y + 4} textAnchor="end" fontSize="10" fill="var(--color-text-muted, #6b7280)">
                {Math.round(val)}
              </text>
            </g>
          )
        })}

        {/* X-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map(frac => {
          const ts  = new Date(t0 + frac * (t1 - t0))
          const x   = PAD.left + frac * plotW
          const lbl = ts.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
          return (
            <text key={frac} x={x} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--color-text-muted, #6b7280)">
              {lbl}
            </text>
          )
        })}

        {/* Tag polylines */}
        {seriesData.map((series, i) => {
          const pts = series.map(p => `${toX(p.ts.getTime())},${toY(p.actual)}`).join(' ')
          return (
            <polyline
              key={selectedTags[i].id}
              points={pts}
              fill="none"
              stroke={TAG_COLORS[i % TAG_COLORS.length]}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          )
        })}

        {/* Cursor line */}
        {cursorX !== null && (
          <line
            x1={cursorX} x2={cursorX}
            y1={PAD.top} y2={PAD.top + plotH}
            stroke="var(--color-text, #111827)"
            strokeWidth="1"
            strokeDasharray="4 2"
          />
        )}
      </svg>
    </div>
  )
}

function ToolBreakdownTable({ tools }) {
  return (
    <table className={styles.toolTable}>
      <thead>
        <tr>
          <th className={styles.th}>Tool</th>
          <th className={styles.th}>Material Consumed</th>
          <th className={styles.th}>Max Capacity</th>
          <th className={styles.th}>% Tool Life Used</th>
        </tr>
      </thead>
      <tbody>
        {tools.map((tool, i) => (
          <tr key={i}>
            <td className={styles.td}>{tool.toolName}</td>
            <td className={styles.td}>{tool.materialConsumed}</td>
            <td className={styles.td}>{tool.maxCapacity}</td>
            <td className={`${styles.td} ${lifeClass(tool.pctLifeUsed)}`}>
              {tool.pctLifeUsed}%
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function StateTimeline({ states }) {
  const totalMs = states.reduce((sum, s) => sum + s.durationMs, 0)
  if (totalMs === 0) return null

  return (
    <div className={styles.timeline}>
      <div className={styles.timelineBar}>
        {states.map((state, i) => {
          const widthPct = (state.durationMs / totalMs) * 100
          return (
            <div
              key={i}
              className={styles.timelineSegment}
              style={{
                width:      `${widthPct}%`,
                background: STATE_COLORS[state.stateName] ?? STATE_COLORS['Idle'],
              }}
            >
              <div className={styles.tooltip}>
                <div className={styles.tooltipName}>{state.stateName}</div>
                <div>{formatDuration(state.durationMs)}</div>
                <div>{state.startTime} – {state.endTime}</div>
                {state.downtimeReason && (
                  <div className={styles.tooltipReason}>
                    {state.downtimeReason.parent}: {state.downtimeReason.child}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className={styles.timelineLegend}>
        {Object.entries(STATE_COLORS).map(([name, color]) => (
          <span key={name} className={styles.legendItem}>
            <span className={styles.legendSwatch} style={{ background: color }} />
            {name}
          </span>
        ))}
      </div>
    </div>
  )
}

function SnapshotTable({ selectedTags, timestamp, workOrder }) {
  if (!timestamp || selectedTags.length === 0) return null

  const t   = timestamp.getTime()
  const t0  = workOrder?.startTime ? new Date(workOrder.startTime).getTime() : 0
  const t1  = workOrder?.endTime   ? new Date(workOrder.endTime).getTime()   : t0 + 3600000

  // For each tag, find the two series points bracketing `timestamp` and interpolate
  function interpolate(tag) {
    const series = buildMockTagSeries(tag, workOrder?.startTime ?? '', workOrder?.endTime ?? '')
    if (series.length === 0) return { setpoint: tag.setpoint, actual: tag.setpoint }
    const clamped = Math.max(t0, Math.min(t1, t))
    // Find index of first point >= clamped
    let hi = series.findIndex(p => p.ts.getTime() >= clamped)
    if (hi === -1) hi = series.length - 1
    if (hi === 0) return { setpoint: series[0].setpoint, actual: series[0].actual }
    const lo   = hi - 1
    const pLo  = series[lo]
    const pHi  = series[hi]
    const frac = (clamped - pLo.ts.getTime()) / (pHi.ts.getTime() - pLo.ts.getTime())
    const actual = Math.round((pLo.actual + frac * (pHi.actual - pLo.actual)) * 10) / 10
    return { setpoint: pLo.setpoint, actual }
  }

  const groups = [...new Set(selectedTags.map(t => t.group))]
  const label  = timestamp.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  })

  return (
    <div>
      <p className={styles.snapshotTimestamp}>Snapshot at {label}</p>
      <table className={styles.snapshotTable}>
        <thead>
          <tr>
            <th className={styles.snapshotTd}>Zone</th>
            <th className={`${styles.snapshotTd} ${styles.snapshotTdNum}`}>Setpoint</th>
            <th className={`${styles.snapshotTd} ${styles.snapshotTdNum}`}>Actual</th>
          </tr>
        </thead>
        <tbody>
          {groups.map(group => {
            const tags = selectedTags.filter(t => t.group === group)
            return [
              <tr key={`grp-${group}`}>
                <td colSpan={3} className={styles.snapshotGroupHeader}>{group}</td>
              </tr>,
              ...tags.map(tag => {
                const { setpoint, actual } = interpolate(tag)
                return (
                  <tr key={tag.id}>
                    <td className={styles.snapshotTd}>{tag.label}</td>
                    <td className={`${styles.snapshotTd} ${styles.snapshotTdNum}`}>{setpoint.toFixed(1)}</td>
                    <td className={`${styles.snapshotTd} ${styles.snapshotTdNum}`}>{actual.toFixed(1)}</td>
                  </tr>
                )
              }),
            ]
          })}
        </tbody>
      </table>
    </div>
  )
}

function RawMaterialPanel({ workOrder, rangeStart, rangeEnd, onRangeChange }) {
  function toInputVal(isoOrFmt) {
    const d = new Date(isoOrFmt)
    if (isNaN(d.getTime())) return ''
    const pad = n => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const materials = workOrder
    ? buildMockMaterials(workOrder.startTime, workOrder.endTime, rangeStart, rangeEnd)
    : []
  const total = materials.reduce((sum, m) => sum + m.consumption, 0)

  return (
    <div className={styles.rawMatPanel}>
      <div className={styles.rawMatRangeRow}>
        <label className={styles.rawMatLabel}>From</label>
        <input
          type="datetime-local"
          className={styles.rawMatInput}
          value={toInputVal(rangeStart)}
          min={toInputVal(workOrder?.startTime ?? '')}
          max={toInputVal(workOrder?.endTime ?? '')}
          onChange={e => onRangeChange(e.target.value, rangeEnd)}
        />
        <label className={styles.rawMatLabel}>To</label>
        <input
          type="datetime-local"
          className={styles.rawMatInput}
          value={toInputVal(rangeEnd)}
          min={toInputVal(workOrder?.startTime ?? '')}
          max={toInputVal(workOrder?.endTime ?? '')}
          onChange={e => onRangeChange(rangeStart, e.target.value)}
        />
      </div>
      <table className={styles.rawMatTable}>
        <thead>
          <tr>
            <th className={styles.rawMatTd}>Material</th>
            <th className={`${styles.rawMatTd} ${styles.rawMatTdNum}`}>Consumption (lbs)</th>
          </tr>
        </thead>
        <tbody>
          {materials.map(m => (
            <tr key={m.id}>
              <td className={styles.rawMatTd}>{m.name} – {m.id}</td>
              <td className={`${styles.rawMatTd} ${styles.rawMatTdNum}`}>{m.consumption.toLocaleString()}</td>
            </tr>
          ))}
          <tr className={`${styles.rawMatTotal} ${styles.rawMatTotalBorder}`}>
            <td className={styles.rawMatTd}>Total</td>
            <td className={`${styles.rawMatTd} ${styles.rawMatTdNum}`}>{total.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function AnalysisPanel({ workOrder }) {
  const [activeTab,          setActiveTab]          = useState('trending')
  const [selectedTags,       setSelectedTags]       = useState(new Set())
  const [selectedTimestamp,  setSelectedTimestamp]  = useState(null)
  const [realtimeTimestamp,  setRealtimeTimestamp]  = useState(null)
  const [matRangeStart,      setMatRangeStart]      = useState(workOrder?.startTime ?? '')
  const [matRangeEnd,        setMatRangeEnd]        = useState(workOrder?.endTime   ?? '')

  return (
    <div className={styles.analysisPanel}>
      <div className={styles.tabBar}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tabBtn}${activeTab === tab.id ? ` ${styles.tabBtnActive}` : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className={styles.tabContent}>
        {activeTab === 'trending' && (
          <div className={styles.trendingTab}>
            <TagSelector
              selectedTags={selectedTags}
              onToggle={id => setSelectedTags(prev => {
                const next = new Set(prev)
                next.has(id) ? next.delete(id) : next.add(id)
                return next
              })}
              onGroupToggle={(group, allSelected) => {
                const ids = MOCK_TAGS.filter(t => t.group === group).map(t => t.id)
                setSelectedTags(prev => {
                  const next = new Set(prev)
                  if (allSelected) ids.forEach(id => next.delete(id))
                  else ids.forEach(id => next.add(id))
                  return next
                })
              }}
            />
            <TrendChart
              workOrder={workOrder}
              selectedTags={MOCK_TAGS.filter(t => selectedTags.has(t.id))}
              selectedTimestamp={selectedTimestamp}
              onTimestampSelect={setSelectedTimestamp}
            />
          </div>
        )}
        {activeTab === 'realtime' && (
          <div className={styles.realtimeTab}>
            {(() => {
              // datetime-local inputs require "YYYY-MM-DDTHH:MM" format
              function toInputVal(isoOrFmt) {
                const d = new Date(isoOrFmt)
                if (isNaN(d.getTime())) return ''
                const pad = n => String(n).padStart(2, '0')
                return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
              }
              const minVal = toInputVal(workOrder?.startTime ?? '')
              const maxVal = toInputVal(workOrder?.endTime   ?? '')
              const curVal = realtimeTimestamp ? toInputVal(realtimeTimestamp.toISOString()) : ''

              function handleChange(e) {
                const d = new Date(e.target.value)
                if (!isNaN(d.getTime())) setRealtimeTimestamp(d)
              }

              return (
                <>
                  <div className={styles.realtimeInputRow}>
                    <label className={styles.realtimeLabel}>Select Timestamp</label>
                    <input
                      type="datetime-local"
                      className={styles.realtimeInput}
                      min={minVal}
                      max={maxVal}
                      value={curVal}
                      onChange={handleChange}
                    />
                  </div>
                  <SnapshotTable
                    selectedTags={MOCK_TAGS}
                    timestamp={realtimeTimestamp}
                    workOrder={workOrder}
                  />
                  {!realtimeTimestamp && (
                    <p className={styles.placeholder}>Select a timestamp above to view tag values.</p>
                  )}
                </>
              )
            })()}
          </div>
        )}
        {activeTab === 'notes' && (
          <div className={styles.notesFeed}>
            {MOCK_OPERATOR_NOTES.map(note => (
              <div key={note.id} className={styles.noteCard}>
                <div className={styles.noteMeta}>
                  <span className={styles.noteAuthor}>{note.author}</span>
                  <span className={styles.noteTimestamp}>{note.timestamp}</span>
                </div>
                <p className={styles.noteText}>{note.text}</p>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'raw_material' && (
          <RawMaterialPanel
            workOrder={workOrder}
            rangeStart={matRangeStart}
            rangeEnd={matRangeEnd}
            onRangeChange={(s, e) => { setMatRangeStart(s); setMatRangeEnd(e) }}
          />
        )}
      </div>
    </div>
  )
}

function SplitPane({ leftPanel, rightPanel }) {
  const [leftWidthPct, setLeftWidthPct] = useState(50)
  const isDragging   = useRef(false)
  const containerRef = useRef(null)

  useEffect(() => {
    function onMouseMove(e) {
      if (!isDragging.current || !containerRef.current) return
      const rect   = containerRef.current.getBoundingClientRect()
      const rawPct = ((e.clientX - rect.left) / rect.width) * 100
      setLeftWidthPct(Math.min(80, Math.max(20, rawPct)))
    }

    function onMouseUp() {
      if (!isDragging.current) return
      isDragging.current             = false
      document.body.style.cursor     = ''
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup',   onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup',   onMouseUp)
    }
  }, [])

  function handleDividerMouseDown(e) {
    e.preventDefault()
    isDragging.current             = true
    document.body.style.cursor     = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  return (
    <div className={styles.splitContainer} ref={containerRef}>
      <div className={styles.splitPanel} style={{ width: `${leftWidthPct}%` }}>
        {leftPanel}
      </div>
      <div className={styles.divider} onMouseDown={handleDividerMouseDown} />
      <div className={styles.splitPanel} style={{ flex: 1, minWidth: 0 }}>
        {rightPanel}
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function WorkOrderDetailsPage() {
  const { selectedWorkOrder, setSelectedWorkOrder } = useAnalysis()
  const wo = selectedWorkOrder

  const description = MOCK_WO_DESCRIPTIONS[wo?.groupedOption] ?? '—'
  const tools       = buildMockTools(wo ?? {})
  const states      = buildMockStates(wo ?? {})

  return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={() => setSelectedWorkOrder(null)}>
        ← Back to Product Run
      </button>

      <section className={styles.section}>
        <h1 className={styles.sectionTitle}>Work Order Details</h1>
        <div className={styles.headerGrid}>
          <span className={styles.headerLabel}>Line</span>
          <span className={styles.headerValue}>{wo?.line ?? '—'}</span>

          <span className={styles.headerLabel}>Work Order</span>
          <span className={styles.headerValue}>{wo?.groupedOption ?? '—'}</span>

          <span className={styles.headerLabel}>Description</span>
          <span className={styles.headerValue}>{description}</span>

          <span className={styles.headerLabel}>Start Time</span>
          <span className={styles.headerValue}>{wo?.startTime ?? '—'}</span>

          <span className={styles.headerLabel}>End Time</span>
          <span className={styles.headerValue}>{wo?.endTime ?? '—'}</span>

          <span className={styles.headerLabel}>Total Duration</span>
          <span className={styles.headerValue}>{wo?.duration ?? '—'}</span>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Tool Usage Breakdown</h2>
        <div className={styles.tableWrapper}>
          <ToolBreakdownTable tools={tools} />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>State Timeline</h2>
        <StateTimeline states={states} />
      </section>

      <section className={styles.splitSection}>
        <h2 className={styles.sectionTitle}>Analysis</h2>
        <SplitPane
          leftPanel={<AnalysisPanel  workOrder={wo} />}
          rightPanel={<AnalysisPanel workOrder={wo} />}
        />
      </section>
    </div>
  )
}
