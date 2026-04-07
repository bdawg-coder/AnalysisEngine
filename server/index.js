const express    = require('express')
const cors       = require('cors')
const authRouter = require('./auth/authRouter')
const seed       = require('./db/seed')

const app  = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

app.use('/api/auth', authRouter)

app.get('/api/health', (_, res) => res.json({ ok: true }))

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`)
  try {
    await seed()
  } catch (err) {
    console.error('Seed error:', err.message)
  }
})
