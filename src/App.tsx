import { useState } from 'react'
import './App.css'

type TierId = 'none' | 'trooper' | 'ranger' | 'champion' | 'legend'
type CheckStatus = 'idle' | 'checking' | 'checked' | 'failed'
type Language = 'en' | 'id'

type TierRule = {
  id: TierId
  name: string
  label: string
  minPoints: number
  spots: string
  tone: string
}

type ProfileCheckResult = {
  arcadePoints: number
  badges: number
  badgeTitles?: string[]
  games: number
  officialGames?: { points: number; title: string }[]
  officialSkillBadges?: string[]
  profileUrl: string
  skillBadges: number
  status: 'checked'
}

type ProfileRecord = {
  id: number
  profileUrl: string
  arcadePoints: number
  games: number
  badges: number
  skillBadges: number
  badgeTitles: string[]
  officialGames: { points: number; title: string }[]
  officialSkillBadges: string[]
  checkedAt: string
  checkStatus: CheckStatus
  checkMessage: string
}

type LabLink = {
  title: string
  points?: number
  url?: string
  code?: string
  category: string
}

type AdminForm = {
  username: string
  password: string
}

type OfficialResourcesResponse = {
  fetchedAt: string
  games: LabLink[]
  skills: LabLink[]
}

const tierRules: TierRule[] = [
  { id: 'trooper', name: 'Arcade Trooper', label: 'Prize Tier 1', minPoints: 50, spots: '6000 spots; 4696 left when checked', tone: 'blue' },
  { id: 'ranger', name: 'Arcade Ranger', label: 'Prize Tier 2', minPoints: 75, spots: '4000 spots; 3897 left when checked', tone: 'silver' },
  { id: 'champion', name: 'Arcade Champion', label: 'Prize Tier 3', minPoints: 95, spots: '3000 spots; 2968 left when checked', tone: 'gold' },
  { id: 'legend', name: 'Arcade Legend', label: 'Prize Tier 4', minPoints: 120, spots: '2500 spots; 2500 left when checked', tone: 'green' },
]

const noTier: TierRule = {
  id: 'none',
  name: 'No Tier Yet',
  label: 'Below 50 Arcade Points',
  minPoints: 0,
  spots: '-',
  tone: 'muted',
}

const storageKey = 'arcade-tier-calculator-history'
const adminStorageKey = 'arcade-admin-session'
const officialResourcesStorageKey = 'arcade-official-resources'
const languageStorageKey = 'arcade-language'

const copy = {
  en: {
    activeGames: 'Active July Games',
    adminActive: 'Admin active',
    adminLoggedIn: 'developer logged in',
    adminLoginFailed: 'Admin login failed.',
    adminLoginSuccess: 'Admin login successful. Session is saved permanently in this browser.',
    adminLogoutSuccess: 'Admin logged out from this browser.',
    adminPanelTitle: 'Admin active',
    adminRefreshDefault: 'No refresh data yet; using the built-in list from the official Arcade page.',
    adminRefreshFailed: 'Official Arcade refresh failed.',
    adminRefreshLoading: 'Refreshing official games and skill badges...',
    adminRefreshSuccess: (games: number, skills: number) => `Refresh successful: ${games} games and ${skills} skill badges loaded.`,
    adminRefreshedAt: (date: string) => `Official data last refreshed ${date}.`,
    archivedSummary: 'View archived official games that still count if they appear on a public profile',
    back: 'Back',
    checkFailed: 'Auto check failed.',
    checkLoading: 'Reading Google Skills public profile...',
    checkSuccess: 'Profile checked successfully and tier calculated automatically.',
    checkSuccessStatus: 'Done. Participant tier result is ready.',
    checkedProfileMessage: 'Profile checked successfully and tier calculated automatically.',
    developerArea: 'Developer Area',
    detailDetected: 'Detected items detail',
    exportCsv: 'Export CSV',
    gameAccessCode: (code: string) => `Access code: ${code}`,
    games: 'Games',
    gamesEmpty: 'No matching official game yet.',
    headerLabs: 'Official Labs',
    heroEyebrow: 'Google Skills Arcade 2026',
    heroTitle: 'Prize tier calculator.',
    heroText: 'Enter a participant public profile URL. This app only matches badges against official Arcade games and skill badges, calculates Arcade Points, then determines Trooper, Ranger, Champion, or Legend tier.',
    historyKicker: 'Check History',
    historyTitle: 'Recent profiles',
    labClick: 'Click to open the lab on Google Skills.',
    labsButton: 'View Games & Skills',
    labsKicker: 'Official Arcade Labs',
    labsTitle: 'Games and skill badges that count',
    language: 'Language',
    loginButton: 'Login Admin',
    loginDescription: 'Sign in as developer to view check history and refresh the official Arcade games list.',
    loginTitle: 'Admin login',
    logout: 'Logout',
    nextLegend: 'Participant already meets Arcade Legend.',
    noTierName: 'No Tier Yet',
    officialArcade: 'Open Official Arcade',
    officialPage: 'Official Page',
    passwordPlaceholder: 'Admin password',
    profileLink: 'Open public profile',
    refreshGames: 'Refresh Arcade Games',
    refreshing: 'Refreshing...',
    sampleCheckedAt: 'Sample profile',
    sampleGame: 'Sample official Arcade games',
    sampleMessage: 'Sample data. Enter a participant public profile to calculate the real tier.',
    sampleSkill: 'Sample official skill badges',
    skills: 'Skills',
    skillBadges: 'Official Skill Badges',
    skillsEmpty: 'No matching official skill badge yet.',
    skillPointRule: '2 official skill badges = 1 Arcade Point',
    submitButton: 'Calculate Tier',
    submitting: 'Checking...',
    tierComplete: (points: number) => `${points} points; highest tier reached.`,
    tierNeed: (missing: number) => `Need ${missing} points. This can be ${missing} game badge(s) or ${missing * 2} skill badge(s).`,
    tierProgress: (points: number, target: number, tier: string) => `${points} / ${target} points toward ${tier}`,
    usernamePlaceholder: 'Admin username',
  },
  id: {
    activeGames: 'Game Aktif Juli',
    adminActive: 'Admin aktif',
    adminLoggedIn: 'developer login',
    adminLoginFailed: 'Login admin gagal.',
    adminLoginSuccess: 'Login admin berhasil. Session disimpan permanen di browser ini.',
    adminLogoutSuccess: 'Admin berhasil logout dari browser ini.',
    adminPanelTitle: 'Admin aktif',
    adminRefreshDefault: 'Belum ada data refresh; memakai daftar bawaan dari halaman official Arcade.',
    adminRefreshFailed: 'Refresh official Arcade gagal.',
    adminRefreshLoading: 'Sedang refresh daftar games dan skill badge official...',
    adminRefreshSuccess: (games: number, skills: number) => `Refresh berhasil: ${games} games dan ${skills} skill badges terambil.`,
    adminRefreshedAt: (date: string) => `Data official terakhir di-refresh ${date}.`,
    archivedSummary: 'Lihat archived official games yang tetap dihitung jika muncul di public profile',
    back: 'Kembali',
    checkFailed: 'Auto check gagal.',
    checkLoading: 'Sedang membaca public profile Google Skills...',
    checkSuccess: 'Profile berhasil dicek dan tier sudah dihitung otomatis.',
    checkSuccessStatus: 'Selesai. Hasil tier peserta sudah muncul.',
    checkedProfileMessage: 'Profile berhasil dicek dan tier sudah dihitung otomatis.',
    developerArea: 'Area Developer',
    detailDetected: 'Detail item terdeteksi',
    exportCsv: 'Export CSV',
    gameAccessCode: (code: string) => `Access code: ${code}`,
    games: 'Games',
    gamesEmpty: 'Belum ada game official yang cocok.',
    headerLabs: 'Official Labs',
    heroEyebrow: 'Google Skills Arcade 2026',
    heroTitle: 'Calculator prize tier.',
    heroText: 'Masukkan URL public profile peserta. Web hanya mencocokkan badge dengan daftar game dan skill badge official, menghitung Arcade Points, lalu menentukan tier Trooper, Ranger, Champion, atau Legend.',
    historyKicker: 'Riwayat Check',
    historyTitle: 'Profile terakhir',
    labClick: 'Klik untuk membuka lab di Google Skills.',
    labsButton: 'Lihat Games & Skills',
    labsKicker: 'Official Arcade Labs',
    labsTitle: 'Games dan skill badge yang dihitung',
    language: 'Bahasa',
    loginButton: 'Login Admin',
    loginDescription: 'Masuk sebagai developer untuk melihat riwayat check dan refresh daftar games Arcade official.',
    loginTitle: 'Login admin',
    logout: 'Logout',
    nextLegend: 'Peserta sudah memenuhi Arcade Legend.',
    noTierName: 'Belum Masuk Tier',
    officialArcade: 'Buka Official Arcade',
    officialPage: 'Halaman Official',
    passwordPlaceholder: 'Password admin',
    profileLink: 'Buka public profile',
    refreshGames: 'Refresh Games Arcade',
    refreshing: 'Refreshing...',
    sampleCheckedAt: 'Contoh profile',
    sampleGame: 'Contoh official Arcade games',
    sampleMessage: 'Contoh data. Masukkan public profile peserta untuk menghitung tier aktual.',
    sampleSkill: 'Contoh official skill badges',
    skills: 'Skills',
    skillBadges: 'Official Skill Badges',
    skillsEmpty: 'Belum ada skill badge official yang cocok.',
    skillPointRule: '2 official skill badges = 1 Arcade Point',
    submitButton: 'Hitung Tier',
    submitting: 'Checking...',
    tierComplete: (points: number) => `${points} points; tier tertinggi terpenuhi.`,
    tierNeed: (missing: number) => `Kurang ${missing} points. Bisa dari ${missing} game badge atau ${missing * 2} skill badge.`,
    tierProgress: (points: number, target: number, tier: string) => `${points} / ${target} points menuju ${tier}`,
    usernamePlaceholder: 'Username admin',
  },
}

const activeGameLinks: LabLink[] = [
  { title: 'Safe Spaces', points: 1, code: '1q-security-19110', category: 'Special Game', url: 'https://www.skills.google/games/7318?utm_source=googleskills&utm_medium=lp&utm_campaign=wmpgame-july-arcade26' },
  { title: 'Arcade Simulator: Data Mesh Architect', points: 1, code: '1q-datamesh-16451', category: 'Simulator', url: 'https://www.skills.google/games/7317?utm_source=googleskills&utm_medium=lp&utm_campaign=spegame-july-arcade26' },
  { title: 'Arcade Base Camp', points: 1, code: '1q-basecamp-07511', category: 'July Game', url: 'https://www.skills.google/games/7313?utm_source=googleskills&utm_medium=lp&utm_campaign=basecamp-july-arcade26' },
  { title: 'Arcade Adventure', points: 1, code: '1q-lowcode-92316', category: 'July Game', url: 'https://www.skills.google/games/7314?utm_source=googleskills&utm_medium=lp&utm_campaign=adv-july-arcade26' },
  { title: 'Arcade Voyage', points: 1, code: '1q-bucket-58231', category: 'July Game', url: 'https://www.skills.google/games/7315?utm_source=googleskills&utm_medium=lp&utm_campaign=voyage-july-arcade26' },
  { title: 'Arcade Trail', points: 1, code: '1q-workspace-31069', category: 'July Game', url: 'https://www.skills.google/games/7316?utm_source=googleskills&utm_medium=lp&utm_campaign=trail-july-arcade26' },
]

const skillBadgeLinks: LabLink[] = [
  { title: 'App Building with AppSheet', category: 'Skill Badge', url: 'https://www.skills.google/course_templates/635?utm_source=googleskills&utm_medium=lp&utm_campaign=adventure-july-arcade26' },
  { title: 'Build Serverless Applications with Cloud Run Functions', category: 'Skill Badge', url: 'https://www.skills.google/course_templates/696?utm_source=googleskills&utm_medium=lp&utm_campaign=adventure-july-arcade26' },
  { title: 'Discover and Protect Sensitive Data Across Your Ecosystem', category: 'Skill Badge', url: 'https://www.skills.google/course_templates/1177?utm_source=googleskills&utm_medium=lp&utm_campaign=voyage-july-arcade26' },
  { title: 'Use APIs to Work with Cloud Storage', category: 'Skill Badge', url: 'https://www.skills.google/course_templates/755?utm_source=googleskills&utm_medium=lp&utm_campaign=voyage-july-arcade26' },
  { title: 'Configure your Workplace: Google Workspace for IT Admins', category: 'Skill Badge', url: 'https://www.skills.google/course_templates/780?utm_source=googleskills&utm_medium=lp&utm_campaign=trail-july-arcade26' },
  { title: 'Google Workspace for Education', category: 'Skill Badge', url: 'https://www.skills.google/course_templates/757?utm_source=googleskills&utm_medium=lp&utm_campaign=trail-july-arcade26' },
  { title: 'Build Infrastructure with Terraform on Google Cloud', category: 'Skill Badge', url: 'https://www.skills.google/course_templates/636?utm_source=googleskills&utm_medium=lp&utm_campaign=basecamp-july-arcade26' },
  { title: 'Secure Software Delivery', category: 'Skill Badge', url: 'https://www.skills.google/course_templates/1164?utm_source=googleskills&utm_medium=lp&utm_campaign=basecamp-july-arcade26' },
  { title: 'Mitigate Threats and Vulnerabilities with Security Command Center', category: 'Skill Badge', url: 'https://www.skills.google/course_templates/759?utm_source=googleskills&utm_medium=lp&utm_campaign=specialgame-july-arcade26' },
  { title: 'Optimize Costs for Google Kubernetes Engine', category: 'Skill Badge', url: 'https://www.skills.google/course_templates/655?utm_source=googleskills&utm_medium=lp&utm_campaign=specialgame-july-arcade26' },
  { title: 'Build a Data Warehouse with BigQuery', category: 'Skill Badge', url: 'https://www.skills.google/course_templates/624?utm_source=googleskills&utm_medium=lp&utm_campaign=wmp-july-arcade26' },
  { title: 'Build a Data Mesh with Knowledge Catalog', category: 'Skill Badge', url: 'https://www.skills.google/course_templates/681?utm_source=googleskills&utm_medium=lp&utm_campaign=wmp-july-arcade26' },
]

const archivedGameNames = [
  'Arcade Work-Life Refresh', 'Arcade Base Camp January', 'Arcade Certification Zone', 'Level 1: January 2026', 'Level 2: January 2026', 'Level 3: January 2026', 'Week 1: January 2026', 'Week 2: January 2026', 'Week 3: January 2026', 'Week 4: January 2026',
  'Arcade From Foundation to Wonders', 'Arcade Skills At the Pitch', 'Arcade Base Camp February', 'Arcade Adventure: February 2026', 'Arcade Voyage: February 2026', 'Arcade Trail: February 2026', 'Sprint 1: February 2026', 'Sprint 2: February 2026', 'Sprint 3: February 2026', 'Sprint 4: February 2026',
  'Arcade Holi-Istic Infrastrectures', 'Arcade Base Camp March', 'Arcade Adventure: March 2026', 'Arcade Voyage: March 2026', 'Arcade Trail: March 2026', 'Sprint 1: March 2026', 'Sprint 2: March 2026', 'Sprint 3: March 2026', 'Sprint 4: March 2026',
  'Arcade Dialogue Design', 'Arcade Base Camp April', 'Arcade Adventure: April 2026', 'Arcade Voyage: April 2026', 'Arcade Trail: April 2026', 'Arcade Skill Up Summer', 'Arcade Base Camp May', 'Arcade Adventure: May 2026', 'Arcade Voyage: May 2026', 'Arcade Trail: May 2026', 'Arcade Base Camp June', 'Arcade Adventure: June 2026', 'Arcade Voyage: June 2026', 'Arcade Trail: June 2026',
]

const loadOfficialResources = (): OfficialResourcesResponse | null => {
  const saved = localStorage.getItem(officialResourcesStorageKey)

  if (!saved) {
    return null
  }

  try {
    return JSON.parse(saved) as OfficialResourcesResponse
  } catch {
    return null
  }
}

const createSampleRecord = (text: (typeof copy)[Language]): ProfileRecord => ({
  id: 1,
  profileUrl: 'https://www.skills.google/public_profiles/2a99c9ab-66ce-4c7e-bb24-db2505b98bd1',
  arcadePoints: 50,
  games: 18,
  badges: 33,
  skillBadges: 64,
  badgeTitles: ['Contoh public profile Google Skills'],
  officialGames: [{ title: text.sampleGame, points: 18 }],
  officialSkillBadges: [text.sampleSkill],
  checkedAt: text.sampleCheckedAt,
  checkStatus: 'idle',
  checkMessage: text.sampleMessage,
})

const normalizeRecord = (record: Partial<ProfileRecord>): ProfileRecord => ({
  id: record.id || Date.now(),
  profileUrl: record.profileUrl || '',
  arcadePoints: record.arcadePoints || 0,
  games: record.games || 0,
  badges: record.badges || 0,
  skillBadges: record.skillBadges || 0,
  badgeTitles: record.badgeTitles || [],
  officialGames: record.officialGames || [],
  officialSkillBadges: record.officialSkillBadges || [],
  checkedAt: record.checkedAt || 'Not checked yet',
  checkStatus: record.checkStatus || 'idle',
  checkMessage: record.checkMessage || 'Menunggu pengecekan profile.',
})

const loadHistory = (text: (typeof copy)[Language]) => {
  const saved = localStorage.getItem(storageKey)

  if (!saved) {
    return [createSampleRecord(text)]
  }

  try {
    return (JSON.parse(saved) as Partial<ProfileRecord>[]).map(normalizeRecord)
  } catch {
    return [createSampleRecord(text)]
  }
}

const arcadePoints = (record: Pick<ProfileRecord, 'arcadePoints' | 'games' | 'skillBadges'>) =>
  record.arcadePoints || record.games + Math.floor(record.skillBadges / 2)

const getTier = (record: Pick<ProfileRecord, 'arcadePoints' | 'games' | 'skillBadges'>) => {
  const points = arcadePoints(record)

  return [...tierRules]
    .reverse()
    .find((tier) => points >= tier.minPoints) || noTier
}

const getNextTier = (record: Pick<ProfileRecord, 'arcadePoints' | 'games' | 'skillBadges'>) => {
  const points = arcadePoints(record)

  return tierRules.find((tier) => points < tier.minPoints)
}

const requirementProgress = (record: Pick<ProfileRecord, 'arcadePoints' | 'games' | 'skillBadges'>, tier: TierRule) => {
  if (tier.id === 'none') {
    return 0
  }

  return Math.round(Math.min(arcadePoints(record) / tier.minPoints, 1) * 100)
}

const missingPoints = (record: Pick<ProfileRecord, 'arcadePoints' | 'games' | 'skillBadges'>, tier?: TierRule) =>
  tier ? Math.max(tier.minPoints - arcadePoints(record), 0) : 0

const toCsv = (records: ProfileRecord[]) => {
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

function App() {
  const [language, setLanguageState] = useState<Language>(() => (localStorage.getItem(languageStorageKey) === 'id' ? 'id' : 'en'))
  const text = copy[language]
  const [profileUrl, setProfileUrl] = useState('')
  const [records, setRecords] = useState<ProfileRecord[]>(() => loadHistory(text))
  const [activeRecord, setActiveRecord] = useState<ProfileRecord | null>(null)
  const [formStatus, setFormStatus] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem(adminStorageKey) || '')
  const [isAdmin, setIsAdmin] = useState(() => Boolean(localStorage.getItem(adminStorageKey)))
  const [adminForm, setAdminForm] = useState<AdminForm>({ password: '', username: '' })
  const [adminStatus, setAdminStatus] = useState('')
  const [view, setView] = useState<'main' | 'login'>('main')
  const [isRefreshingArcade, setIsRefreshingArcade] = useState(false)
  const [officialResources, setOfficialResources] = useState<OfficialResourcesResponse | null>(loadOfficialResources)

  const visibleGameLinks = officialResources?.games?.length ? officialResources.games : activeGameLinks
  const visibleSkillBadgeLinks = officialResources?.skills?.length ? officialResources.skills : skillBadgeLinks

  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage)
    localStorage.setItem(languageStorageKey, nextLanguage)
  }

  const saveRecords = (nextRecords: ProfileRecord[]) => {
    setRecords(nextRecords)
    localStorage.setItem(storageKey, JSON.stringify(nextRecords))
  }

  const checkProfile = async (url: string) => {
    const response = await fetch('/api/check-profile', {
      body: JSON.stringify({ profileUrl: url }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    })
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || text.checkFailed)
    }

    return data as ProfileCheckResult
  }

  const runCheck = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const url = profileUrl.trim()
    if (!url) {
      return
    }

    setIsChecking(true)
    setFormStatus(text.checkLoading)

    try {
      const result = await checkProfile(url)
      const record: ProfileRecord = {
        id: Date.now(),
        profileUrl: result.profileUrl,
        arcadePoints: result.arcadePoints,
        games: result.games,
        badges: result.badges,
        skillBadges: result.skillBadges,
        badgeTitles: result.badgeTitles || [],
        officialGames: result.officialGames || [],
        officialSkillBadges: result.officialSkillBadges || [],
        checkedAt: new Date().toLocaleString('id-ID'),
        checkStatus: 'checked',
        checkMessage: text.checkSuccess,
      }

      setActiveRecord(record)
      saveRecords([record, ...records.filter((item) => item.profileUrl !== record.profileUrl)].slice(0, 10))
      setFormStatus(text.checkSuccessStatus)
    } catch (error) {
      const failedRecord: ProfileRecord = {
        id: Date.now(),
        profileUrl: url,
        arcadePoints: 0,
        games: 0,
        badges: 0,
        skillBadges: 0,
        badgeTitles: [],
        officialGames: [],
        officialSkillBadges: [],
        checkedAt: new Date().toLocaleString('id-ID'),
        checkStatus: 'failed',
        checkMessage: error instanceof Error ? error.message : text.checkFailed,
      }

      setActiveRecord(failedRecord)
      saveRecords([failedRecord, ...records].slice(0, 10))
      setFormStatus(failedRecord.checkMessage)
    } finally {
      setIsChecking(false)
    }
  }

  const exportCsv = () => {
    const blob = new Blob([toCsv(records)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'google-cloud-arcade-tier-calculator-2026.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const loginAdmin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      const response = await fetch('/api/admin-login', {
        body: JSON.stringify(adminForm),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || text.adminLoginFailed)
      }

      localStorage.setItem(adminStorageKey, data.token)
      setAdminToken(data.token)
      setIsAdmin(true)
      setAdminForm({ password: '', username: '' })
      setAdminStatus(text.adminLoginSuccess)
      setView('main')
    } catch (error) {
      setAdminStatus(error instanceof Error ? error.message : text.adminLoginFailed)
    }
  }

  const logoutAdmin = () => {
    localStorage.removeItem(adminStorageKey)
    setAdminToken('')
    setIsAdmin(false)
    setAdminStatus(text.adminLogoutSuccess)
    setView('main')
  }

  const refreshOfficialArcade = async () => {
    setIsRefreshingArcade(true)
    setAdminStatus(text.adminRefreshLoading)

    try {
      const response = await fetch('/api/official-arcade', {
        headers: { authorization: `Bearer ${adminToken}` },
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || text.adminRefreshFailed)
      }

      const resources = data as OfficialResourcesResponse
      localStorage.setItem(officialResourcesStorageKey, JSON.stringify(resources))
      setOfficialResources(resources)
      setAdminStatus(text.adminRefreshSuccess(resources.games.length, resources.skills.length))
    } catch (error) {
      setAdminStatus(error instanceof Error ? error.message : text.adminRefreshFailed)
    } finally {
      setIsRefreshingArcade(false)
    }
  }

  const resultRecord = activeRecord || records[0]
  const currentTier = getTier(resultRecord)
  const nextTier = getNextTier(resultRecord)
  const targetTier = nextTier || currentTier
  const progress = requirementProgress(resultRecord, targetTier)
  const points = arcadePoints(resultRecord)
  const pointsNeeded = missingPoints(resultRecord, nextTier)
  const currentTierName = currentTier.id === 'none' ? text.noTierName : currentTier.name
  const currentTierLabel = currentTier.id === 'none' ? (language === 'id' ? 'Di bawah 50 Arcade Points' : 'Below 50 Arcade Points') : currentTier.label

  if (view === 'login') {
    return (
      <main className="app-shell">
        <header className="topbar">
          <button type="button" className="ghost-action" onClick={() => setView('main')}>{text.back}</button>
          <span>{text.developerArea}</span>
        </header>

        <section className="login-view">
          <div>
            <p className="section-kicker">Developer Admin</p>
            <h1>{text.loginTitle}</h1>
            <p>{text.loginDescription}</p>
          </div>

          <form className="admin-form stacked" onSubmit={loginAdmin}>
            <input
              value={adminForm.username}
              onChange={(event) => setAdminForm({ ...adminForm, username: event.target.value })}
              placeholder={text.usernamePlaceholder}
              autoComplete="username"
              required
            />
            <input
              value={adminForm.password}
              onChange={(event) => setAdminForm({ ...adminForm, password: event.target.value })}
              placeholder={text.passwordPlaceholder}
              type="password"
              autoComplete="current-password"
              required
            />
            <button type="submit">{text.loginButton}</button>
          </form>

          {adminStatus && <p className="admin-status">{adminStatus}</p>}
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        {/* <a href="#official-labs">{text.headerLabs}</a> */}
        <label className="language-select">
          <span>{text.language}</span>
          <select value={language} onChange={(event) => setLanguage(event.target.value as Language)}>
            <option value="en">English</option>
            <option value="id">Indonesia</option>
          </select>
        </label>
        {isAdmin ? (
          <div className="topbar-actions">
            <span className="admin-chip">{text.adminLoggedIn}</span>
            <button type="button" className="ghost-action" onClick={logoutAdmin}>{text.logout}</button>
          </div>
        ) : (
          <button type="button" className="ghost-action" onClick={() => setView('login')}>{text.loginButton}</button>
        )}
      </header>

      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">{text.heroEyebrow}</p>
          <h1>{text.heroTitle}</h1>
          <p className="hero-text">{text.heroText}</p>
          <form className="profile-form" onSubmit={runCheck}>
            <input
              value={profileUrl}
              onChange={(event) => setProfileUrl(event.target.value)}
              placeholder="https://www.skills.google/public_profiles/..."
              type="url"
              required
            />
            <button type="submit" disabled={isChecking}>{isChecking ? text.submitting : text.submitButton}</button>
          </form>
          <div className="hero-actions">
            <a href="#official-labs" className="secondary-action">{text.labsButton}</a>
            <a href="https://go.cloudskillsboost.google/arcade" target="_blank" rel="noreferrer" className="ghost-action">
              {text.officialArcade}
            </a>
          </div>
          {formStatus && <p className="helper-note">{formStatus}</p>}
        </div>

        <aside className={`tier-result compact-result ${currentTier.tone}`} aria-label="Hasil tier peserta">
          <div className="result-topline">
          <span>{currentTierLabel}</span>
            <span className={`status-pill ${resultRecord.checkStatus}`}>{resultRecord.checkStatus}</span>
          </div>
          <strong>{currentTierName}</strong>
          <p>{nextTier ? text.tierProgress(points, nextTier.minPoints, nextTier.name) : text.tierComplete(points)}</p>
          <div className="hero-meter"><i style={{ width: `${progress}%` }}></i></div>

          <div className="compact-metrics">
            <div><span>Points</span><strong>{points}</strong></div>
            <div><span>Games</span><strong>{resultRecord.games}</strong></div>
            <div><span>Skills</span><strong>{resultRecord.skillBadges}</strong></div>
          </div>

          <p className="next-summary">
            {nextTier
              ? text.tierNeed(pointsNeeded)
              : text.nextLegend}
          </p>

          <details className="match-details">
            <summary>{text.detailDetected}</summary>
            <p>{text.games}: {resultRecord.officialGames.map((game) => `${game.title} (${game.points} pt)`).join(', ') || text.gamesEmpty}</p>
            <p>{text.skillBadges}: {resultRecord.officialSkillBadges.join(', ') || text.skillsEmpty}</p>
          </details>

          <div className="compact-tier-list">
            {tierRules.map((tier) => {
              const achieved = getTier(resultRecord).id === tier.id || tierRules.findIndex((item) => item.id === getTier(resultRecord).id) >= tierRules.findIndex((item) => item.id === tier.id)

              return (
                <span className={achieved ? 'tier-chip achieved' : 'tier-chip'} key={tier.id}>
                  {tier.name}: {tier.minPoints} pts
                </span>
              )
            })}
          </div>

          <a href={resultRecord.profileUrl} target="_blank" rel="noreferrer" className="profile-link">
            {text.profileLink}
          </a>
          <p className="check-message">{resultRecord.checkMessage}</p>
        </aside>
      </section>

      {isAdmin && <section className="admin-panel">
        <div className="panel-heading compact">
          <div>
            <p className="section-kicker">Developer Admin</p>
            <h2>{text.adminPanelTitle}</h2>
          </div>
          <span className="status-pill checked">developer</span>
        </div>

        <div className="admin-actions">
          <button type="button" className="secondary-action" onClick={refreshOfficialArcade} disabled={isRefreshingArcade}>
            {isRefreshingArcade ? text.refreshing : text.refreshGames}
          </button>
          <p>
            {officialResources
              ? text.adminRefreshedAt(new Date(officialResources.fetchedAt).toLocaleString(language === 'id' ? 'id-ID' : 'en-US'))
              : text.adminRefreshDefault}
          </p>
        </div>

        {adminStatus && <p className="admin-status">{adminStatus}</p>}
      </section>}

      <section className="labs-panel" id="official-labs">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">{text.labsKicker}</p>
            <h2>{text.labsTitle}</h2>
          </div>
          <a href="https://go.cloudskillsboost.google/arcade" target="_blank" rel="noreferrer" className="secondary-action">
            {text.officialPage}
          </a>
        </div>

        <div className="labs-grid">
          <article>
            <div className="resource-heading">
              <span>{text.activeGames}</span>
              <strong>{visibleGameLinks.length} labs</strong>
            </div>
            <div className="resource-list">
              {visibleGameLinks.map((lab) => (
                <a href={lab.url} target="_blank" rel="noreferrer" className="resource-card" key={lab.title}>
                  <span>{lab.category}{lab.points ? ` - ${lab.points} point` : ''}</span>
                  <strong>{lab.title}</strong>
                  <p>{lab.code ? text.gameAccessCode(lab.code) : text.labClick}</p>
                </a>
              ))}
            </div>
          </article>

          <article>
            <div className="resource-heading">
              <span>{text.skillBadges}</span>
              <strong>{visibleSkillBadgeLinks.length} badges</strong>
            </div>
            <div className="resource-list">
              {visibleSkillBadgeLinks.map((lab) => (
                <a href={lab.url} target="_blank" rel="noreferrer" className="resource-card" key={lab.title}>
                  <span>{lab.category}</span>
                  <strong>{lab.title}</strong>
                  <p>{text.skillPointRule}</p>
                </a>
              ))}
            </div>
          </article>
        </div>

        <details className="archive-box">
          <summary>{text.archivedSummary}</summary>
          <div>
            {archivedGameNames.map((game) => (
              <span key={game}>{game}</span>
            ))}
          </div>
        </details>
      </section>

      {isAdmin && <section className="history-panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">{text.historyKicker}</p>
            <h2>{text.historyTitle}</h2>
          </div>
          <button type="button" className="secondary-action" onClick={exportCsv}>{text.exportCsv}</button>
        </div>

        <div className="history-list">
          {records.map((record) => {
            const tier = getTier(record)
            return (
              <button type="button" className="history-card" key={record.id} onClick={() => setActiveRecord(record)}>
                <span className={`tier-dot ${tier.tone}`}></span>
                <div>
                  <strong>{tier.name}</strong>
                  <p>{record.profileUrl}</p>
                </div>
                <small>{arcadePoints(record)} points / {record.games} games / {record.skillBadges} skill badges</small>
              </button>
            )
          })}
        </div>
      </section>}
    </main>
  )
}

export default App
