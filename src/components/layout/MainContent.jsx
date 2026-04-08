import styles from './MainContent.module.css'
import { useAnalysis } from '../../context/AnalysisContext'
import ColorAnalysisPage from '../../pages/ColorAnalysisPage'
import ProductRunPage from '../../pages/ProductRunPage'

export default function MainContent() {
  const { analysisType } = useAnalysis()

  if (analysisType === 'product_run')    return <ProductRunPage />
  if (analysisType === 'color_analysis') return <ColorAnalysisPage />

  return (
    <main className={styles.mainContent}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{sectionTitle(analysisType)}</h1>
      </div>

      {/* Content panels will be added per section in later phases */}
      <div className={styles.contentPlaceholder}>
        <div className={styles.placeholderCard}>
          <span className={styles.placeholderIcon}>⚙</span>
          <p>Content for <strong>{sectionTitle(analysisType)}</strong> will be built in the next phase.</p>
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
