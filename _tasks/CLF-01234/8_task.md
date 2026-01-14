# Tarefa 8.0: Integração Final, Deploy e Testes

<critical>Ler os arquivos de prd.md e tech-spec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Realizar o deploy na Vercel, configurar variáveis de ambiente de produção e executar o roteiro de testes manuais (E2E) para validar os requisitos do PoC.

<requirements>
- Configurar PWA (Manifest, Icons) via `vite-plugin-pwa`
- Deploy na Vercel (Production)
- Execução de testes manuais em dispositivos reais
- Correções finais
</requirements>

## Subtarefas

- [ ] 8.1 Configurar `vite-plugin-pwa` (manifest.json, icons, service worker básico)
- [ ] 8.2 Realizar Deploy na Vercel e configurar ENV Vars do Supabase
- [ ] 8.3 Executar Cenário A (Ideal)
- [ ] 8.4 Executar Cenário B (Background)
- [ ] 8.5 Executar Cenário C (Locked)
- [ ] 8.6 Executar Cenário D (Offline)
- [ ] 8.7 Documentar resultados/limitações encontradas (QA Report simples)

## Detalhes de Implementação

Ver seção **Abordagem de Testes** da Tech Spec.
O foco aqui é garantir que o entregável (URL pública) funcione conforme esperado nos dispositivos alvo.

## Critérios de Sucesso

- URL da Vercel acessível e HTTPS funcional
- PWA instalável no iOS e Android
- Dados fluindo para o Supabase nos testes realizados

## Arquivos relevantes

- `vite.config.ts` (PWA plugin)
- `vercel.json`
