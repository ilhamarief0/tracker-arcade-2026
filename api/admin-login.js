import { getAdminConfig, safeEqual, sha256 } from './_lib.js'

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' })
  }

  const username = String(req.body?.username || '')
  const password = String(req.body?.password || '')
  const adminConfig = getAdminConfig()

  if (safeEqual(username, adminConfig.username) && safeEqual(sha256(password), adminConfig.passwordHash)) {
    return res.status(200).json({ token: adminConfig.token })
  }

  return res.status(401).json({ error: 'Username atau password admin salah.' })
}
