-- Schema para PoC PWA Rastreamento de Localização
-- Tabela: tracking_points

CREATE TABLE IF NOT EXISTS tracking_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_tracking_points_session_id ON tracking_points(session_id);
CREATE INDEX IF NOT EXISTS idx_tracking_points_recorded_at ON tracking_points(recorded_at);
CREATE INDEX IF NOT EXISTS idx_tracking_points_session_recorded ON tracking_points(session_id, recorded_at);

-- Comentários para documentação
COMMENT ON TABLE tracking_points IS 'Armazena pontos de localização coletados pela PWA';
COMMENT ON COLUMN tracking_points.session_id IS 'ID informado manualmente pelo usuário para identificar a sessão de teste';
COMMENT ON COLUMN tracking_points.recorded_at IS 'Data/hora da captura no dispositivo (UTC)';
COMMENT ON COLUMN tracking_points.received_at IS 'Data/hora de recebimento no servidor';
COMMENT ON COLUMN tracking_points.metadata IS 'Dados extras: speed, heading, battery level, isOfflineBuffer';
