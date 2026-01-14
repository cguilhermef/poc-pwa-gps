# Tarefa 4.0: Interface do Usuário (UI) e Gerenciamento de Sessão

<critical>Ler os arquivos de prd.md e tech-spec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Desenvolver a interface visual da PWA, permitindo que o operador insira o ID da sessão e controle o início/fim do rastreamento. Deve exibir logs e status em tempo real.

<requirements>
- Input para Session ID (obrigatório para iniciar)
- Botões de Start/Stop Tracking
- Painel de Status (Online/Offline, Pontos Pendentes, Último Envio)
- Lista de Logs (Console visual)
</requirements>

## Subtarefas

- [x] 4.1 Criar Contexto/Store para gerenciar estado da Sessão (`sessionId`, `isTracking`, `logs`)
- [x] 4.2 Implementar Componente de Input de Sessão
- [x] 4.3 Implementar Painel de Controle (Botões e Indicadores)
- [x] 4.4 Implementar Componente de Log Visual (scrollable area)
- [x] 4.5 Testes unitários dos componentes React e do Contexto

## Detalhes de Implementação

Ver seção **Fluxo de Dados** e **Monitoramento e Observabilidade** da Tech Spec.
UI deve ser responsiva e "Mobile First".
Usar TailwindCSS (se disponível no setup) ou CSS modules.

## Critérios de Sucesso

- Usuário consegue definir uma sessão
- UI reflete estado de "Rastreando" vs "Parado"
- Logs aparecem na tela dinamicamente

## Arquivos relevantes

- `src/contexts/SessionContext.tsx`
- `src/components/ControlPanel.tsx`
- `src/components/LogViewer.tsx`
- `src/App.tsx`
