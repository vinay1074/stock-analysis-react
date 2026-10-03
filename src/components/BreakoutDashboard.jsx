import { useEffect, useMemo, useState } from 'react'
import BreakoutTable from './BreakoutTable'
import { fetchBreakoutData } from '../services/breakoutApi'
import './BreakoutDashboard.css'

const metricKeys = ['gain_pct', 'gain', 'return_pct', 'return', 'pct_change', 'change_pct']

const getComparableValue = (row, key) => {
  if (!key) return null

  const value = row?.[key]
  if (typeof value === 'number') return value

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value.replace(/[%,$\s]/g, ''))
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

const findMetricKey = (row) => {
  if (!row) return ''

  const keys = Object.keys(row)
  const match = metricKeys.find((metricKey) =>
    keys.some((key) => key.toLowerCase() === metricKey.toLowerCase())
  )

  return match || ''
}

function BreakoutDashboard() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [tradeDate, setTradeDate] = useState('2026-10-03')
  const [minGain, setMinGain] = useState(3)
  const [volQuantile, setVolQuantile] = useState(0.8)
  const [sortKey, setSortKey] = useState('')
  const [sortDirection, setSortDirection] = useState('desc')

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError('')

        const data = await fetchBreakoutData({
          tradeDate,
          minGain,
          volQuantile,
        })

        const normalized = data.map((row, index) => ({
          ...row,
          id: `${row.symbol || 'stock'}-${index}`,
          gain_pct: Number(row.percentage_change ?? row.gain_pct ?? row.gain ?? 0),
          volume: Number(row.volume ?? row.TTL_TRD_QNTY ?? 0),
          close: Number(row.close_price ?? row.close ?? row.last_price ?? 0),
        }))

        setRows(normalized)

        if (normalized.length) {
          const defaultSort = findMetricKey(normalized[0]) || Object.keys(normalized[0])[0]
          setSortKey(defaultSort)
          setSortDirection('desc')
        }
      } catch (err) {
        setError(err.message || 'Failed to load breakout data.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [tradeDate, minGain, volQuantile])

  const filteredRows = useMemo(() => {
    let nextRows = [...rows]

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      nextRows = nextRows.filter((row) =>
        Object.values(row).some((value) => String(value).toLowerCase().includes(term))
      )
    }

    if (Number(minGain) > 0) {
      nextRows = nextRows.filter((row) => {
        const metricKey = findMetricKey(row)
        const numericValue = getComparableValue(row, metricKey)
        return numericValue !== null && numericValue >= Number(minGain)
      })
    }

    const activeSortKey = sortKey || (rows[0] ? Object.keys(rows[0])[0] : '')

    if (activeSortKey) {
      nextRows.sort((a, b) => {
        const left = getComparableValue(a, activeSortKey)
        const right = getComparableValue(b, activeSortKey)

        if (left === null && right === null) return 0
        if (left === null) return 1
        if (right === null) return -1

        return sortDirection === 'asc' ? left - right : right - left
      })
    }

    return nextRows
  }, [rows, searchTerm, minGain, sortKey, sortDirection])

  const handleSort = (column) => {
    if (sortKey === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortKey(column)
    setSortDirection('desc')
  }

  return (
    <div className="app-shell">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Stock Screener</p>
          <h1>Breakout Watchlist</h1>
        </div>
        <div className="meta-badge">{tradeDate}</div>
      </header>

      <div className="toolbar">
        <label className="field-box">
          <span>Trade Date</span>
          <input
            type="date"
            value={tradeDate}
            onChange={(event) => setTradeDate(event.target.value)}
          />
        </label>

        <label className="field-box">
          <span>Min Gain (%)</span>
          <input
            type="number"
            min="0"
            step="0.1"
            value={minGain}
            onChange={(event) => setMinGain(Number(event.target.value || 0))}
          />
        </label>

        <label className="field-box">
          <span>Volume Quantile</span>
          <input
            type="number"
            min="0"
            max="1"
            step="0.05"
            value={volQuantile}
            onChange={(event) => setVolQuantile(Number(event.target.value || 0))}
          />
        </label>

        <label className="search-box">
          <span>Search</span>
          <input
            type="text"
            placeholder="Filter by symbol or value"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </label>

        <button
          className="clear-button"
          type="button"
          onClick={() => {
            setTradeDate('2026-10-03')
            setMinGain(3)
            setVolQuantile(0.8)
            setSearchTerm('')
            setSortKey('')
            setSortDirection('desc')
          }}
        >
          Reset
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-card accent">
          <span>Total</span>
          <strong>{rows.length}</strong>
        </div>
        <div className="stat-card">
          <span>Visible</span>
          <strong>{filteredRows.length}</strong>
        </div>
        <div className="stat-card">
          <span>Sort</span>
          <strong>{sortKey || 'Default'} {sortDirection === 'asc' ? '↑' : '↓'}</strong>
        </div>
      </div>

      {error ? <div className="alert error">{error}</div> : null}

      {loading ? (
        <div className="loading-box">Loading breakout data...</div>
      ) : (
        <BreakoutTable rows={filteredRows} sortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} />
      )}
    </div>
  )
}

export default BreakoutDashboard
