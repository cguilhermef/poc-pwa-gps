# Tarefa 3.0: Implementação da API Backend (Koa + Vercel)

<critical>Ler os arquivos de prd.md e tech-spec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Implementar a lógica da API utilizando Koa.js, expondo os endpoints definidos e garantindo que o roteamento funcione dentro do ambiente Serverless da Vercel.

<requirements>
- Endpoint POST `/api/track` (Single & Batch)
- Endpoint GET `/api/tracks/:sessionId`
- Endpoint GET `/api/status`
- Middleware de tratamento de erros e CORS (se necessário)
</requirements>

## Subtarefas

- [ ] 3.1 Configurar entrypoint do Koa em `api/index.ts`
- [ ] 3.2 Implementar rota `GET /api/status`
- [ ] 3.3 Implementar rota `POST /api/track` com validação de payload (recebe array)
- [ ] 3.4 Implementar rota `GET /api/tracks/:sessionId` com query no Supabase
- [ ] 3.5 Adicionar testes unitários para os handlers das rotas (mockando Supabase)

## Detalhes de Implementação

Ver seção **Endpoints de API** da Tech Spec.
A rota POST deve ser idempotente e resiliente. O tratamento do body deve suportar JSON.
Lembre-se que na Vercel, o arquivo `api/index.ts` deve exportar a função handler ou o app listen, dependendo do adapter usado para Koa.

## Critérios de Sucesso

- API responde corretamente a requests locais (via `vercel dev` ou node direto)
- POST salva dados no Supabase
- GET recupera dados corretamente
- Testes de rota passam

## Arquivos relevantes

- `api/index.ts`
- `api/routes/track.ts`
- `api/routes/status.ts`
