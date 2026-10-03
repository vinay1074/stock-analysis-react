const buildQueryString = (params = {}) => {
  const query = new URLSearchParams({
    trade_date: params.tradeDate || '2026-10-03',
    min_gain: String(params.minGain ?? 3),
    vol_quantile: String(params.volQuantile ?? 0.8),
  })

  return query.toString()
}

export async function fetchBreakoutData(params = {}) {
  const query = buildQueryString(params)
  const response = await fetch(`/api/screener/breakouts?${query}`)

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  const data = await response.json()

  if (Array.isArray(data)) {
    return data
  }

  if (Array.isArray(data?.data)) {
    return data.data
  }

  if (Array.isArray(data?.results)) {
    return data.results
  }

  return []
}
