export const formatCompactCurrency = (value) => {
  const n = value || 0
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${Math.round(n)}`
}

export const formatDeltaPct = (value, baseline) => {
  if (!baseline) return null
  const pct = ((value - baseline) / baseline) * 100
  const rounded = Math.round(pct)
  if (rounded === 0) return '0% vs zone median'
  return `${rounded > 0 ? '+' : ''}${rounded}% vs zone median`
}
