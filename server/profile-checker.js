import * as cheerio from 'cheerio'
import express from 'express'
import { fileURLToPath, pathToFileURL } from 'node:url'
import crypto from 'node:crypto'
import path from 'node:path'

const normalizeWhitespace = (value) => value.replace(/\s+/g, ' ').trim()

const defaultAdminUsername = 'developer'
const defaultAdminPasswordHash = 'da1d9dabb3400ae28465285a6c496cff9fbbb1e4a75e1ad98c74d26019180300'

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex')

const getAdminConfig = () => ({
  passwordHash: process.env.ADMIN_PASSWORD_HASH || defaultAdminPasswordHash,
  token: process.env.ADMIN_TOKEN || defaultAdminPasswordHash,
  username: process.env.ADMIN_USERNAME || defaultAdminUsername,
})

const safeEqual = (left, right) => {
  const leftBuffer = Buffer.from(String(left))
  const rightBuffer = Buffer.from(String(right))

  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer)
}

const requireAdmin = (request, response, next) => {
  const token = String(request.headers.authorization || '').replace(/^Bearer\s+/i, '')

  if (!token || !safeEqual(sha256(token), sha256(getAdminConfig().token))) {
    response.status(401).json({ error: 'Admin session tidak valid.' })
    return
  }

  next()
}

const normalizeTitle = (value) =>
  normalizeWhitespace(value)
    .toLowerCase()
    .replace(/&amp;/g, '&')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const officialArcadeGames = [
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

const officialSkillBadges = [
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

const decodeHtmlEntities = (value) =>
  value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")

const fetchOfficialArcadePage = async () => {
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

  return decodeHtmlEntities(await response.text())
}

const parseOfficialResources = (html) => {
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

  return {
    fetchedAt: new Date().toISOString(),
    games,
    skills,
  }
}

const validateProfileUrl = (profileUrl) => {
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

const countMatches = (html, patterns) => {
  const matches = new Set()

  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      const value = normalizeWhitespace(match[1] || match[0])
      if (value) {
        matches.add(value.toLowerCase())
      }
    }
  }

  return matches.size
}

const parseNumberNearLabels = (text, labels) => {
  for (const label of labels) {
    const afterLabel = new RegExp(`${label}[^0-9]{0,24}(\\d+)`, 'i').exec(text)
    const beforeLabel = new RegExp(`(\\d+)[^a-z0-9]{0,24}${label}`, 'i').exec(text)

    if (afterLabel?.[1]) {
      return Number(afterLabel[1])
    }

    if (beforeLabel?.[1]) {
      return Number(beforeLabel[1])
    }
  }

  return 0
}

const getSkillsGoogleBadges = ($) => {
  return $('.profile-badge')
    .map((index, element) => {
      const badge = $(element)
      const title = normalizeWhitespace(badge.find('.ql-title-medium').first().text())
      const earned = normalizeWhitespace(badge.find('.ql-body-medium').first().text())
      const modalId = badge.find('ql-button[modal]').attr('modal')
      const description = modalId ? normalizeWhitespace($(`#${modalId}`).text()) : ''

      return { description, earned, title }
    })
    .get()
    .filter((badge) => badge.title)
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

    if (monthlyMatch?.[0]) {
      matchedTitles.add(monthlyMatch[0])
    }
  }

  return officialGameMatchers.filter((game) => matchedTitles.has(game.normalizedTitle))
}

const findOfficialSkillBadges = (badges) => {
  const matchedTitles = new Set()

  for (const badge of badges) {
    const text = normalizeTitle(`${badge.title} ${badge.description}`)
    const exactMatch = officialSkillBadgeMatchers.find((skillBadge) => text.includes(skillBadge))

    if (exactMatch) {
      matchedTitles.add(exactMatch)
    }
  }

  return officialSkillBadges.filter((skillBadge) => matchedTitles.has(normalizeTitle(skillBadge)))
}

const parseProfile = (html, profileUrl) => {
  const $ = cheerio.load(html)
  const pageText = normalizeWhitespace($('body').text())
  const skillsGoogleBadges = getSkillsGoogleBadges($)
  const badgeCardCount = skillsGoogleBadges.length || $('[class*="badge"], [class*="Badge"], a[href*="/quests/"], a[href*="/games/"]').length
  const badgeTextCount = countMatches(html, [
    /alt=["']([^"']*(?:badge|skill badge|game)[^"']*)["']/gi,
    /title=["']([^"']*(?:badge|skill badge|game)[^"']*)["']/gi,
    /aria-label=["']([^"']*(?:badge|skill badge|game)[^"']*)["']/gi,
  ])
  const officialGames = findOfficialArcadeGames(skillsGoogleBadges)
  const officialMatchedSkillBadges = findOfficialSkillBadges(skillsGoogleBadges)
  const officialGamePoints = officialGames.reduce((sum, game) => sum + game.points, 0)
  const games = officialGames.length
  const skillBadges = officialMatchedSkillBadges.length
  const badges = Math.max(
    parseNumberNearLabels(pageText, ['badges?', 'earned badges?', 'completion badges?']),
    badgeCardCount,
    badgeTextCount,
    skillBadges,
  )

  const arcadePoints = officialGamePoints + Math.floor(skillBadges / 2)

  return {
    badges,
    badgeTitles: skillsGoogleBadges.map((badge) => badge.title),
    games,
    arcadePoints,
    officialGames: officialGames.map((game) => ({ points: game.points, title: game.title })),
    officialSkillBadges: officialMatchedSkillBadges,
    profileUrl,
    skillBadges,
    status: 'checked',
  }
}

const checkProfileUrl = async (profileUrl) => {
  const validation = validateProfileUrl(profileUrl)

  if (validation.error) {
    const error = new Error(validation.error)
    error.statusCode = 400
    throw error
  }

  const profileResponse = await fetch(validation.url, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'accept-language': 'id,en-US;q=0.9,en;q=0.8',
      'user-agent': 'Mozilla/5.0 Google-Arcade-Tracker/2026',
    },
    redirect: 'follow',
  })

  if (!profileResponse.ok) {
    const error = new Error(`Public profile tidak bisa dibuka. Status ${profileResponse.status}.`)
    error.statusCode = 502
    throw error
  }

  const html = await profileResponse.text()
  return parseProfile(html, validation.url)
}

export const createApiRouter = () => {
  const router = express.Router()

  router.use(express.json({ limit: '20kb' }))

  router.get('/api/health', (_request, response) => {
    response.json({ ok: true })
  })

  router.post('/api/check-profile', async (request, response) => {
    const profileUrl = String(request.body?.profileUrl || '').trim()

    try {
      response.json(await checkProfileUrl(profileUrl))
    } catch (error) {
      response.status(error.statusCode || 502).json({
        error: error instanceof Error ? error.message : 'Gagal mengambil public profile.',
      })
    }
  })

  router.post('/api/admin-login', (request, response) => {
    const username = String(request.body?.username || '')
    const password = String(request.body?.password || '')
    const adminConfig = getAdminConfig()

    if (safeEqual(username, adminConfig.username) && safeEqual(sha256(password), adminConfig.passwordHash)) {
      response.json({ token: adminConfig.token })
      return
    }

    response.status(401).json({ error: 'Username atau password admin salah.' })
  })

  router.get('/api/official-arcade', requireAdmin, async (_request, response) => {
    try {
      response.json(parseOfficialResources(await fetchOfficialArcadePage()))
    } catch (error) {
      response.status(error.statusCode || 502).json({
        error: error instanceof Error ? error.message : 'Gagal refresh halaman official Arcade.',
      })
    }
  })

  return router
}

export const createProductionServer = () => {
  const app = express()
  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  const distDir = path.join(rootDir, 'dist')

  app.use(createApiRouter())
  app.use(express.static(distDir))
  app.get('*splat', (_request, response) => {
    response.sendFile(path.join(distDir, 'index.html'))
  })

  return app
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href

if (isDirectRun) {
  const port = Number(process.env.PORT || 4174)
  const app = process.env.NODE_ENV === 'production' ? createProductionServer() : express().use(createApiRouter())

  app.listen(port, () => {
    console.log(`Arcade tracker server running on http://localhost:${port}`)
  })
}
