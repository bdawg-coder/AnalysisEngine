const bcrypt = require('bcrypt')
const pool   = require('../db')

async function seed() {
  const email    = 'admin@fiber-domain.com'
  const password = 'Admin1234!'

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email])
  if (existing.rows.length > 0) return // already seeded

  const hash = await bcrypt.hash(password, 12)
  await pool.query(
    'INSERT INTO users (email, name, role, password_hash) VALUES ($1, $2, $3, $4)',
    [email, 'Admin', 'admin', hash]
  )

  console.log('Seeded default admin user:', email)
}

module.exports = seed
