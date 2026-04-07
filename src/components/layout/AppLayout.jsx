import { useState } from 'react'
import TopBar from './TopBar'
import SideNav from './SideNav'
import MainContent from './MainContent'
import styles from './AppLayout.module.css'

export default function AppLayout() {
  const [activeSection, setActiveSection] = useState('overview')

  return (
    <div className={styles.appShell}>
      <TopBar />
      <div className={styles.body}>
        <SideNav activeSection={activeSection} onSectionChange={setActiveSection} />
        <MainContent activeSection={activeSection} />
      </div>
    </div>
  )
}
