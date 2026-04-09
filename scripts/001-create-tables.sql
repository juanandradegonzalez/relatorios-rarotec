-- Tabela de usuarios para autenticacao
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de sessoes para autenticacao
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de relatorios
CREATE TABLE IF NOT EXISTS relatorios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('servicos', 'migracao')),
  
  -- Dados do cliente
  estado VARCHAR(2) NOT NULL,
  municipio VARCHAR(100) NOT NULL,
  entidades JSONB NOT NULL,
  
  -- Dados do servico
  modulos TEXT[] NOT NULL,
  resumo TEXT,
  data_servico DATE NOT NULL,
  
  -- Tecnicos
  tecnicos JSONB NOT NULL,
  
  -- Emails para envio
  emails TEXT[],
  
  -- Dados completos do formulario (para regenerar PDF)
  form_data JSONB NOT NULL,
  
  -- Metadados
  criado_por UUID NOT NULL REFERENCES users(id),
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW(),
  
  -- Arquivo PDF
  pdf_url TEXT,
  emails_enviados TEXT[]
);

-- Indices para busca
CREATE INDEX IF NOT EXISTS idx_relatorios_tipo ON relatorios(tipo);
CREATE INDEX IF NOT EXISTS idx_relatorios_estado ON relatorios(estado);
CREATE INDEX IF NOT EXISTS idx_relatorios_municipio ON relatorios(municipio);
CREATE INDEX IF NOT EXISTS idx_relatorios_data ON relatorios(data_servico);
CREATE INDEX IF NOT EXISTS idx_relatorios_criado_por ON relatorios(criado_por);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
