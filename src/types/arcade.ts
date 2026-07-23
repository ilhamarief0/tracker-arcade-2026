export type TierId = 'none' | 'trooper' | 'ranger' | 'champion' | 'legend'
export type CheckStatus = 'idle' | 'checking' | 'checked' | 'failed'
export type Language = 'en' | 'id'

export type TierRule = {
  id: TierId
  name: string
  label: string
  minPoints: number
  spots: string
  tone: string
}

export type OfficialGame = {
  points: number
  title: string
}

export type ProfileCheckResult = {
  arcadePoints: number
  allBadges?: { title: string; earned: string }[]
  badges: number
  badgeTitles?: string[]
  games: number
  officialGames?: OfficialGame[]
  officialSkillBadges?: string[]
  profileUrl: string
  profileName?: string
  league?: string
  leaguePoints?: number
  skillBadges: number
  status: 'checked'
}

export type ProfileRecord = {
  id: number
  profileUrl: string
  profileName: string
  league: string
  leaguePoints: number
  arcadePoints: number
  games: number
  badges: number
  skillBadges: number
  badgeTitles: string[]
  allBadges: { title: string; earned: string }[]
  officialGames: OfficialGame[]
  officialSkillBadges: string[]
  checkedAt: string
  checkStatus: CheckStatus
  checkMessage: string
}

export type LabLink = {
  title: string
  points?: number
  url?: string
  code?: string
  category: string
}

export type AdminForm = {
  username: string
  password: string
}

export type OfficialResourcesResponse = {
  fetchedAt: string
  games: LabLink[]
  skills: LabLink[]
}

export type LeaderboardEntry = {
  id: number
  profileUrl: string
  arcadePoints: number
  games: number
  skillBadges: number
  tierName: string
  tierId: TierId
  checkedAt: string
}
