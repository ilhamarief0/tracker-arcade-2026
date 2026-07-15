import { useEffect, useState } from 'react'
import './App.css'
import { activeGameLinks, archivedGameNames, skillBadgeLinks } from './constants/labs'
import { adminStorageKey, languageStorageKey, officialResourcesStorageKey, storageKey } from './constants/storage'
import { tierRules } from './constants/tiers'
import { copy } from './i18n/copy'
import {
  arcadePoints,
  getNextTier,
  getTier,
  localeForLanguage,
  missingPoints,
  parseHistory,
  parseOfficialResources,
  requirementProgress,
  tierDisplay,
  toCsv,
} from './lib/arcade'
import type { AdminForm, Language, OfficialResourcesResponse, ProfileCheckResult, ProfileRecord } from './types/arcade'

const loginPath = '/auth/login'

const getInitialView = () => (window.location.pathname === loginPath ? 'login' : 'main')

function App() {
  const [language, setLanguageState] = useState<Language>(() => (localStorage.getItem(languageStorageKey) === 'id' ? 'id' : 'en'))
  const text = copy[language]
  const [profileUrl, setProfileUrl] = useState('')
  const [records, setRecords] = useState<ProfileRecord[]>(() => parseHistory(localStorage.getItem(storageKey), text))
  const [activeRecord, setActiveRecord] = useState<ProfileRecord | null>(null)
  const [formStatus, setFormStatus] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem(adminStorageKey) || '')
  const [isAdmin, setIsAdmin] = useState(() => Boolean(localStorage.getItem(adminStorageKey)))
  const [adminForm, setAdminForm] = useState<AdminForm>({ password: '', username: '' })
  const [adminStatus, setAdminStatus] = useState('')
  const [view, setView] = useState<'main' | 'login'>(getInitialView)
  const [isRefreshingArcade, setIsRefreshingArcade] = useState(false)
  const [officialResources, setOfficialResources] = useState<OfficialResourcesResponse | null>(() =>
    parseOfficialResources(localStorage.getItem(officialResourcesStorageKey)),
  )

  const visibleGameLinks = officialResources?.games?.length ? officialResources.games : activeGameLinks
  const visibleSkillBadgeLinks = officialResources?.skills?.length ? officialResources.skills : skillBadgeLinks
  const resultRecord = activeRecord || records[0]
  const currentTier = getTier(resultRecord)
  const nextTier = getNextTier(resultRecord)
  const targetTier = nextTier || currentTier
  const progress = requirementProgress(resultRecord, targetTier)
  const points = arcadePoints(resultRecord)
  const pointsNeeded = missingPoints(resultRecord, nextTier)
  const currentTierDisplay = tierDisplay(currentTier, text)

  useEffect(() => {
    const syncViewWithUrl = () => {
      setView(getInitialView())
    }

    window.addEventListener('popstate', syncViewWithUrl)
    return () => window.removeEventListener('popstate', syncViewWithUrl)
  }, [])

  const navigateToMain = () => {
    window.history.pushState(null, '', '/')
    setView('main')
  }

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
        checkedAt: new Date().toLocaleString(localeForLanguage(language)),
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
        checkedAt: new Date().toLocaleString(localeForLanguage(language)),
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
      window.history.replaceState(null, '', '/')
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
    window.history.replaceState(null, '', '/')
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

  if (view === 'login') {
    return (
      <main className="app-shell">
        <header className="topbar">
          <button type="button" className="ghost-action" onClick={navigateToMain}>{text.back}</button>
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
        <label className="language-select">
          <span>{text.language}</span>
          <select value={language} onChange={(event) => setLanguage(event.target.value as Language)}>
            <option value="en">English</option>
            <option value="id">Indonesia</option>
          </select>
        </label>
        {isAdmin && (
          <div className="topbar-actions">
            <span className="admin-chip">{text.adminLoggedIn}</span>
            <button type="button" className="ghost-action" onClick={logoutAdmin}>{text.logout}</button>
          </div>
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
            <span>{currentTierDisplay.label}</span>
            <span className={`status-pill ${resultRecord.checkStatus}`}>{resultRecord.checkStatus}</span>
          </div>
          <strong>{currentTierDisplay.name}</strong>
          <p>{nextTier ? text.tierProgress(points, nextTier.minPoints, nextTier.name) : text.tierComplete(points)}</p>
          <div className="hero-meter"><i style={{ width: `${progress}%` }}></i></div>

          <div className="compact-metrics">
            <div><span>Points</span><strong>{points}</strong></div>
            <div><span>Games</span><strong>{resultRecord.games}</strong></div>
            <div><span>Skills</span><strong>{resultRecord.skillBadges}</strong></div>
          </div>

          <p className="next-summary">
            {nextTier ? text.tierNeed(pointsNeeded) : text.nextLegend}
          </p>

          <details className="match-details">
            <summary>{text.detailDetected}</summary>
            <p>{text.games}: {resultRecord.officialGames.map((game) => `${game.title} (${game.points} pt)`).join(', ') || text.gamesEmpty}</p>
            <p>{text.skillBadges}: {resultRecord.officialSkillBadges.join(', ') || text.skillsEmpty}</p>
          </details>

          <div className="compact-tier-list">
            {tierRules.map((tier) => {
              const currentTierIndex = tierRules.findIndex((item) => item.id === getTier(resultRecord).id)
              const tierIndex = tierRules.findIndex((item) => item.id === tier.id)
              const achieved = getTier(resultRecord).id === tier.id || currentTierIndex >= tierIndex

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
              ? text.adminRefreshedAt(new Date(officialResources.fetchedAt).toLocaleString(localeForLanguage(language)))
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

      <footer className="site-footer">
        Created by{' '}
        <a href="https://github.com/ilhamarief0" target="_blank" rel="noreferrer">
          Ilham Arief
        </a>
        {' | '}
        <a href="https://github.com/ilhamarief0/tracker-arcade-2026" target="_blank" rel="noreferrer">
          Get this project
        </a>
      </footer>
    </main>
  )
}

export default App
