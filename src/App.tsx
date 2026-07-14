import { useMemo, useState } from 'react'
import './App.css'

type TierId = 'none' | 'trooper' | 'ranger' | 'champion' | 'legend'
type CheckStatus = 'idle' | 'checking' | 'checked' | 'failed'

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

const tierRules: TierRule[] = [
  { id: 'trooper', name: 'Arcade Trooper', label: 'Prize Tier 1', minPoints: 50, spots: '6000 spots; 4696 left saat halaman dicek', tone: 'blue' },
  { id: 'ranger', name: 'Arcade Ranger', label: 'Prize Tier 2', minPoints: 75, spots: '4000 spots; 3897 left saat halaman dicek', tone: 'silver' },
  { id: 'champion', name: 'Arcade Champion', label: 'Prize Tier 3', minPoints: 95, spots: '3000 spots; 2968 left saat halaman dicek', tone: 'gold' },
  { id: 'legend', name: 'Arcade Legend', label: 'Prize Tier 4', minPoints: 120, spots: '2500 spots; 2500 left saat halaman dicek', tone: 'green' },
]

const noTier: TierRule = {
  id: 'none',
  name: 'Belum Masuk Tier',
  label: 'Di bawah 50 Arcade Points',
  minPoints: 0,
  spots: '-',
  tone: 'muted',
}

const storageKey = 'arcade-tier-calculator-history'

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

const sampleRecord: ProfileRecord = {
  id: 1,
  profileUrl: 'https://www.skills.google/public_profiles/2a99c9ab-66ce-4c7e-bb24-db2505b98bd1',
  arcadePoints: 50,
  games: 18,
  badges: 33,
  skillBadges: 64,
  badgeTitles: ['Contoh public profile Google Skills'],
  officialGames: [{ title: 'Contoh official Arcade games', points: 18 }],
  officialSkillBadges: ['Contoh official skill badges'],
  checkedAt: 'Contoh profile',
  checkStatus: 'idle',
  checkMessage: 'Contoh data. Masukkan public profile peserta untuk menghitung tier aktual.',
}

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
  checkedAt: record.checkedAt || 'Belum dicek',
  checkStatus: record.checkStatus || 'idle',
  checkMessage: record.checkMessage || 'Menunggu pengecekan profile.',
})

const loadHistory = () => {
  const saved = localStorage.getItem(storageKey)

  if (!saved) {
    return [sampleRecord]
  }

  try {
    return (JSON.parse(saved) as Partial<ProfileRecord>[]).map(normalizeRecord)
  } catch {
    return [sampleRecord]
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
  const header = ['Public Profile', 'Tier', 'Arcade Points', 'Games', 'Badges', 'Skill Badges', 'Status', 'Pesan', 'Waktu Check']
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
  const [profileUrl, setProfileUrl] = useState('')
  const [records, setRecords] = useState<ProfileRecord[]>(loadHistory)
  const [activeRecord, setActiveRecord] = useState<ProfileRecord | null>(null)
  const [formStatus, setFormStatus] = useState('')
  const [isChecking, setIsChecking] = useState(false)

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
      throw new Error(data.error || 'Auto check gagal membaca public profile.')
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
    setFormStatus('Sedang membaca public profile Google Skills...')

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
        checkMessage: 'Profile berhasil dicek dan tier sudah dihitung otomatis.',
      }

      setActiveRecord(record)
      saveRecords([record, ...records.filter((item) => item.profileUrl !== record.profileUrl)].slice(0, 10))
      setFormStatus('Selesai. Hasil tier peserta sudah muncul.')
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
        checkMessage: error instanceof Error ? error.message : 'Auto check gagal.',
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

  const resultRecord = activeRecord || records[0]
  const currentTier = getTier(resultRecord)
  const nextTier = getNextTier(resultRecord)
  const targetTier = nextTier || currentTier
  const progress = requirementProgress(resultRecord, targetTier)
  const points = arcadePoints(resultRecord)
  const pointsNeeded = missingPoints(resultRecord, nextTier)

  const stats = useMemo(() => {
    const checked = records.filter((record) => record.checkStatus === 'checked')
    const legend = checked.filter((record) => getTier(record).id === 'legend').length
    const averageProgress = checked.length
      ? Math.round(checked.reduce((sum, record) => sum + requirementProgress(record, getNextTier(record) || getTier(record)), 0) / checked.length)
      : 0

    return { checked: checked.length, legend, averageProgress }
  }, [records])

  return (
    <main className="app-shell">
      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">Google Skills Arcade 2026</p>
          <h1>Calculator prize tier.</h1>
          <p className="hero-text">
            Masukkan URL public profile peserta. Web hanya mencocokkan badge dengan daftar game dan skill badge official
            dari halaman Arcade, menghitung Arcade Points, lalu menentukan tier Trooper, Ranger, Champion, atau Legend.
          </p>
          <form className="profile-form" onSubmit={runCheck}>
            <input
              value={profileUrl}
              onChange={(event) => setProfileUrl(event.target.value)}
              placeholder="https://www.skills.google/public_profiles/..."
              type="url"
              required
            />
            <button type="submit" disabled={isChecking}>{isChecking ? 'Checking...' : 'Hitung Tier'}</button>
          </form>
          <div className="hero-actions">
            <a href="#official-labs" className="secondary-action">View List Games & Skills</a>
            <a href="https://go.cloudskillsboost.google/arcade" target="_blank" rel="noreferrer" className="ghost-action">
              Buka Official Arcade
            </a>
          </div>
          {formStatus && <p className="helper-note">{formStatus}</p>}
        </div>

        <aside className={`tier-result ${currentTier.tone}`} aria-label="Hasil tier peserta">
          <span>{currentTier.label}</span>
          <strong>{currentTier.name}</strong>
          <p>{nextTier ? `${points} / ${nextTier.minPoints} points menuju ${nextTier.name}` : `${points} points; tier tertinggi terpenuhi.`}</p>
          <div className="hero-meter"><i style={{ width: `${progress}%` }}></i></div>
        </aside>
      </section>

      <section className="labs-panel" id="official-labs">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Official Arcade Labs</p>
            <h2>Games dan skill badge yang dihitung</h2>
          </div>
          <a href="https://go.cloudskillsboost.google/arcade" target="_blank" rel="noreferrer" className="secondary-action">
            Halaman Official
          </a>
        </div>

        <div className="labs-grid">
          <article>
            <div className="resource-heading">
              <span>Active July Games</span>
              <strong>{activeGameLinks.length} labs</strong>
            </div>
            <div className="resource-list">
              {activeGameLinks.map((lab) => (
                <a href={lab.url} target="_blank" rel="noreferrer" className="resource-card" key={lab.title}>
                  <span>{lab.category} - {lab.points} point</span>
                  <strong>{lab.title}</strong>
                  <p>Access code: {lab.code}</p>
                </a>
              ))}
            </div>
          </article>

          <article>
            <div className="resource-heading">
              <span>Official Skill Badges</span>
              <strong>{skillBadgeLinks.length} badges</strong>
            </div>
            <div className="resource-list">
              {skillBadgeLinks.map((lab) => (
                <a href={lab.url} target="_blank" rel="noreferrer" className="resource-card" key={lab.title}>
                  <span>{lab.category}</span>
                  <strong>{lab.title}</strong>
                  <p>2 official skill badges = 1 Arcade Point</p>
                </a>
              ))}
            </div>
          </article>
        </div>

        <details className="archive-box">
          <summary>View archived official games yang tetap dihitung jika muncul di public profile</summary>
          <div>
            {archivedGameNames.map((game) => (
              <span key={game}>{game}</span>
            ))}
          </div>
        </details>
      </section>

      <section className="stats-grid" aria-label="Ringkasan calculator">
        <article><span>Profile Dicek</span><strong>{stats.checked}</strong></article>
        <article><span>Average Progress</span><strong>{stats.averageProgress}%</strong></article>
        <article><span>Legend</span><strong>{stats.legend}</strong></article>
        <article><span>Riwayat</span><strong>{records.length}</strong></article>
      </section>

      <section className="calculator-grid">
        <article className="result-panel">
          <div className="panel-heading compact">
            <div>
              <p className="section-kicker">Hasil Check</p>
              <h2>Status peserta</h2>
            </div>
            <span className={`status-pill ${resultRecord.checkStatus}`}>{resultRecord.checkStatus}</span>
          </div>

          <div className="metric-row large">
            <div><span>Arcade Points</span><strong>{points}</strong></div>
            <div><span>Official Games</span><strong>{resultRecord.games}</strong></div>
            <div><span>Official Skills</span><strong>{resultRecord.skillBadges}</strong></div>
          </div>

          <div className="next-box">
            <span>Tier berikutnya</span>
            <strong>{nextTier ? nextTier.name : 'Tidak ada'}</strong>
            <p>
              {nextTier
                ? `Kurang ${pointsNeeded} Arcade Points. Tambahan bisa dari ${pointsNeeded} game badge atau ${pointsNeeded * 2} skill badge.`
                : 'Peserta sudah memenuhi Arcade Legend, tier tertinggi yang tampil di halaman official.'}
            </p>
          </div>

          <div className="official-match-box">
            <div>
              <span>Official games terdeteksi</span>
              <strong>{resultRecord.officialGames.length}</strong>
              <p>{resultRecord.officialGames.map((game) => `${game.title} (${game.points} pt)`).join(', ') || 'Belum ada game official yang cocok.'}</p>
            </div>
            <div>
              <span>Official skill badges terdeteksi</span>
              <strong>{resultRecord.officialSkillBadges.length}</strong>
              <p>{resultRecord.officialSkillBadges.join(', ') || 'Belum ada skill badge official yang cocok.'}</p>
            </div>
          </div>

          <a href={resultRecord.profileUrl} target="_blank" rel="noreferrer" className="profile-link">
            Buka public profile
          </a>
          <p className="check-message">{resultRecord.checkMessage}</p>
        </article>

        <aside className="tier-panel">
          <p className="section-kicker">Rules Tier</p>
          <h2>Ambang official tier Arcade 2026</h2>
          <p className="tier-note">
            Berdasarkan halaman official: hanya game badge dan skill badge yang terdaftar di Arcade 2026 yang dihitung.
            Game official punya point masing-masing; 2 skill badges official bernilai 1 point.
          </p>
          <div className="tier-list">
            {tierRules.map((tier) => {
              const achieved = getTier(resultRecord).id === tier.id || tierRules.findIndex((item) => item.id === getTier(resultRecord).id) >= tierRules.findIndex((item) => item.id === tier.id)

              return (
                <div className={achieved ? 'tier-card achieved' : 'tier-card'} key={tier.id}>
                  <span>{tier.label}</span>
                  <strong>{tier.name}</strong>
                  <p>{tier.minPoints} Arcade Points. {tier.spots}</p>
                </div>
              )
            })}
          </div>
        </aside>
      </section>

      <section className="history-panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Riwayat Check</p>
            <h2>Profile terakhir</h2>
          </div>
          <button type="button" className="secondary-action" onClick={exportCsv}>Export CSV</button>
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
      </section>
    </main>
  )
}

export default App
