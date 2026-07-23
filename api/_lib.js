import * as cheerio from 'cheerio'
import crypto from 'node:crypto'

export const normalizeWhitespace = (value) => value.replace(/\s+/g, ' ').trim()

export const normalizeTitle = (value) =>
  normalizeWhitespace(value)
    .toLowerCase()
    .replace(/&amp;/g, '&')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

// ── Auth ─────────────────────────────────────────────────────────────────────

export const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex')

export const getAdminConfig = () => ({
  passwordHash: process.env.ADMIN_PASSWORD_HASH,
  token: process.env.ADMIN_TOKEN,
  username: process.env.ADMIN_USERNAME,
})

export const safeEqual = (left, right) => {
  const leftBuffer = Buffer.from(String(left))
  const rightBuffer = Buffer.from(String(right))
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer)
}

export const verifyAdminToken = (authHeader) => {
  const token = String(authHeader || '').replace(/^Bearer\s+/i, '')
  const config = getAdminConfig()
  return token && safeEqual(sha256(token), sha256(config.token))
}

// ── URL validation ────────────────────────────────────────────────────────────

export const validateProfileUrl = (profileUrl) => {
  let parsedUrl

  try {
    parsedUrl = new URL(profileUrl)
  } catch {
    return { error: 'Link public profile tidak valid.' }
  }

  const allowedHosts = [
    'skills.google',
    'www.skills.google',
    'cloudskillsboost.google',
    'www.cloudskillsboost.google',
    'qwiklabs.com',
    'www.qwiklabs.com',
  ]

  if (!allowedHosts.includes(parsedUrl.hostname)) {
    return { error: 'Gunakan link public profile dari Google Skills, Google Cloud Skills Boost, atau Qwiklabs.' }
  }

  if (!parsedUrl.pathname.includes('/public_profiles/')) {
    return { error: 'Link harus mengarah ke halaman public profile.' }
  }

  return { url: parsedUrl.toString() }
}

// ── Official Arcade lists ─────────────────────────────────────────────────────

export const officialArcadeGames = [
  { title: 'Safe Spaces', points: 1 },
  { title: 'Arcade Simulator: Data Mesh Architect', points: 1 },
  { title: 'Arcade Base Camp', points: 1 },
  { title: 'Arcade Adventure', points: 1 },
  { title: 'Arcade Voyage', points: 1 },
  { title: 'Arcade Trail', points: 1 },
  { title: 'Arcade Work-Life Refresh', points: 2 },
  { title: 'Arcade Work Life Refresh', points: 2 },
  { title: 'Arcade Base Camp January', points: 1 },
  { title: 'Arcade Certification Zone', points: 1 },
  { title: 'Level 1: January 2026', points: 1 },
  { title: 'Level 2: January 2026', points: 1 },
  { title: 'Level 3: January 2026', points: 1 },
  { title: 'Week 1: January 2026', points: 1 },
  { title: 'Week 2: January 2026', points: 1 },
  { title: 'Week 3: January 2026', points: 1 },
  { title: 'Week 4: January 2026', points: 1 },
  { title: 'Arcade From Foundation to Wonders', points: 3 },
  { title: 'Arcade Skills At the Pitch', points: 3 },
  { title: 'Arcade Base Camp February', points: 1 },
  { title: 'Arcade Adventure: February 2026', points: 1 },
  { title: 'Arcade Voyage: February 2026', points: 1 },
  { title: 'Arcade Trail: February 2026', points: 1 },
  { title: 'Sprint 1: February 2026', points: 1 },
  { title: 'Sprint 2: February 2026', points: 1 },
  { title: 'Sprint 3: February 2026', points: 1 },
  { title: 'Sprint 4: February 2026', points: 1 },
  { title: 'Arcade Holi-Istic Infrastrectures', points: 2 },
  { title: 'Arcade Base Camp March', points: 1 },
  { title: 'Arcade Adventure: March 2026', points: 1 },
  { title: 'Arcade Voyage: March 2026', points: 1 },
  { title: 'Arcade Trail: March 2026', points: 1 },
  { title: 'Sprint 1: March 2026', points: 1 },
  { title: 'Sprint 2: March 2026', points: 1 },
  { title: 'Sprint 3: March 2026', points: 1 },
  { title: 'Sprint 4: March 2026', points: 1 },
  { title: 'Arcade Dialogue Design', points: 1 },
  { title: 'Arcade Base Camp April', points: 1 },
  { title: 'Arcade Adventure: April 2026', points: 1 },
  { title: 'Arcade Voyage: April 2026', points: 1 },
  { title: 'Arcade Trail: April 2026', points: 1 },
  { title: 'Arcade Skill Up Summer', points: 1 },
  { title: 'Arcade Base Camp May', points: 1 },
  { title: 'Arcade Adventure: May 2026', points: 1 },
  { title: 'Arcade Voyage: May 2026', points: 1 },
  { title: 'Arcade Trail: May 2026', points: 1 },
  { title: 'Arcade Base Camp June', points: 1 },
  { title: 'Arcade Adventure: June 2026', points: 1 },
  { title: 'Arcade Voyage: June 2026', points: 1 },
  { title: 'Arcade Trail: June 2026', points: 1 },
]

export const officialSkillBadges = [
  'App Building with AppSheet',
  'Build Serverless Applications with Cloud Run Functions',
  'Discover and Protect Sensitive Data Across Your Ecosystem',
  'Use APIs to Work with Cloud Storage',
  'Configure your Workplace: Google Workspace for IT Admins',
  'Google Workspace for Education',
  'Build Infrastructure with Terraform on Google Cloud',
  'Secure Software Delivery',
  'Mitigate Threats and Vulnerabilities with Security Command Center',
  'Optimize Costs for Google Kubernetes Engine',
  'Build a Data Warehouse with BigQuery',
  'Build a Data Mesh with Knowledge Catalog',
]

const officialGameMatchers = officialArcadeGames.map((game) => ({
  ...game,
  normalizedTitle: normalizeTitle(game.title),
}))

const officialSkillBadgeMatchers = officialSkillBadges.map(normalizeTitle)

// ── Badge parsing ─────────────────────────────────────────────────────────────

const getSkillsGoogleBadges = ($) => {
  const badges = []
  const seen = new Set()

  $('.profile-badge').each((_, element) => {
    const el = $(element)
    const title = normalizeWhitespace(el.find('.ql-title-medium').first().text())
    const earned = normalizeWhitespace(el.find('.ql-body-medium').first().text())
    const key = normalizeTitle(title)
    if (title && key && !seen.has(key)) {
      seen.add(key)
      badges.push({ title, description: earned })
    }
  })

  if (badges.length === 0) {
    $('[data-badge-id], [class*="badge-card"], [class*="BadgeCard"], [class*="quest-card"]').each((_, element) => {
      const el = $(element)
      const title = normalizeWhitespace(el.find('[class*="title"], [class*="Title"], h3, h4').first().text() || el.attr('aria-label') || el.attr('title') || '')
      const description = normalizeWhitespace(el.find('[class*="description"], [class*="Description"], p').first().text() || '')
      const key = normalizeTitle(title)
      if (title && key && !seen.has(key)) {
        seen.add(key)
        badges.push({ title, description })
      }
    })
  }

  if (badges.length === 0) {
    $('img[alt]').each((_, element) => {
      const alt = normalizeWhitespace($(element).attr('alt') || '')
      const key = normalizeTitle(alt)
      if (alt.length > 4 && !seen.has(key)) {
        seen.add(key)
        badges.push({ title: alt, description: '' })
      }
    })
  }

  return badges
}

const getLeagueInfo = ($) => {
  const league = normalizeWhitespace($('.profile-league h2, .profile-league .ql-headline-medium').first().text())
  const pointsText = normalizeWhitespace($('.profile-league strong').first().text())
  const points = Number(/(\d+)/.exec(pointsText)?.[1] || 0)
  return { league, points }
}

const findOfficialArcadeGames = (badges) => {
  const matchedTitles = new Set()
  for (const badge of badges) {
    const text = normalizeTitle(`${badge.title} ${badge.description}`)
    const exactMatch = officialGameMatchers.find((game) => text.includes(game.normalizedTitle))
    if (exactMatch) {
      matchedTitles.add(exactMatch.normalizedTitle)
      continue
    }
    const monthlyMatch = /(arcade base camp|arcade adventure|arcade voyage|arcade trail).*(january|february|march|april|may|june|july) 2026/.exec(text)
    if (monthlyMatch?.[0]) matchedTitles.add(monthlyMatch[0])
  }
  return officialGameMatchers.filter((game) => matchedTitles.has(game.normalizedTitle))
}

const findOfficialSkillBadges = (badges) => {
  const matchedTitles = new Set()
  for (const badge of badges) {
    const text = normalizeTitle(`${badge.title} ${badge.description}`)
    const exactMatch = officialSkillBadgeMatchers.find((skillBadge) => text.includes(skillBadge))
    if (exactMatch) matchedTitles.add(exactMatch)
  }
  return officialSkillBadges.filter((skillBadge) => matchedTitles.has(normalizeTitle(skillBadge)))
}

// ── Profile parse ─────────────────────────────────────────────────────────────

export const parseProfile = (html, profileUrl) => {
  const $ = cheerio.load(html)
  const allBadges = getSkillsGoogleBadges($)
  const leagueInfo = getLeagueInfo($)
  const profileName = normalizeWhitespace($('h1.ql-display-small, h1').first().text())
  const officialGames = findOfficialArcadeGames(allBadges)
  const officialMatchedSkillBadges = findOfficialSkillBadges(allBadges)
  const officialGamePoints = officialGames.reduce((sum, game) => sum + game.points, 0)
  const games = officialGames.length
  const skillBadges = officialMatchedSkillBadges.length
  const totalBadges = allBadges.length
  const arcadePoints = officialGamePoints + Math.floor(skillBadges / 2)

  return {
    badges: totalBadges,
    badgeTitles: allBadges.map((badge) => badge.title),
    allBadges: allBadges.map((badge) => ({ title: badge.title, earned: badge.description })),
    games,
    arcadePoints,
    officialGames: officialGames.map((game) => ({ points: game.points, title: game.title })),
    officialSkillBadges: officialMatchedSkillBadges,
    profileUrl,
    profileName,
    league: leagueInfo.league,
    leaguePoints: leagueInfo.points,
    skillBadges,
    status: 'checked',
  }
}

export const fetchProfileHtml = async (profileUrl) => {
  const response = await fetch(profileUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'accept-language': 'id,en-US;q=0.9,en;q=0.8',
      'user-agent': 'Mozilla/5.0 (compatible; ArcadeTracker/2026)',
    },
    redirect: 'follow',
  })

  if (!response.ok) {
    const error = new Error(`Halaman public profile tidak bisa dibuka. Status ${response.status}.`)
    error.statusCode = 502
    throw error
  }

  return response.text()
}

// ── Official Arcade page ──────────────────────────────────────────────────────

const decodeHtmlEntities = (value) =>
  value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")

export const fetchAndParseOfficialArcade = async () => {
  const response = await fetch('https://go.cloudskillsboost.google/arcade', {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'accept-language': 'id,en-US;q=0.9,en;q=0.8',
      'user-agent': 'Mozilla/5.0 Google-Arcade-Tracker/2026',
    },
    redirect: 'follow',
  })

  if (!response.ok) {
    const error = new Error(`Halaman official Arcade tidak bisa dibuka. Status ${response.status}.`)
    error.statusCode = 502
    throw error
  }

  const html = decodeHtmlEntities(await response.text())
  const $ = cheerio.load(html)
  const games = []
  const skills = []
  const seenGames = new Set()
  const seenSkills = new Set()

  $('a[href*="/games/"]').each((index, element) => {
    const link = $(element)
    const card = link.closest('.shuffle-item, .col-md-3, .card, .row').first()
    const title = normalizeWhitespace(card.find('h3, h5, p').first().text()) || normalizeWhitespace(link.text())
    const text = normalizeWhitespace(card.text())
    const code = /Access code:\s*([a-z0-9-]+)/i.exec(text)?.[1]
    const points = Number(/Arcade points:\s*(\d+)/i.exec(text)?.[1] || 1)
    const url = link.attr('href')
    const key = normalizeTitle(title || url || String(index))
    if (title && url && !seenGames.has(key)) {
      seenGames.add(key)
      games.push({ category: 'Official Game', code, points, title, url })
    }
  })

  $('a[href*="/course_templates/"]').each((index, element) => {
    const link = $(element)
    const title = normalizeWhitespace(link.text())
    const url = link.attr('href')
    const key = normalizeTitle(title || url || String(index))
    if (title && url && !seenSkills.has(key)) {
      seenSkills.add(key)
      skills.push({ category: 'Skill Badge', title, url })
    }
  })

  return { fetchedAt: new Date().toISOString(), games, skills }
}
