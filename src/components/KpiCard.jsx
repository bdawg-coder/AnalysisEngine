import styles from './KpiCard.module.css'

function kpiValueColorClass(value) {
  if (value >= 90) return styles.kpiValueGreen
  if (value > 50)  return styles.kpiValueYellow
  return styles.kpiValueRed
}

export function KpiCard({ label, data }) {
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

export function KpiCardSkeleton() {
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
