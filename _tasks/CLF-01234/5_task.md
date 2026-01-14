# Tarefa 5.0: Serviço de Geolocalização e Coleta de Dados

<critical>Ler os arquivos de prd.md e tech-spec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Implementar a lógica core de captura de posição GPS. Deve abstrair a API `navigator.geolocation` e fornecer dados limpos para a aplicação, lidando com permissões e erros.

<requirements>
- Utilizar `watchPosition` para receber updates
- Filtrar updates muito próximos se necessário (throttle de 30s sugerido na spec, mas `watchPosition` é event-based, verificar implementação)
- Tratar erros de permissão e indisponibilidade de GPS
</requirements>

## Subtarefas

- [ ] 5.1 Criar `LocationService` (classe ou hook)
- [ ] 5.2 Implementar solicitação de permissão e handling de resposta (Denied/Granted)
- [ ] 5.3 Implementar listener `watchPosition` com options (`enableHighAccuracy`)
- [ ] 5.4 Formatar dados crus do GPS para a interface `LocationPoint`
- [ ] 5.5 Testes unitários do Service (mockando `navigator.geolocation`)

## Detalhes de Implementação

Ver seção **Design de Implementação** e **Riscos Conhecidos** da Tech Spec.
Importante: O requisito de 30s pode exigir um controle manual de tempo se o `watchPosition` for muito ruidoso, ou aceitar todos os pontos e o backend filtrar. A spec menciona "coletar a cada 30s", então pode ser necessário um `setInterval` que pega a `currentPosition` OU filtrar o stream do `watchPosition`. Decisão: Implementar filtro de tempo no stream do `watchPosition`.

## Critérios de Sucesso

- Serviço emite coordenadas GPS quando ativo
- Erros de permissão são capturados e expostos
- Timestamp e Accuracy são capturados corretamente

## Arquivos relevantes

- `src/services/LocationService.ts`
- `src/hooks/useLocation.ts`
