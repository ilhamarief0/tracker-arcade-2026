import { noTier, tierRules } from '../constants/tiers'
import { leaderboardStorageKey } from '../constants/storage'
import type { Copy } from '../i18n/copy'
import type { Language, LeaderboardEntry, OfficialResourcesResponse, ProfileRecord, TierRule } from '../types/arcade'

export const createSampleRecord = (text: Copy): ProfileRecord => ({
  id: 1,
  profileUrl: 'https://www.skills.google/public_profiles/2a99c9ab-66ce-4c7e-bb24-db2505b98bd1',
  profileName: 'Sample User',
  league: 'Bronze League',
  leaguePoints: 5650,
  arcadePoints: 50,
  games: 18,
  badges: 33,
  skillBadges: 64,
  badgeTitles: ['Sample public Google Skills profile'],
  allBadges: [{ title: text.sampleGame, earned: text.sampleCheckedAt }],
  officialGames: [{ title: text.sampleGame, points: 18 }],
  officialSkillBadges: [text.sampleSkill],
  checkedAt: text.sampleCheckedAt,
  checkStatus: 'idle',
  checkMessage: text.sampleMessage,
})

export const normalizeRecord = (record: Partial<ProfileRecord>): ProfileRecord => ({
  id: record.id || Date.now(),
  profileUrl: record.profileUrl || '',
  profileName: record.profileName || 'Unknown',
  league: record.league || '',
  leaguePoints: record.leaguePoints || 0,
  arcadePoints: record.arcadePoints || 0,
  games: record.games || 0,
  badges: record.badges || 0,
  skillBadges: record.skillBadges || 0,
  badgeTitles: record.badgeTitles || [],
  allBadges: record.allBadges || [],
  officialGames: record.officialGames || [],
  officialSkillBadges: record.officialSkillBadges || [],
  checkedAt: record.checkedAt || 'Not checked yet',
  checkStatus: record.checkStatus || 'idle',
  checkMessage: record.checkMessage || 'Waiting for profile check.',
})

export const arcadePoints = (record: Pick<ProfileRecord, 'arcadePoints' | 'games' | 'skillBadges'>) =>
  record.arcadePoints || record.games + Math.floor(record.skillBadges / 2)

export const getTier = (record: Pick<ProfileRecord, 'arcadePoints' | 'games' | 'skillBadges'>) => {
  const points = arcadePoints(record)

  return [...tierRules].reverse().find((tier) => points >= tier.minPoints) || noTier
}

export const getNextTier = (record: Pick<ProfileRecord, 'arcadePoints' | 'games' | 'skillBadges'>) => {
  const points = arcadePoints(record)

  return tierRules.find((tier) => points < tier.minPoints)
}

export const requirementProgress = (
  record: Pick<ProfileRecord, 'arcadePoints' | 'games' | 'skillBadges'>,
  tier: TierRule,
) => {
  if (tier.id === 'none') {
    return 0
  }

  return Math.round(Math.min(arcadePoints(record) / tier.minPoints, 1) * 100)
}

export const missingPoints = (record: Pick<ProfileRecord, 'arcadePoints' | 'games' | 'skillBadges'>, tier?: TierRule) =>
  tier ? Math.max(tier.minPoints - arcadePoints(record), 0) : 0

export const tierDisplay = (tier: TierRule, text: Copy) => ({
  label: tier.id === 'none' ? text.noTierLabel : tier.label,
  name: tier.id === 'none' ? text.noTierName : tier.name,
})

export const localeForLanguage = (language: Language) => (language === 'id' ? 'id-ID' : 'en-US')

export const toCsv = (records: ProfileRecord[]) => {
  const header = ['Public Profile', 'Tier', 'Arcade Points', 'Games', 'Badges', 'Skill Badges', 'Status', 'Message', 'Checked At']
  const rows = records.map((record) => [
    record.profileUrl,
    getTier(record).name,
    arcadePoints(record),
    record.games,
    record.badges,
    record.skillBadges,
    record.checkStatus,
    record.checkMessage,
    record.checkedAt,
  ])

  return [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')
}

export const parseOfficialResources = (saved: string | null): OfficialResourcesResponse | null => {
  if (!saved) {
    return null
  }

  try {
    return JSON.parse(saved) as OfficialResourcesResponse
  } catch {
    return null
  }
}

export const parseHistory = (saved: string | null, text: Copy) => {
  if (!saved) {
    return [createSampleRecord(text)]
  }

  try {
    return (JSON.parse(saved) as Partial<ProfileRecord>[]).map(normalizeRecord)
  } catch {
    return [createSampleRecord(text)]
  }
}

export const recordToLeaderboardEntry = (record: ProfileRecord): LeaderboardEntry => {
  const tier = getTier(record)
  return {
    id: record.id,
    profileUrl: record.profileUrl,
    arcadePoints: arcadePoints(record),
    games: record.games,
    skillBadges: record.skillBadges,
    tierName: tier.name,
    tierId: tier.id,
    checkedAt: record.checkedAt,
  }
}

export const loadLeaderboard = (): LeaderboardEntry[] => {
  const saved = localStorage.getItem(leaderboardStorageKey)

  if (!saved) {
    return []
  }

  try {
    return (JSON.parse(saved) as LeaderboardEntry[]).sort((a, b) => b.arcadePoints - a.arcadePoints)
  } catch {
    return []
  }
}

export const saveToLeaderboard = (entry: LeaderboardEntry): LeaderboardEntry[] => {
  const board = loadLeaderboard().filter((item) => item.profileUrl !== entry.profileUrl)
  board.push(entry)
  board.sort((a, b) => b.arcadePoints - a.arcadePoints)
  const trimmed = board.slice(0, 100)
  localStorage.setItem(leaderboardStorageKey, JSON.stringify(trimmed))
  return trimmed
}
