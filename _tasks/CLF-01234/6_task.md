# Tarefa 6.0: Persistência Offline (IndexedDB)

<critical>Ler os arquivos de prd.md e tech-spec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Implementar a camada de armazenamento local para suportar o funcionamento offline. O IndexedDB servirá como buffer circular ou fila FIFO para pontos que não puderam ser enviados.

<requirements>
- Usar biblioteca wrapper (ex: `idb` ou `dexie`) para facilitar uso do IndexedDB
- Implementar métodos `enqueue`, `dequeue`, `peek`
- Garantir persistência entre reloads da página
</requirements>

## Subtarefas

- [ ] 6.1 Instalar biblioteca `idb`
- [ ] 6.2 Criar `StorageService` inicializando o banco local
- [ ] 6.3 Implementar método `savePoint(point: LocationPoint)`
- [ ] 6.4 Implementar método `getPendingPoints(limit: number)`
- [ ] 6.5 Implementar método `removePoints(ids: string[])` ou estratégia de limpeza
- [ ] 6.6 Testes unitários do StorageService

## Detalhes de Implementação

Ver seção **Persistência Local (Fallback)** da Tech Spec.
A fila deve ser robusta. Se o envio falhar, o ponto entra aqui.
Atenção ao limite de 24h mencionado no PRD (pode ser implementado na limpeza ou no GET).

## Critérios de Sucesso

- Dados são salvos no browser (verificável via DevTools > Application)
- Leitura e remoção funcionam corretamente (FIFO)
- Capacidade de armazenar metadados (`isOfflineBuffer`)

## Arquivos relevantes

- `src/services/StorageService.ts`
