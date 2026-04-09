import { useState } from 'react'
import {
  useAnalysis,
  PLANTS, ANALYSIS_TYPES, AREAS, LINES, PRODUCT_FAMILIES, MOCK_FILTER_WOS,
} from '../../context/AnalysisContext'
import styles from './SideNav.module.css'

export default function SideNav({ collapsed }) {
  const [woSearch, setWoSearch] = useState('')

  const {
    plant,        setPlant,
    area,         setArea,
    analysisType, setAnalysisType,
    startDate,    setStartDate,
    endDate,      setEndDate,
    groupBy,      setGroupBy,
    selectedLines,    toggleLine,
    selectedFamilies, toggleFamily, toggleAllFamilies,
    selectedColors,   toggleColor,  toggleAllColors,
    availableColors,
    dateError,
    canRun,
    runAnalysis,
    clearAll,
    filterWorkOrder, setFilterWorkOrder,
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

            {/* ── Area ── */}
            <div className={styles.section}>
              <span className={styles.sectionLabel}>Area</span>
              <select
                className={styles.select}
                value={area}
                onChange={e => setArea(e.target.value)}
              >
                {AREAS[plant]?.map(a => (
                  <option key={a} value={a}>{a}</option>
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
                <option value="">Overview Analysis</option>
                {ANALYSIS_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* ── Work Order Filter (Product Run only) ── */}
            {analysisType === 'product_run' && (() => {
              const matches = woSearch.trim()
                ? MOCK_FILTER_WOS.filter(w =>
                    w.id.toLowerCase().includes(woSearch.toLowerCase()) ||
                    w.label.toLowerCase().includes(woSearch.toLowerCase())
                  )
                : []
              return (
                <div className={styles.section}>
                  <span className={styles.sectionLabel}>Work Order</span>
                  <input
                    type="text"
                    className={styles.dateInput}
                    placeholder="Search WO…"
                    value={filterWorkOrder ? filterWorkOrder.id : woSearch}
                    onChange={e => {
                      setWoSearch(e.target.value)
                      if (!e.target.value) setFilterWorkOrder(null)
                    }}
                  />
                  {matches.length > 0 && !filterWorkOrder && (
                    <div className={styles.woMatchList}>
                      {matches.map(wo => (
                        <button
                          key={wo.id}
                          className={styles.woMatchItem}
                          onClick={() => { setFilterWorkOrder(wo); setWoSearch('') }}
                        >
                          {wo.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {filterWorkOrder && (
                    <span className={styles.woTimeHint}>
                      {filterWorkOrder.startTime} → {filterWorkOrder.endTime}
                      <button
                        className={styles.woClearBtn}
                        onClick={() => { setFilterWorkOrder(null); setWoSearch('') }}
                      >✕</button>
                    </span>
                  )}
                </div>
              )
            })()}

            {/* ── Date Range ── */}
            <div className={styles.section}>
              <span className={styles.sectionLabel}>Date Range</span>
              <div className={styles.dateStack}>
                <input
                  className={`${styles.dateInput}${filterWorkOrder ? ` ${styles.dateInputDisabled}` : ''}${dateError ? ` ${styles.inputError}` : ''}`}
                  type="date"
                  disabled={!!filterWorkOrder}
                  value={filterWorkOrder ? filterWorkOrder.startTime.slice(0, 10) : startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
                <input
                  className={`${styles.dateInput}${filterWorkOrder ? ` ${styles.dateInputDisabled}` : ''}${dateError ? ` ${styles.inputError}` : ''}`}
                  type="date"
                  disabled={!!filterWorkOrder}
                  value={filterWorkOrder ? filterWorkOrder.endTime.slice(0, 10) : endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
              </div>
              {dateError && !filterWorkOrder && <span className={styles.errorText}>{dateError}</span>}
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

            {/* ── Group Data By (Overview Analysis only) ── */}
            {analysisType === '' && (
              <div className={styles.section}>
                <span className={styles.sectionLabel}>Group Data By</span>
                <select
                  className={styles.select}
                  value={groupBy}
                  onChange={e => setGroupBy(e.target.value)}
                >
                  <option value="" disabled>Select grouping…</option>
                  <option value="month">Month</option>
                  <option value="week">Week</option>
                  <option value="day">Day</option>
                  <option value="shift">Shift</option>
                  <option value="run">Run</option>
                </select>
              </div>
            )}

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

          </div>
        </>
      )}
    </nav>
  )
}
