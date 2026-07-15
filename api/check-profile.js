import { fetchProfileHtml, parseProfile, validateProfileUrl } from './_lib.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' })
  }

  const profileUrl = String(req.body?.profileUrl || '').trim()
  const validation = validateProfileUrl(profileUrl)

  if (validation.error) {
    return res.status(400).json({ error: validation.error })
  }

  try {
    const html = await fetchProfileHtml(validation.url)
    const result = parseProfile(html, validation.url)
    return res.status(200).json(result)
  } catch (error) {
    return res.status(error.statusCode || 502).json({
      error: error instanceof Error ? error.message : 'Auto check gagal membaca public profile.',
    })
  }
}
