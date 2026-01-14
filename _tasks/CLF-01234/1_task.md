# Tarefa 1.0: Setup Inicial do Projeto (Frontend & Backend Structure)

<critical>Ler os arquivos de prd.md e tech-spec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Inicializar a estrutura do monorepo (ou estrutura híbrida suportada pela Vercel) contendo o Frontend React com Vite e a estrutura base para as Serverless Functions com Koa. Configurar as ferramentas de qualidade de código (ESLint, TSConfig).

<requirements>
- Inicializar projeto Vite com React e TypeScript
- Instalar dependências base do Backend (Koa, @types/koa, vercel adapters se necessário)
- Configurar `vercel.json` preliminar para roteamento básico
- Garantir que o comando `dev` rode o frontend
</requirements>

## Subtarefas

- [x] 1.1 Inicializar projeto Vite (React + TS) na raiz (ou pasta `src`)
- [x] 1.2 Instalar dependências do Koa e configurar pasta `api/`
- [x] 1.3 Criar configuração básica do `vercel.json` definindo rewrites para `/api/*`
- [x] 1.4 Configurar `.gitignore` adequado para Node/Vercel/Vite
- [x] 1.5 Validar script de build e dev
- [x] 1.6 Criar teste unitário simples (Hello World) para garantir que o setup de testes (Vitest) está funcionando

## Detalhes de Implementação

Ver seção **Arquitetura do Sistema** e **Sequenciamento de Desenvolvimento** da Tech Spec.
A estrutura de pastas deve suportar a convenção da Vercel onde `api/` contém as serverless functions.

## Critérios de Sucesso

- Projeto instala dependências sem erro (`pnpm install`)
- `pnpm dev` inicia o frontend
- Estrutura de pastas preparada para receber código da API e do App
- Vitest configurado e rodando

## Arquivos relevantes

- `package.json`
- `vercel.json`
- `vite.config.ts`
- `tsconfig.json`
