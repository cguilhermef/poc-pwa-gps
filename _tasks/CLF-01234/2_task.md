# Tarefa 2.0: Configuração do Banco de Dados e Tipagem Compartilhada

<critical>Ler os arquivos de prd.md e tech-spec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Configurar a conexão com o Supabase e definir os tipos TypeScript compartilhados (DTOs) que serão usados tanto pelo Frontend quanto pelo Backend para garantir consistência nos dados de geolocalização.

<requirements>
- Criar script SQL ou Migration para tabela `tracking_points`
- Definir interfaces TypeScript (`LocationPoint`, `TrackPayload`)
- Configurar cliente Supabase (instanciação singleton)
</requirements>

## Subtarefas

- [ ] 2.1 Criar arquivo SQL de definição da tabela `tracking_points` conforme Tech Spec
- [ ] 2.2 Criar arquivo de tipos compartilhados `src/types/index.ts` (ou local apropriado importável por ambos)
- [ ] 2.3 Instalar `@supabase/supabase-js`
- [ ] 2.4 Criar módulo de cliente Supabase (`src/lib/supabase.ts` e `api/lib/supabase.ts` se necessário separar contextos)
- [ ] 2.5 Testar conexão com Supabase via script simples (mockando env vars)

## Detalhes de Implementação

Ver seção **Modelos de Dados** da Tech Spec.
Atentar para os campos `session_id`, `isOfflineBuffer` (no metadata) e tipos de dados geoespaciais (latitude/longitude como float/double).

## Critérios de Sucesso

- Tabela criada no Supabase (manual ou via migration script validado)
- Interfaces TS refletem exatamente a spec
- Cliente Supabase conecta com sucesso usando variáveis de ambiente (`.env.local`)

## Arquivos relevantes

- `src/types/models.ts`
- `src/lib/supabase.ts`
- `database/schema.sql` (novo arquivo para documentar schema)
