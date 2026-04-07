const pool = require('../db')

async function requireAuth(req, res, next) {
  const token = req.headers['x-session-token']

  if (!token) {
    return res.status(401).json({ error: 'No session token provided' })
  }

  try {
    const result = await pool.query(
      `SELECT s.user_id, s.expires_at, u.email, u.name, u.role, u.is_active
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = $1`,
      [token]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid session' })
    }

    const session = result.rows[0]

    if (new Date(session.expires_at) < new Date()) {
      return res.status(401).json({ error: 'Session expired' })
    }

    if (!session.is_active) {
      return res.status(403).json({ error: 'Account disabled' })
    }

    req.user = {
      id:    session.user_id,
      email: session.email,
      name:  session.name,
      role:  session.role,
    }

    next()
  } catch (err) {
    console.error('Auth middleware error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthenticated' })
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    next()
  }
}

module.exports = { requireAuth, requireRole }
