import {
  useAnalysis,
  PLANTS, ANALYSIS_TYPES, SHIFTS, LINES, PRODUCT_FAMILIES,
} from '../../context/AnalysisContext'
import styles from './SideNav.module.css'

export default function SideNav({ collapsed }) {
  const {
    plant,        setPlant,
    analysisType, setAnalysisType,
    startDate,    setStartDate,
    endDate,      setEndDate,
    shift,        setShift,
    selectedLines,    toggleLine,
    selectedFamilies, toggleFamily, toggleAllFamilies,
    selectedColors,   toggleColor,  toggleAllColors,
    availableColors,
    dateError,
    canRun,
    runAnalysis,
    clearAll,
  } = useAnalysis()

  const allFamiliesOn = selectedFamilies.size === 0
  const allColorsOn   =
    availableColors.length > 0 &&
    availableColors.every(c => selectedColors.has(c.id))

  return (
    <nav className={styles.sideNav} data-collapsed={collapsed}>
      {!collapsed && (
        <>
          {/* ── Header ── */}
          <div className={styles.header}>
            <span className={styles.brand}>FIBERON</span>
          </div>

          <div className={styles.scrollContent}>

            {/* ── Plant ── */}
            <div className={styles.section}>
              <span className={styles.sectionLabel}>Plant</span>
              <select
                className={styles.select}
                value={plant}
                onChange={e => setPlant(e.target.value)}
              >
                {PLANTS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            {/* ── Analysis Type ── */}
            <div className={styles.section}>
              <span className={styles.sectionLabel}>Analysis Type</span>
              <select
                className={styles.select}
                value={analysisType}
                onChange={e => setAnalysisType(e.target.value)}
              >
                <option value="">Select type…</option>
                {ANALYSIS_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* ── Date Range ── */}
            <div className={styles.section}>
              <span className={styles.sectionLabel}>Date Range</span>
              <div className={styles.dateStack}>
                <input
                  className={`${styles.dateInput}${dateError ? ` ${styles.inputError}` : ''}`}
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
                <input
                  className={`${styles.dateInput}${dateError ? ` ${styles.inputError}` : ''}`}
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
              </div>
              {dateError && <span className={styles.errorText}>{dateError}</span>}
            </div>

            {/* ── Lines ── */}
            <div className={styles.section}>
              <span className={styles.sectionLabel}>Lines</span>
              <div className={styles.lineGrid}>
                {LINES.map(line => (
                  <button
                    key={line}
                    className={`${styles.linePill}${selectedLines.has(line) ? ` ${styles.linePillActive}` : ''}`}
                    onClick={() => toggleLine(line)}
                  >
                    {line}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Shift ── */}
            <div className={styles.section}>
              <span className={styles.sectionLabel}>Shift</span>
              <select
                className={styles.select}
                value={shift}
                onChange={e => setShift(e.target.value)}
              >
                {SHIFTS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* ── Actions: Run + Clear ── */}
            <div className={styles.section}>
              <button
                className={styles.runBtn}
                disabled={!canRun}
                onClick={runAnalysis}
              >
                RUN ANALYSIS ↗
              </button>
              <button className={styles.clearBtn} onClick={clearAll}>
                Clear all
              </button>
            </div>

            {/* ── Color Analysis Filters (conditional) ── */}
            {analysisType === 'color_analysis' && (
              <>
                {/* Product Family */}
                <div className={styles.section}>
                  <span className={styles.sectionLabel}>Product Family</span>
                  <div className={styles.selectList}>
                    <button
                      className={`${styles.selectRow}${allFamiliesOn ? ` ${styles.selectRowActive}` : ''}`}
                      onClick={toggleAllFamilies}
                    >
                      <span className={`${styles.selectSwatch} ${styles.swatchAccent}`} />
                      <span className={styles.selectLabel}>All Families</span>
                      {allFamiliesOn && <span className={styles.checkmark}>✓</span>}
                    </button>
                    {PRODUCT_FAMILIES.map(fam => (
                      <button
                        key={fam}
                        className={`${styles.selectRow}${selectedFamilies.has(fam) ? ` ${styles.selectRowActive}` : ''}`}
                        onClick={() => toggleFamily(fam)}
                      >
                        <span className={styles.selectSwatch} />
                        <span className={styles.selectLabel}>{fam}</span>
                        {selectedFamilies.has(fam) && <span className={styles.checkmark}>✓</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Colors */}
                <div className={styles.section}>
                  <span className={styles.sectionLabel}>Colors</span>
                  <div className={styles.selectList}>
                    <button
                      className={`${styles.selectRow}${allColorsOn ? ` ${styles.selectRowActive}` : ''}`}
                      onClick={toggleAllColors}
                    >
                      <span className={`${styles.selectSwatch} ${styles.swatchAccent}`} />
                      <span className={styles.selectLabel}>All Colors</span>
                      {allColorsOn && <span className={styles.checkmark}>✓</span>}
                    </button>
                    {availableColors.map(color => (
                      <button
                        key={color.id}
                        className={`${styles.selectRow}${selectedColors.has(color.id) ? ` ${styles.selectRowActive}` : ''}`}
                        onClick={() => toggleColor(color.id)}
                      >
                        <span
                          className={styles.selectSwatch}
                          style={{ background: color.hex }}
                        />
                        <span className={styles.selectLabel}>{color.label}</span>
                        {selectedColors.has(color.id) && <span className={styles.checkmark}>✓</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

          </div>
        </>
      )}
    </nav>
  )
}
