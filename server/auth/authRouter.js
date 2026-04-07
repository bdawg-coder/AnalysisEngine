const express      = require('express')
const bcrypt       = require('bcrypt')
const { randomUUID } = require('crypto')
const pool         = require('../db')
const { requireAuth } = require('./authMiddleware')

const router = express.Router()
const SESSION_HOURS = parseInt(process.env.SESSION_DURATION_HOURS || '8')

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email.toLowerCase().trim()]
    )

    console.log(`[login] email=${email} found=${result.rows.length > 0}`)

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const user = result.rows[0]
    const valid = await bcrypt.compare(password, user.password_hash)

    console.log(`[login] password_valid=${valid}`)

    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Create session
    const token     = randomUUID()
    const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000)
    await pool.query(
      'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, token, expiresAt.toISOString()]
    )

    res.json({
      token,
      expiresAt,
      user: {
        id:    user.id,
        email: user.email,
        name:  user.name,
        role:  user.role,
      },
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/auth/logout
router.post('/logout', requireAuth, async (req, res) => {
  const token = req.headers['x-session-token']

  try {
    await pool.query('DELETE FROM sessions WHERE token = $1', [token])
    res.json({ ok: true })
  } catch (err) {
    console.error('Logout error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/auth/me  — validates session and returns current user
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user })
})

module.exports = router
