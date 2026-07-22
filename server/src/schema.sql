-- ============================================================
--  SmartNotes — Schema PostgreSQL
--  Execute: psql -U postgres -d smartnotes -f schema.sql
-- ============================================================

-- Extensão para gerar UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Usuários ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  fname         VARCHAR(100) NOT NULL,
  lname         VARCHAR(100) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  color_idx     SMALLINT    NOT NULL DEFAULT 0,
  theme         VARCHAR(10)  NOT NULL DEFAULT 'light',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Quadros ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS boards (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       VARCHAR(255) NOT NULL DEFAULT 'Quadro',
  position   INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_boards_user ON boards(user_id);

-- ── Notas do quadro ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id   UUID        NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  text       TEXT        NOT NULL DEFAULT '',
  color_idx  SMALLINT    NOT NULL DEFAULT 0,
  board_x    FLOAT       NOT NULL DEFAULT 100,
  board_y    FLOAT       NOT NULL DEFAULT 100,
  board_w    INTEGER     NOT NULL DEFAULT 220,
  board_h    INTEGER     NOT NULL DEFAULT 90,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_board ON notes(board_id);
CREATE INDEX IF NOT EXISTS idx_notes_user  ON notes(user_id);

-- ── Notas de tarefa (seção Tarefas) ──────────────────────────
CREATE TABLE IF NOT EXISTS task_notes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      VARCHAR(500) NOT NULL DEFAULT '',
  content    TEXT        NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_notes_user ON task_notes(user_id);

-- ── Função + triggers para atualizar updated_at ───────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_users_updated_at') THEN
    CREATE TRIGGER trg_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_boards_updated_at') THEN
    CREATE TRIGGER trg_boards_updated_at
      BEFORE UPDATE ON boards
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_notes_updated_at') THEN
    CREATE TRIGGER trg_notes_updated_at
      BEFORE UPDATE ON notes
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_task_notes_updated_at') THEN
    CREATE TRIGGER trg_task_notes_updated_at
      BEFORE UPDATE ON task_notes
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;
