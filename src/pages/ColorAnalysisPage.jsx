import styles from './ColorAnalysisPage.module.css'
import { useAnalysis, SHIFTS } from '../context/AnalysisContext'

export default function ColorAnalysisPage() {
  const {
    startDate,
    endDate,
    shift,
    selectedLines,
    analysisResults,
    isRunning,
  } = useAnalysis()

  const shiftLabel = SHIFTS.find(s => s.value === shift)?.label ?? shift

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Color Analysis – Plant Overview</h1>
        <p className={styles.subtitle}>
          {startDate} – {endDate} · {shiftLabel} · Lines: {selectedLines.size} selected
          {analysisResults && ` · ${analysisResults.totalColors} Colors · ${analysisResults.totalLines} Lines`}
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
    </div>
  )
}

function kpiValueColorClass(value) {
  if (value >= 90) return styles.kpiValueGreen
  if (value > 50)  return styles.kpiValueYellow
  return styles.kpiValueRed
}

function KpiCard({ label, data }) {
  const valueClass = data ? kpiValueColorClass(data.value) : ''

  return (
    <div className={styles.kpiCard}>
      <span className={styles.kpiLabel}>{label}</span>
      <span className={`${styles.kpiValue} ${valueClass}`}>
        {data ? `${data.value}%` : '–'}
      </span>
      {data?.details?.length > 0 && (
        <>
          <hr className={styles.kpiDivider} />
          <dl className={styles.kpiDetails}>
            {data.details.map(d => (
              <div key={d.label} className={styles.kpiDetailRow}>
                <dt className={styles.kpiDetailLabel}>{d.label}</dt>
                <dd className={styles.kpiDetailValue}>{d.value}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </div>
  )
}

function KpiCardSkeleton() {
  return (
    <div className={`${styles.kpiCard} ${styles.skeleton}`}>
      <div className={`${styles.skeletonBar} ${styles.skeletonLabel}`} />
      <div className={`${styles.skeletonBar} ${styles.skeletonValue}`} />
      <div className={`${styles.skeletonBar} ${styles.skeletonDelta}`} />
      <div className={styles.skeletonDivider} />
      <div className={`${styles.skeletonBar} ${styles.skeletonDetail}`} />
      <div className={`${styles.skeletonBar} ${styles.skeletonDetail}`} />
    </div>
  )
}
