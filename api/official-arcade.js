import { fetchAndParseOfficialArcade, verifyAdminToken } from './_lib.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed.' })
  }

  if (!verifyAdminToken(req.headers.authorization)) {
    return res.status(401).json({ error: 'Admin session tidak valid.' })
  }

  try {
    const result = await fetchAndParseOfficialArcade()
    return res.status(200).json(result)
  } catch (error) {
    return res.status(error.statusCode || 502).json({
      error: error instanceof Error ? error.message : 'Gagal refresh halaman official Arcade.',
    })
  }
}
