import styles from './MainContent.module.css'

export default function MainContent({ activeSection }) {
  return (
    <main className={styles.mainContent}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{sectionTitle(activeSection)}</h1>
      </div>

      {/* Content panels will be added per section in later phases */}
      <div className={styles.contentPlaceholder}>
        <div className={styles.placeholderCard}>
          <span className={styles.placeholderIcon}>⚙</span>
          <p>Content for <strong>{sectionTitle(activeSection)}</strong> will be built in the next phase.</p>
        </div>
      </div>
    </main>
  )
}

function sectionTitle(id) {
  const titles = {
    overview: 'Overview',
    production: 'Production Analysis',
    quality: 'Quality Analysis',
    downtime: 'Downtime Analysis',
  }
  return titles[id] ?? 'Analysis Engine'
}
