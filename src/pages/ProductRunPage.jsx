import styles from './ProductRunPage.module.css'
import { useAnalysis } from '../context/AnalysisContext'
import { KpiCard, KpiCardSkeleton } from '../components/KpiCard'

export default function ProductRunPage() {
  const {
    startDate,
    endDate,
    selectedLines,
    analysisResults,
    isRunning,
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
    </div>
  )
}
