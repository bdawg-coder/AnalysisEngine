import { useTheme } from '../../context/ThemeContext'
import styles from './TopBar.module.css'

export default function TopBar() {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className={styles.topBar}>
      <div className={styles.brand}>
        <span className={styles.brandName}>Analysis Engine</span>
        <span className={styles.brandSub}>Manufacturing Intelligence</span>
      </div>

      <div className={styles.controls}>
        <button
          className={styles.themeToggle}
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? '☀ Light' : '☾ Dark'}
        </button>
      </div>
    </header>
  )
}
