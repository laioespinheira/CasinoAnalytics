const DASH_SEP = ' - '

/**
 * Auto-detected clusters (titles without " - " that share the first two words):
 * GRAND STAR, LANTERN FESTIVAL, MONEY TRAILS, THUNDER JACKPOTS
 */
export const buildTwoWordFamilyIndex = (gameTypes) => {
  const byPrefix = new Map()

  for (const gameType of gameTypes) {
    const raw = (gameType || '').trim()
    if (!raw || raw.includes(DASH_SEP)) continue

    const words = raw.split(/\s+/)
    if (words.length < 2) continue

    const prefix = `${words[0]} ${words[1]}`
    if (!byPrefix.has(prefix)) byPrefix.set(prefix, new Set())
    byPrefix.get(prefix).add(raw)
  }

  const prefixes = []
  byPrefix.forEach((titles, prefix) => {
    if (titles.size >= 2) prefixes.push(prefix)
  })

  prefixes.sort((a, b) => b.length - a.length)
  return prefixes
}

export const parseGameFamily = (gameType, familyIndex = null) => {
  const raw = (gameType || 'Unknown').trim()
  if (!raw) return 'Unknown'

  const dashIdx = raw.indexOf(DASH_SEP)
  if (dashIdx > 0) return raw.slice(0, dashIdx).trim()

  const prefixes = familyIndex || []
  const upper = raw.toUpperCase()
  for (const prefix of prefixes) {
    if (upper === prefix.toUpperCase()) return prefix
    if (upper.startsWith(`${prefix.toUpperCase()} `)) return prefix
  }

  return raw
}
