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

function AnalysisPanel() {
  const [activeTab, setActiveTab] = useState('trending')

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
          <p className={styles.placeholder}>Trending chart will appear here.</p>
        )}
        {activeTab === 'realtime' && (
          <p className={styles.placeholder}>Realtime data will appear here.</p>
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
          <p className={styles.placeholder}>Raw material consumption will appear here.</p>
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
          leftPanel={<AnalysisPanel />}
          rightPanel={<AnalysisPanel />}
        />
      </section>
    </div>
  )
}
