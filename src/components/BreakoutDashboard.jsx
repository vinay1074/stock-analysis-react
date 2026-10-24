import { useEffect, useMemo, useState } from 'react'
import { DataGrid } from '@mui/x-data-grid'
import { Box, Chip, CircularProgress, Paper, Typography } from '@mui/material'
import { fetchBreakoutData } from '../services/breakoutApi'
import './BreakoutDashboard.css'

const formatPrice = (value) => {
  const price = Number(value)
  return Number.isFinite(price) ? `₹${price.toFixed(2)}` : '—'
}

const columns = [
  {
    field: 'symbol',
    headerName: 'Symbol',
    flex: 0.8,
    minWidth: 78,
    renderCell: ({ value }) => <strong>{value}</strong>,
  },
  {
    field: 'close_price',
    headerName: 'Close (₹)',
    type: 'number',
    flex: 0.9,
    minWidth: 86,
    valueFormatter: (value) => {
      const price = Number(value)
      return Number.isFinite(price) ? price.toFixed(2) : '—'
    },
  },
  {
    field: 'percentage_change',
    headerName: '% Gain',
    type: 'number',
    flex: 0.8,
    minWidth: 76,
    renderCell: ({ value }) => {
      const gain = Number(value)
      const color = gain > 0 ? '#2e7d32' : gain < 0 ? '#d32f2f' : 'inherit'

      return (
        <span style={{ color, fontWeight: 'bold' }}>
          {Number.isFinite(gain) ? `${gain > 0 ? '+' : ''}${gain}%` : '—'}
        </span>
      )
    },
  },
  {
    field: 'volume',
    headerName: 'Volume',
    type: 'number',
    flex: 1,
    minWidth: 92,
    valueFormatter: (value) => {
      const volume = Number(value)
      return Number.isFinite(volume) ? volume.toLocaleString() : '—'
    },
  },
  {
    field: 'ai_signal',
    headerName: 'AI Signal',
    flex: 0.9,
    minWidth: 88,
    renderCell: ({ value }) => {
      const signal = String(value || 'Hold')
      const signalType = signal.toLowerCase()
      const color = signalType === 'buy' ? 'success' : signalType === 'sell' ? 'error' : signalType === 'hold' ? 'warning' : 'default'

      return <Chip label={signal} color={color} size="small" sx={{ fontWeight: 'bold', width: 80 }} />
    },
  },
  {
    field: 'ai_target',
    headerName: 'Target (₹)',
    type: 'number',
    flex: 0.9,
    minWidth: 88,
    renderCell: ({ value }) => (
      <span style={{ color: '#2e7d32', fontWeight: 500 }}>
        {value === null || value === undefined || value === '' ? '—' : formatPrice(value)}
      </span>
    ),
  },
  {
    field: 'ai_stop_loss',
    headerName: 'Stop Loss (₹)',
    type: 'number',
    flex: 1,
    minWidth: 96,
    renderCell: ({ value }) => (
      <span style={{ color: '#d32f2f', fontWeight: 500 }}>
        {value === null || value === undefined || value === '' ? '—' : formatPrice(value)}
      </span>
    ),
  },
  {
    field: 'ai_summary',
    headerName: 'Technical & Fundamental Rationale',
    flex: 1,
    minWidth: 180,
    sortable: false,
  },
]

function BreakoutDashboard() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [tradeDate, setTradeDate] = useState('2026-10-03')
  const [minGain, setMinGain] = useState(1.5)
  const [volQuantile, setVolQuantile] = useState(0.5)
  const [sortKey, setSortKey] = useState('volume')
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
          percentage_change: Number(row.percentage_change ?? row.gain_pct ?? row.gain ?? row.return_pct ?? row.return ?? row.pct_change ?? row.change_pct ?? 0),
          close_price: Number(row.close_price ?? row.close ?? row.last_price ?? 0),
          volume: Number(row.volume ?? row.TTL_TRD_QNTY ?? 0),
        }))

        setRows(normalized)
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
      nextRows = nextRows.filter((row) => row.percentage_change >= Number(minGain))
    }

    return nextRows
  }, [rows, searchTerm, minGain])

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
            setMinGain(1.5)
            setVolQuantile(0.5)
            setSearchTerm('')
            setSortKey('volume')
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
          <strong>{sortKey} {sortDirection === 'asc' ? '↑' : '↓'}</strong>
        </div>
      </div>

      {error ? <div className="alert error">{error}</div> : null}

      {loading ? (
        <Box className="loading-box" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, minHeight: 180 }}>
          <CircularProgress size={30} />
          <Typography variant="h6" color="text.secondary">
            Calculating technicals &amp; querying the AI screener...
          </Typography>
        </Box>
      ) : (
        <Paper elevation={3} className="grid-paper">
          {filteredRows.length ? (
            <DataGrid
              rows={filteredRows}
              columns={columns}
              sortModel={[{ field: sortKey, sort: sortDirection }]}
              onSortModelChange={(model) => {
                const activeSort = model[0]
                if (activeSort) {
                  setSortKey(activeSort.field)
                  setSortDirection(activeSort.sort)
                }
              }}
              initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
              pageSizeOptions={[10, 25, 50]}
              disableRowSelectionOnClick
              rowHeight={48}
              sx={{
                border: 'none',
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#f0f0f0',
                  borderBottom: '2px solid #ccc',
                },
                '& .MuiDataGrid-cell': { fontSize: '14px' },
              }}
            />
          ) : (
            <div className="empty-state">No breakout records found.</div>
          )}
        </Paper>
      )}
    </div>
  )
}

export default BreakoutDashboard
