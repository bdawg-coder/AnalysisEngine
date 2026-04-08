import { useState } from 'react'
import { AnalysisProvider } from '../../context/AnalysisContext'
import TopBar from './TopBar'
import SideNav from './SideNav'
import MainContent from './MainContent'
import styles from './AppLayout.module.css'

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(true)

  return (
    <AnalysisProvider>
      <div className={styles.appShell}>
        <TopBar menuOpen={menuOpen} onMenuToggle={() => setMenuOpen(v => !v)} />
        <div className={styles.body}>
          <SideNav collapsed={!menuOpen} />
          <MainContent />
        </div>
      </div>
    </AnalysisProvider>
  )
}
