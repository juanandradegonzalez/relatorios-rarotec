-- Criar tabela de relatórios
CREATE TABLE IF NOT EXISTS relatorios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL, -- 'servicos' ou 'migracao'
  cliente VARCHAR(255) NOT NULL,
  municipio VARCHAR(255),
  estado VARCHAR(2),
  data_atendimento DATE NOT NULL,
  tecnicos TEXT[] DEFAULT '{}',
  dados JSONB DEFAULT '{}',
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_relatorios_user_id ON relatorios(user_id);
CREATE INDEX IF NOT EXISTS idx_relatorios_tipo ON relatorios(tipo);
CREATE INDEX IF NOT EXISTS idx_relatorios_cliente ON relatorios(cliente);
CREATE INDEX IF NOT EXISTS idx_relatorios_estado ON relatorios(estado);
CREATE INDEX IF NOT EXISTS idx_relatorios_created_at ON relatorios(created_at DESC);
