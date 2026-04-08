import { useTheme } from '../../context/ThemeContext'
import styles from './TopBar.module.css'

export default function TopBar({ menuOpen, onMenuToggle }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className={styles.topBar}>
      <div className={styles.left}>
        <button
          className={styles.menuToggle}
          onClick={onMenuToggle}
          title={menuOpen ? 'Toggle Menu' : 'Open Menu'}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
        <div className={styles.brand}>
          <span className={styles.brandName}>Analysis Engine</span>
          <span className={styles.brandSub}>Manufacturing Intelligence</span>
        </div>
      </div>

      <div className={styles.controls}>
        <button
          className={styles.themeToggle}
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? '☀ Light' : '☾ Dark'}
        </button>
        <button className={styles.loginBtn}>Login</button>
      </div>
    </header>
  )
}
