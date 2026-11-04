# Linha do aparelho conectado Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Em Configurações, a linha de cada aparelho de "Lançar gastos pelo iPhone" e de cada IA de "IAs conectadas" ganha um ladrilho de ícone à esquerda, uma segunda linha mais clara (carteira com a marca e último gasto em tempo relativo) e guarda "Desconectar" num menu ⋯.

**Architecture:** Só front-end, em dois arquivos de seção. Cada linha vira `Item` com `ItemMedia variant="tile"` + `ItemContent` + um `DropdownMenu` ⋯ (`Button tertiary icon-md`) com um item `variant="destructive"` "Desconectar…", que abre o `AlertDialog` de hoje (sem mudança de fluxo de confirmação nem de RPC).

**Tech Stack:** Next 16, React 19, componentes de `src/components/ui/`, vitest por leitura de fonte (`src/test/fonte.ts`).

**Spec:** escolha do dono em 2026-11-03, opção **B · Ícone + ⋯** do mockup `public/_mock-aparelhos.html`: "Ladrilho do iPhone, carteira com a marca e o último gasto em tempo relativo. Desconectar fica guardado num menu ⋯." E: "Aplico o mesmo nas IAs conectadas" (aceito junto).

## Global Constraints

- Texto em português. Segunda linha do aparelho: `<marca da carteira> <nome da carteira> · último gasto <relativo>`; sem uso: `<marca> <nome> · ainda não lançou nada`. O relativo é `formatRelativeTimePtBr(t.last_used_at)` com a primeira letra minúscula (ex.: "último gasto há 2 h", "último gasto ontem", "último gasto 28/10").
- Ícones: `DevicePhoneMobileIcon` (aparelho) e `SparklesIcon` (IA), de `@heroicons/react/24/outline` dentro do `ItemMedia variant="tile"` (o ladrilho decide o corpo); `EllipsisHorizontalIcon` de `@heroicons/react/16/solid` sem tamanho no gatilho ⋯.
- Gatilho ⋯: `Button type="button" variant="tertiary" size="icon-md"` sem `size-*`, `aria-label` `Mais opções para <nome>`. Menu: `DropdownMenuContent align="end"`, um `DropdownMenuItem variant="destructive"` "Desconectar…" com `onSelect` que abre o `AlertDialog` atual.
- Marca da carteira: `WorkspaceBrandMark size="xs"` com `iconKey`/`backgroundColor` da carteira (quando a carteira não está em `workspaces`, sem marca e o texto "Carteira").
- Nada novo em `src/components/ui/`, `globals.css` ou `src/app/designsystem/`. Nenhum `<button>` cru. O "Ver como lançar" do mockup **não** entra: o guia cria um código novo no passo 1.
- O banco de desenvolvimento é o de produção: nenhum agente conecta, desconecta nem abre o navegador.
- Commits só com os arquivos da tarefa. `docs/JORNADAS.md`, `docs/atlas/*` ficam sem commit.

## Review Focus

1. **Escolher "Desconectar…" no menu abre o diálogo e não fecha sozinho**: o `onSelect` só seta o alvo; o `AlertDialog` fica fora do `DropdownMenu`. Teste por leitura de fonte.
2. **Nome longo** não empurra o ⋯ para fora: `ItemContent className="min-w-0"` e `truncate` no título e na segunda linha continuam.
3. **Carteira apagada ou de que a pessoa saiu**: a linha mostra "Carteira" sem marca, sem quebrar.
4. **Nunca usado** diz "ainda não lançou nada", nunca "último gasto" vazio.
5. **No toque** o ⋯ é alvo de 44 (vem do `icon-md`); nenhuma classe de tamanho no gatilho.

---

### Task 1: As linhas de aparelho e de IA com ladrilho e ⋯

**Files:**
- Modify: `src/components/account/atalho-secao.tsx`, `src/components/account/ias-secao.tsx`
- Test: `src/components/account/conta.test.ts` (novo `describe("Linha do aparelho e da IA")`)

- [ ] **Step 1: Testes** em `conta.test.ts`, lendo os dois arquivos sem comentários:
  - os dois contêm `ItemMedia variant="tile"`, `size="icon-md"`, `<EllipsisHorizontalIcon aria-hidden />`, `variant="destructive"` e `Desconectar…`, e **não** contêm `>\s*Desconectar\s*</Button>` dentro de `ItemActions` (regex `/<ItemActions>\s*<Button[^>]*>\s*Desconectar/` não casa);
  - `atalho-secao.tsx` contém `DevicePhoneMobileIcon`, `WorkspaceBrandMark`, `formatRelativeTimePtBr`, `"ainda não lançou nada"` e `último gasto`; não contém `formatDateTimeShortPtBr` nem `"nunca usado"`;
  - `ias-secao.tsx` contém `SparklesIcon`;
  - `aria-label={\`Mais opções para ${` aparece nos dois;
  - o `AlertDialog` vem depois do fechamento do `</Card>` nos dois (índice de `<AlertDialog` > índice do último `</Card>`).
- [ ] **Step 2:** `npx vitest run src/components/account` — falha.
- [ ] **Step 3: Implemente** nos dois arquivos o desenho das Global Constraints. Um `const relativo = (iso: string) => { const s = formatRelativeTimePtBr(iso); return s.charAt(0).toLowerCase() + s.slice(1) }` local em `atalho-secao.tsx`. Em `ias-secao.tsx` a segunda linha continua `desde <data>`.
- [ ] **Step 4:** `npx tsc --noEmit && npx vitest run src/components/account && npx eslint src/components/account && node .claude/skills/design-system-guard/scripts/audit.mjs src/components/account` — verde, sem achado novo.
- [ ] **Step 5:** commit `feat(configuracoes): aparelhos e IAs com ladrilho, e Desconectar no ⋯`.

### Task 2: Jornadas (sessão principal, sem commit)

- [ ] `docs/JORNADAS.md`: linhas 328/332 e 789 dizem "Desconectar, no ⋯ da linha"; tabela da linha 399 e 2093 descrevem a linha nova; 2071–2072 idem.
- [ ] `docs/atlas/template.html` linha ~507 e a de IAs; `python3 docs/atlas/build.py`; republicar o Atlas.
