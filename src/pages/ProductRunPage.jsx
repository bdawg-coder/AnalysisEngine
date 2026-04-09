import styles from './ProductRunPage.module.css'
import { useAnalysis } from '../context/AnalysisContext'
import { KpiCard, KpiCardSkeleton } from '../components/KpiCard'

const GROUP_LABELS = { month: 'Month', week: 'Week', day: 'Day', shift: 'Shift', run: 'Run' }

const COLUMNS = [
  { key: 'line',          header: 'Line'          },
  { key: 'groupedOption', header: null            },  // label comes from analysisResults.groupBy
  { key: 'startTime',     header: 'Start Time'    },
  { key: 'endTime',       header: 'End Time'      },
  { key: 'duration',      header: 'Duration'      },
  { key: 'runTime',       header: 'Run Time'      },
  { key: 'unplannedDT',   header: 'Unplanned DT'  },
  { key: 'plannedDT',     header: 'Planned DT'    },
  { key: 'oee',           header: 'OEE',    pct: true, color: true },
  { key: 'availability',  header: 'AVA',    pct: true, color: true },
  { key: 'performance',   header: 'PER',    pct: true, color: true },
  { key: 'quality',       header: 'QUAL',   pct: true, color: true },
  { key: 'infeed',        header: 'Infeed'         },
  { key: 'outfeed',       header: 'Outfeed'        },
  { key: 'scrap',         header: 'Scrap'          },
  { key: 'scrapPct',      header: 'Scrap %', pct: true },
  { key: 'targetRate',    header: 'Target Rate'    },
  { key: 'actualRate',    header: 'Actual Rate'    },
]

function metricColorClass(value) {
  if (value >= 90) return styles.tdGreen
  if (value > 50)  return styles.tdYellow
  return styles.tdRed
}

function RunAnalysisTable({ rows, groupBy, onRowClick }) {
  const groupLabel = GROUP_LABELS[groupBy] ?? 'Group'
  return (
    <section className={styles.tableSection}>
      <h2 className={styles.tableSectionTitle}>Post Run Analysis</h2>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {COLUMNS.map(col => (
                <th key={col.key} className={styles.th}>
                  {col.key === 'groupedOption' ? groupLabel : col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className={`${styles.trClickable}${i % 2 !== 0 ? ` ${styles.trOdd}` : ''}`}
                onClick={() => onRowClick(row)}
              >
                {COLUMNS.map(col => {
                  const colorClass = col.color ? metricColorClass(row[col.key]) : ''
                  return (
                    <td key={col.key} className={`${styles.td} ${colorClass}`}>
                      {col.pct ? `${row[col.key]}%` : row[col.key]}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default function ProductRunPage() {
  const {
    startDate,
    endDate,
    selectedLines,
    analysisResults,
    isRunning,
    setSelectedWorkOrder,
  } = useAnalysis()

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Product Run Analysis – Plant Overview</h1>
        <p className={styles.subtitle}>
          {startDate} – {endDate} · Lines: {selectedLines.size} selected
          {analysisResults && ` · ${analysisResults.totalLines} Lines`}
        </p>
      </header>

      <div className={styles.kpiGrid}>
        {isRunning ? (
          <>
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
          </>
        ) : (
          <>
            <KpiCard label="OEE"          data={analysisResults?.kpis.oee          ?? null} />
            <KpiCard label="Availability" data={analysisResults?.kpis.availability ?? null} />
            <KpiCard label="Performance"  data={analysisResults?.kpis.performance  ?? null} />
            <KpiCard label="Quality"      data={analysisResults?.kpis.quality      ?? null} />
          </>
        )}
      </div>

      {!isRunning && analysisResults?.rows?.length > 0 && (
        <RunAnalysisTable
          rows={analysisResults.rows}
          groupBy={analysisResults.groupBy}
          onRowClick={setSelectedWorkOrder}
        />
      )}
    </div>
  )
}
