-- Users
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(255) UNIQUE NOT NULL,
  name          VARCHAR(255)        NOT NULL,
  role          VARCHAR(50)         NOT NULL DEFAULT 'guest'
                  CHECK (role IN ('admin', 'engineer', 'manager', 'guest')),
  password_hash VARCHAR(255)        NOT NULL,
  is_active     BOOLEAN             NOT NULL DEFAULT true,
  created_at    TIMESTAMP           NOT NULL DEFAULT NOW()
);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER   NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      UUID      NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_token   ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
