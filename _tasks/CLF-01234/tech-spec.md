# Especificação Técnica - PoC PWA Rastreamento de Localização

## Resumo Executivo

Este documento descreve a arquitetura para um Proof of Concept (PoC) de uma Progressive Web App (PWA) destinada a validar a viabilidade técnica de coleta de geolocalização em segundo plano em dispositivos móveis (iOS e Android). A solução utilizará **React com Vite** para o frontend, configurado com `vite-plugin-pwa` para capacidades offline e service workers. O backend será construído com **Koa.js**, adaptado para rodar como Serverless Functions na **Vercel**, persistindo os dados em um banco de dados **Supabase**. A estratégia adota envio em tempo real (ponto a ponto) como padrão, utilizando armazenamento local e envio em lote apenas como fallback em caso de falhas ou desconexão.

## Arquitetura do Sistema

### Visão Geral dos Componentes

- **PWA Client (Vite/React)**: Responsável pela interface do operador (com input de Sessão), solicitação de permissões, coleta de geolocalização (`navigator.geolocation.watchPosition`), gerenciamento de fila offline (IndexedDB) e sincronização com o servidor.
- **API Gateway (Vercel Functions + Koa)**: Ponto de entrada HTTP que recebe os dados de telemetria. O Koa gerencia o roteamento e a validação básica antes de persistir.
- **Persistência (Supabase)**: Banco de dados PostgreSQL gerenciado para armazenar os logs de localização e sessões de teste.

### Fluxo de Dados

1. **Setup**: Usuário informa `Session ID` manual na UI antes de iniciar.
2. **Coleta**: Client captura GPS a cada 30s.
3. **Envio Imediato (Online)**: Client tenta enviar o ponto capturado imediatamente para a API (`POST` unitário).
4. **Fallback (Offline/Falha)**: Se o envio falhar, o ponto é salvo na fila local (IndexedDB).
5. **Recuperação**: Periodicamente ou ao retomar conexão, Client envia pontos acumulados em lote.
6. **Ingestão**: API (Koa) recebe (unitário ou lote), valida e insere no Supabase.

## Design de Implementação

### Interfaces Principais

```typescript
// Modelo de Ponto de Localização
interface LocationPoint {
  timestamp: string;      // ISO 8601 UTC
  latitude: number;
  longitude: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  isOfflineBuffer: boolean; // Flag indicando se foi recuperado do buffer offline
}

// Payload de Envio
interface TrackPayload {
  sessionId: string;      // Identificador informado pelo usuário
  points: LocationPoint[]; // Array contendo 1 (realtime) ou N (batch recovery) pontos
}

// Interface da Fila Local
interface OfflineQueue {
  enqueue(point: LocationPoint): Promise<void>;
  peekBatch(size: number): Promise<LocationPoint[]>;
  removeBatch(points: LocationPoint[]): Promise<void>;
  size(): Promise<number>;
}
```

### Modelos de Dados (Supabase)

Tabela: `tracking_points`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Primary Key |
| session_id | text | ID informado manualmente pelo usuário |
| recorded_at | timestamptz | Data/hora da captura no device |
| received_at | timestamptz | Data/hora de recebimento no server (default now()) |
| latitude | double | |
| longitude | double | |
| accuracy | double | |
| metadata | jsonb | Dados extras (speed, heading, battery level, isOfflineBuffer) |

### Endpoints de API

- `POST /api/track`
    - **Descrição**: Recebe pontos de localização. Suporta tanto envio unitário (tempo real) quanto lote (recuperação).
    - **Body**: `TrackPayload` (`{ sessionId: string, points: LocationPoint[] }`)
    - **Resposta**: `200 OK` (sucesso), `207 Multi-Status` (parcial) ou `500` (erro).

- `GET /api/tracks/:sessionId`
    - **Descrição**: Retorna todos os pontos de rastreamento de uma sessão específica.
    - **Parâmetros**: `sessionId` (string)
    - **Resposta**: `{ sessionId: string, points: LocationPoint[] }` ordenados por `recorded_at`.

- `GET /api/status`
    - **Descrição**: Healthcheck simples para validar conectividade da API.

## Pontos de Integração

- **Supabase Client**: Uso da biblioteca `@supabase/supabase-js` no backend (Koa) para inserção e consulta de dados.
- **Navigator Geolocation API**: API nativa do browser para coleta de dados.
- **Service Worker**: Gerenciado via `vite-plugin-pwa` para cache de assets e estratégias de fallback.

## Abordagem de Testes

### Testes Unidade
- **Fila Offline (OfflineQueue)**: Testar lógica de enqueue, dequeue e priorização de envio online vs armazenamento.
- **Adaptador Koa-Vercel**: Validar tradução de requests.

### Validação do PoC (Testes Manuais/E2E)
- **Fluxo de Sessão**: Validar que pontos de diferentes Session IDs não se misturam na visualização.
- **Cenário A (Ideal)**: App aberto, envio ponto a ponto com sucesso (verificar logs de requests individuais).
- **Cenário B (Offline/Recovery)**: Simular falha de rede, acumular pontos, restaurar rede e verificar envio em lote (batch).
- **Cenário C (Background/Locked)**: Testar persistência do envio periódico com tela bloqueada (iOS/Android).

## Sequenciamento de Desenvolvimento

### Ordem de Construção

1. **Setup do Projeto**: Inicializar repo, configurar Vite + React, Koa, Supabase Client e `vercel.json`.
2. **Backend (API)**: Implementar `POST /api/track` (handling de array) e `GET /api/tracks/:sessionId`.
3. **Frontend (UI)**: Criar tela inicial com Input de Session ID e botões Start/Stop.
4. **Lógica de Coleta e Envio**: Implementar `watchPosition` chamando `POST` unitário.
5. **Persistência Local (Fallback)**: Implementar `catch` no envio para salvar no IndexedDB e rotina de retry para lotes.
6. **Integração e Deploy**: Deploy na Vercel e validação.

### Dependências Técnicas

- Projeto criado no Supabase (URL e Anon Key).
- Conta Vercel configurada.
- Dispositivos físicos para validação.

## Monitoramento e Observabilidade

- **Logs do Client**: Exibir na UI: Session ID atual, Status de Conexão, Pontos Pendentes, Log de últimos envios (Sucesso/Falha).
- **Vercel Logs**: Monitorar erros na API.
- **Supabase Dashboard**: Verificar integridade dos dados por Session ID.

## Considerações Técnicas

### Decisões Principais

- **Envio Ponto a Ponto vs Lote**: Mudança para envio unitário padrão para visualização em tempo real e granularidade de logs de erro, mantendo lote apenas para recuperação eficiente.
- **Session ID Manual**: Permite flexibilidade em testes distribuídos sem login complexo.

### Riscos Conhecidos

- **iOS Background Limitation**: (Mantido) Risco de suspensão do processo pelo iOS.
- **Timer Throttling**: (Mantido).

### Conformidade com Padrões

Nenhuma regra pré-definida encontrada em `@.windsurf/rules`. O projeto seguirá padrões de código TypeScript estrito e ESLint padrão do Vite.

### Arquivos relevantes e dependentes

- `package.json`
- `vercel.json`
- `api/index.ts`
- `api/routes.ts`
- `src/main.tsx`
- `src/services/LocationService.ts`
- `src/services/StorageService.ts`
