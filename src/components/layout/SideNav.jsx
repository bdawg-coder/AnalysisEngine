import styles from './SideNav.module.css'

// Placeholder nav items — will be replaced with real filters/sections in later phases
const NAV_SECTIONS = [
  { id: 'overview', label: 'Overview', icon: '⬡' },
  { id: 'production', label: 'Production', icon: '⚙' },
  { id: 'quality', label: 'Quality', icon: '◎' },
  { id: 'downtime', label: 'Downtime', icon: '⚠' },
]

export default function SideNav({ activeSection, onSectionChange }) {
  return (
    <nav className={styles.sideNav}>
      <div className={styles.section}>
        <span className={styles.sectionLabel}>Analysis</span>
        <ul className={styles.navList}>
          {NAV_SECTIONS.map(item => (
            <li key={item.id}>
              <button
                className={`${styles.navItem} ${activeSection === item.id ? styles.active : ''}`}
                onClick={() => onSectionChange(item.id)}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span className={styles.navLabel}>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Filters panel will be inserted here in Phase 2 */}
      <div className={styles.filtersPlaceholder}>
        <span className={styles.sectionLabel}>Filters</span>
        <p className={styles.placeholderText}>Coming in Phase 2</p>
      </div>
    </nav>
  )
}
