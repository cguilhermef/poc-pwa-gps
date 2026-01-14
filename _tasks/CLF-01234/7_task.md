# Tarefa 7.0: Motor de Sincronização (Real-time & Batch Recovery)

<critical>Ler os arquivos de prd.md e tech-spec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Integrar o `LocationService` (Tarefa 5), `StorageService` (Tarefa 6) e a API (Tarefa 3) para realizar o fluxo completo de dados. Tenta envio imediato; se falhar, guarda; se voltar online, envia o guardado.

<requirements>
- Envio unitário imediato ao receber posição
- Fallback para StorageService em caso de erro
- Processo de Background (via `setInterval` ou evento `online`) para drenar a fila (Recovery)
- Prevenção de duplicidade e race conditions simples
</requirements>

## Subtarefas

- [x] 7.1 Criar `SyncService` ou integrar no `MainController`
- [x] 7.2 Implementar lógica `onLocationUpdate` -> `POST /api/track` -> `catch` -> `Storage.save`
- [x] 7.3 Implementar loop de recovery (ex: a cada 30s verifica se tem itens no Storage e tenta enviar em batch)
- [x] 7.4 Atualizar UI com status da fila (via Contexto)
- [x] 7.5 Testes de integração lógica (mockando network failures)

## Detalhes de Implementação

Ver seção **Fluxo de Dados** da Tech Spec.
Esta é a tarefa que "cola" tudo. A lógica deve ser resiliente.
O envio em lote (Recovery) deve usar o endpoint que aceita array.

## Critérios de Sucesso

- Modo Online: Pontos chegam no servidor imediatamente
- Modo Offline: Pontos acumulam no IndexedDB
- Recuperação: Ao voltar online, pontos acumulados são enviados e removidos do banco local

## Arquivos relevantes

- `src/services/SyncEngine.ts` (ou nome similar)
- `src/hooks/useSync.ts`
