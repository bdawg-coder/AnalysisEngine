import styles from './MainContent.module.css'
import { useAnalysis } from '../../context/AnalysisContext'
import ColorAnalysisPage from '../../pages/ColorAnalysisPage'
import ProductRunPage from '../../pages/ProductRunPage'
import OverviewAnalysisPage from '../../pages/OverviewAnalysisPage'

export default function MainContent() {
  const { analysisType, analysisResults, isRunning } = useAnalysis()

  if (analysisType === 'product_run') {
    if (isRunning || analysisResults) return <ProductRunPage />
    return (
      <OnboardingScreen
        title="Product Run Analysis"
        steps={[
          'Select Plant & Area',
          'Set Date Range',
          'Select Lines',
          'Click Run Analysis',
        ]}
      />
    )
  }

  if (analysisType === 'color_analysis') {
    if (isRunning || analysisResults) return <ColorAnalysisPage />
    return (
      <OnboardingScreen
        title="Color Analysis"
        steps={[
          'Select Plant & Area',
          'Set Date Range',
          'Select Lines & Product Family',
          'Choose Colors',
          'Click Run Analysis',
        ]}
      />
    )
  }

  if (isRunning || analysisResults) return <OverviewAnalysisPage />
  return (
    <OnboardingScreen
      title="Analysis Engine"
      steps={[
        'Select Plant & Area',
        'Choose Analysis Type (or use Overview Analysis)',
        'Set Date Range & Filters',
        'Click Run Analysis',
      ]}
    />
  )
}

function OnboardingScreen({ title, steps }) {
  return (
    <main className={styles.onboarding}>
      <div className={styles.onboardingCard}>
        <div className={styles.onboardingIcon}>⊞</div>
        <h1 className={styles.onboardingTitle}>{title}</h1>
        <p className={styles.onboardingSubtitle}>
          Set up your filters on the left, then click{' '}
          <span className={styles.onboardingAccent}>Run Analysis</span>
        </p>
        <ol className={styles.onboardingSteps}>
          {steps.map(step => <li key={step}>{step}</li>)}
        </ol>
      </div>
    </main>
  )
}
