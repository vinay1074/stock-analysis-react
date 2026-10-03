const formatValue = (key, value) => {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  if (typeof value === 'number') {
    const lowerKey = key.toLowerCase()

    if (lowerKey.includes('gain') || lowerKey.includes('return') || lowerKey.includes('pct')) {
      return `${value.toFixed(2)}%`
    }

    if (Number.isInteger(value)) {
      return value.toLocaleString()
    }

    return value.toFixed(2)
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const numeric = Number(value.replace(/[%,$\s]/g, ''))
    if (!Number.isNaN(numeric) && key.toLowerCase().includes('gain')) {
      return `${numeric.toFixed(2)}%`
    }
  }

  return String(value)
}

function BreakoutTable({ rows = [], sortKey = '', sortDirection = 'desc', onSort }) {
  const columns = rows.length ? Object.keys(rows[0]) : []

  if (!rows.length) {
    return <div className="empty-state">No breakout records found.</div>
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>
                <button
                  type="button"
                  className="sort-button"
                  onClick={() => onSort && onSort(column)}
                >
                  <span>{column}</span>
                  {sortKey === column ? <small>{sortDirection === 'asc' ? '↑' : '↓'}</small> : <small>↕</small>}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.symbol || 'row'}-${index}`}>
              {columns.map((column) => (
                <td key={`${column}-${index}`}>{formatValue(column, row[column])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default BreakoutTable
