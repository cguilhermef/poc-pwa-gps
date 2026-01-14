# QA Report - PoC PWA Rastreamento de Localização

## Informações do Deploy

| Item | Valor |
|------|-------|
| **URL de Produção** | https://wimt-cguilhermefs-projects.vercel.app |
| **Data do Deploy** | 2026-01-14 |
| **Versão PWA** | vite-plugin-pwa 1.2.0 |
| **Service Worker** | generateSW (Workbox) |

## Status da Configuração

### PWA (Subtarefa 8.1) ✅

- [x] `vite-plugin-pwa` configurado
- [x] Manifest com nome, descrição, theme_color
- [x] Ícones SVG (192x192, 512x512, apple-touch-icon)
- [x] Service Worker com precache de assets
- [x] Meta tags PWA no index.html

### Deploy Vercel (Subtarefa 8.2) ✅

- [x] Build de produção funcionando
- [x] Serverless Functions configuradas (API)
- [x] Variáveis de ambiente configuradas:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

### Ação Necessária

**IMPORTANTE**: O projeto está com "Vercel Authentication" habilitado, o que impede acesso público. Para desabilitar:

1. Acesse https://vercel.com/cguilhermefs-projects/wimt/settings
2. Vá em "Deployment Protection"
3. Desabilite "Vercel Authentication" para Production

## Roteiro de Testes Manuais

### Cenário A - Ideal (App em Primeiro Plano)

**Objetivo**: Validar coleta e envio ponto a ponto com app aberto.

**Passos**:
1. Acessar a PWA no dispositivo móvel
2. Informar um Session ID único (ex: `test-android-a-001`)
3. Conceder permissão de localização
4. Clicar em "Iniciar Rastreamento"
5. Manter app aberto por 5 minutos
6. Verificar logs na UI (pontos enviados)
7. Clicar em "Parar Rastreamento"

**Verificação**:
- [ ] Pontos coletados a cada ~30s
- [ ] Status "Online" durante o teste
- [ ] Pontos pendentes = 0 (envio imediato)
- [ ] Dados no Supabase (`GET /api/tracks/{sessionId}`)

### Cenário B - Background/Minimizado

**Objetivo**: Validar comportamento com app em segundo plano.

**Passos**:
1. Iniciar rastreamento (Session ID: `test-android-b-001`)
2. Minimizar o app (ir para home)
3. Aguardar 5 minutos
4. Retornar ao app
5. Verificar logs

**Verificação**:
- [ ] Quantos pontos foram coletados em background?
- [ ] Houve interrupção da coleta?
- [ ] Pontos foram enviados ou ficaram pendentes?

### Cenário C - Tela Bloqueada

**Objetivo**: Validar comportamento com tela bloqueada.

**Passos**:
1. Iniciar rastreamento (Session ID: `test-android-c-001`)
2. Bloquear a tela do dispositivo
3. Aguardar 5 minutos
4. Desbloquear e verificar logs

**Verificação**:
- [ ] Coleta continuou com tela bloqueada?
- [ ] Qual foi a taxa de coleta (pontos/minuto)?
- [ ] Diferenças entre Android e iOS?

### Cenário D - Offline/Recovery

**Objetivo**: Validar fila offline e sincronização.

**Passos**:
1. Iniciar rastreamento (Session ID: `test-android-d-001`)
2. Ativar modo avião após 1 minuto
3. Aguardar 3 minutos (pontos devem acumular)
4. Desativar modo avião
5. Verificar sincronização

**Verificação**:
- [ ] Pontos acumularam localmente (IndexedDB)
- [ ] Status mudou para "Offline"
- [ ] Sincronização em lote ao reconectar
- [ ] Ordem cronológica preservada no servidor

## Resultados dos Testes

### Android (Chrome)

| Cenário | Status | Observações |
|---------|--------|-------------|
| A - Ideal | ⏳ Pendente | |
| B - Background | ⏳ Pendente | |
| C - Locked | ⏳ Pendente | |
| D - Offline | ⏳ Pendente | |

### iOS (Safari)

| Cenário | Status | Observações |
|---------|--------|-------------|
| A - Ideal | ⏳ Pendente | |
| B - Background | ⏳ Pendente | |
| C - Locked | ⏳ Pendente | |
| D - Offline | ⏳ Pendente | |

## Limitações Conhecidas

### iOS/Safari
- **Background Execution**: iOS suspende processos de PWA em background após ~30s
- **Wake Lock API**: Não suportada no Safari
- **Service Worker**: Limitações em background sync

### Android/Chrome
- **Timer Throttling**: Timers podem ser throttled em background
- **Battery Optimization**: Pode afetar coleta em background

## Métricas de Sucesso (PRD)

| Métrica | Target | Resultado |
|---------|--------|-----------|
| Taxa de coleta | >= 95% | ⏳ Pendente |
| Taxa de entrega | >= 99% | ⏳ Pendente |
| Integridade temporal | 100% | ⏳ Pendente |

## Próximos Passos

1. Desabilitar Vercel Authentication
2. Executar testes em dispositivos físicos
3. Preencher resultados neste documento
4. Documentar limitações encontradas
