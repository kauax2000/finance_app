# Busca por escopo na paleta (`/transacoes`, `/membros`…) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Na paleta ⌘K do app, digitar `/` lista os lugares onde dá para buscar; escolher um (Enter, ou o nome inteiro seguido de espaço) prende a busca naquele grupo, com o nome dele pintado no campo, como a busca por camada do catálogo.

**Architecture:** O casamento do `/termo` com os escopos é uma função pura em `src/lib/app-search-scopes.ts` (testada). A paleta volta a usar `CommandPages`: um escopo é uma página da pilha (`push({ id, label, icon })`), e o `CommandInput` já desenha o `CommandScope` no campo, esvazia o texto ao entrar e sai com dois Backspaces (comportamento existente do design system, nada muda em `src/components/ui/`). Dentro do escopo, só o grupo dele aparece, com mais linhas.

**Tech Stack:** Next.js 16, React 19, cmdk pelo `Command` do design system, TanStack Query, Vitest.

**Spec:** este documento (decisões abaixo). Contexto: `docs/superpowers/specs/2026-10-16-busca-global-do-app-design.md`.

## Decisões (do Claude; o dono pediu "planeje bem e execute")

1. **Os escopos** (id · comando · rótulo · aliases), na ordem dos grupos da paleta:
   `telas` · `/telas` · Telas · `paginas` — `acoes` · `/acoes` · Ações · `adicionar`, `novo` —
   `transacoes` · `/transacoes` · Transações · `lancamentos`, `gastos` —
   `cartoes` · `/cartoes` · Cartões · `fatura` — `categorias` · `/categorias` · Categorias —
   `parcelas` · `/parcelas` · Compras parceladas · `parceladas` —
   `assinaturas` · `/assinaturas` · Assinaturas · `recorrentes` —
   `contas` · `/contas` · Contas a pagar · `boletos` —
   `membros` · `/membros` · Membros · `pessoas` — `carteiras` · `/carteiras` · Carteiras · `workspaces`.
   Acento e caixa não importam: `/Transações` = `/transacoes`.
2. **Digitar `/`** (na raiz, como primeiro caractere) troca a lista inteira por um grupo só, **"Buscar em"**, com os escopos que casam o que vem depois da barra (`/` sozinho: todos, na ordem acima; `/tra`: Transações; `/gas`: Transações pelo alias). Cada linha: o ícone do grupo, o rótulo e, na meta, o comando (`/transacoes`). Enter entra no escopo.
3. **Atalho de quem digita**: o comando inteiro (ou um alias inteiro) seguido de espaço entra direto — `/membros ` vira o escopo Membros com o campo vazio. O que vier depois do espaço não se perde: `/membros ana` entra em Membros com "ana" no campo.
4. **Dentro do escopo**: só o grupo do escopo, sem Recentes. Campo vazio mostra a lista inteira do grupo (grupos locais, até **50** linhas, na ordem da fonte); com texto, até **50** ranqueadas. Transações dentro do escopo trazem até **20** (não 8), com "Ver todas em Transações" no fim; campo vazio em Transações mostra a dica "Digite uma descrição, um valor ou uma data." (sem consulta).
5. **O campo**: placeholder na raiz "Buscar, ou / para escolher onde…"; no escopo "Buscar em <rótulo>…". O `CommandScope` é o padrão do `CommandInput` (sem `tint`: uma peça de marca por tela, e o brilho da busca já é a do cabeçalho). Sair: Backspace duas vezes com o campo vazio (o primeiro arma, o segundo sai) — o comportamento do componente.
6. **Vazio no escopo**: `Nada em <rótulo> para "<termo>".` com a descrição "Apague o escopo com Backspace para buscar em tudo."
7. **Legenda**: na raiz, uma cápsula "`/` escolher onde"; no escopo, "`⌫` sair do escopo" no lugar dela. As outras (navegar, abrir, fechar) ficam.
8. **Não é mudança de jornada** (nenhum destino novo), mas a linha "Busca global (⌘K)" do `JORNADAS.md`, o item "Busca." do Atlas e o bullet "Busca" do `AGENTS.md` ganham uma frase sobre os escopos, e o Atlas é republicado.

## Global Constraints

- **Nunca gravar no banco** (o de desenvolvimento é o de produção).
- Nada muda em `src/components/ui/`, `src/app/globals.css` nem `src/app/designsystem/`.
- Ícones `@heroicons/react/16/solid` dentro de `CommandItemIcon`.
- Textos e comentários em português, na densidade do arquivo.
- `npx tsc --noEmit && npm run lint && npm run test:unit` passam; commits com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. `/` seguido de nada que casa (`/xyz`) — o grupo "Buscar em" some e o vazio diz `Nenhum lugar com "/xyz".`; nada de consulta ao banco com "/xyz" como texto. Teste na Task 2 (fonte) e Task 1 (`casarEscopos` vazio).
2. Uma barra no meio do texto (`50/50`, `15/03`) não é comando: só conta como comando com `/` no **primeiro** caractere da raiz. Teste na Task 1.
3. Dentro de um escopo, digitar `/` é texto comum (não abre "Buscar em"). Teste de fonte na Task 2.
4. Trocar de escopo zera a seleção do cmdk (o `input` sintético que o catálogo dispara ao trocar de página). Teste de fonte na Task 2.
5. Fechar e reabrir a paleta volta à raiz (o conteúdo desmonta). Já é o comportamento; o teste de fonte confere que `CommandPages` envolve o corpo.

---

### Task 1: O casamento dos escopos

**Files:**
- Create: `src/lib/app-search-scopes.ts`
- Test: `src/lib/app-search-scopes.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type EscopoId = "telas" | "acoes" | "transacoes" | "cartoes" | "categorias" | "parcelas" | "assinaturas" | "contas" | "membros" | "carteiras"
  export type Escopo = { id: EscopoId; comando: string; rotulo: string; aliases: string[] }
  /** Na ordem da decisão 1. */
  export const ESCOPOS: readonly Escopo[]
  /** `null` quando o termo não é comando (não começa com "/"). Senão, o que vem depois da barra até o primeiro espaço (`parcial`), se houve espaço (`fechado`), e o resto depois do espaço (`resto`, aparado à esquerda). */
  export function lerComando(termo: string): { parcial: string; fechado: boolean; resto: string } | null
  /** Os escopos que casam `parcial` (sem acento, sem caixa): prefixo do comando ou de um alias; `""` devolve todos. Na ordem de ESCOPOS. */
  export function casarEscopos(parcial: string): Escopo[]
  /** O escopo cujo comando ou alias é exatamente `parcial` (sem acento, sem caixa), ou `null`. */
  export function escopoExato(parcial: string): Escopo | null
  ```

- [ ] **Step 1: Write the failing tests**

```ts
expect(lerComando("mercado")).toBeNull()
expect(lerComando("15/03")).toBeNull()
expect(lerComando(" /membros")).toBeNull()
expect(lerComando("/")).toEqual({ parcial: "", fechado: false, resto: "" })
expect(lerComando("/tra")).toEqual({ parcial: "tra", fechado: false, resto: "" })
expect(lerComando("/membros ")).toEqual({ parcial: "membros", fechado: true, resto: "" })
expect(lerComando("/membros  ana souza")).toEqual({ parcial: "membros", fechado: true, resto: "ana souza" })
expect(casarEscopos("").map((e) => e.id)).toEqual(["telas", "acoes", "transacoes", "cartoes", "categorias", "parcelas", "assinaturas", "contas", "membros", "carteiras"])
expect(casarEscopos("tra").map((e) => e.id)).toEqual(["transacoes"])
expect(casarEscopos("TRANSAÇ").map((e) => e.id)).toEqual(["transacoes"])
expect(casarEscopos("gas").map((e) => e.id)).toEqual(["transacoes"])
expect(casarEscopos("ca").map((e) => e.id)).toEqual(["cartoes", "categorias", "carteiras"])
expect(casarEscopos("xyz")).toEqual([])
expect(escopoExato("transações")?.id).toBe("transacoes")
expect(escopoExato("boletos")?.id).toBe("contas")
expect(escopoExato("tran")).toBeNull()
expect(ESCOPOS.map((e) => e.comando)).toContain("/transacoes")
```

- [ ] **Step 2:** `npx vitest run src/lib/app-search-scopes.test.ts` → FAIL (módulo não existe).
- [ ] **Step 3: Implement** em `src/lib/app-search-scopes.ts`. Para tirar acento e caixa, reuse `normalizeSearchText` de `src/lib/command-filter.ts` se ele for exportado; senão, `normalize("NFD")` + remover `̀-ͯ` (escrito com escapes) + `toLowerCase()`.
- [ ] **Step 4:** o mesmo comando → PASS.
- [ ] **Step 5: Commit** `feat(busca): os escopos da paleta e o casamento do /comando`.

### Task 2: A paleta com escopo

**Files:**
- Modify: `src/components/layout/app-command-palette.tsx`
- Modify: `src/lib/queries/use-transactions-search.ts` (o limite vira parâmetro)
- Modify: `src/components/layout/app-command-palette.test.ts`, `src/lib/queries/transactions-search.test.ts`
- Modify: `docs/JORNADAS.md` (linha "Busca global (⌘K)"), `docs/atlas/template.html` (item "Busca."), `AGENTS.md` (bullet "Busca", a frase da paleta do app); gerar `docs/atlas/atlas-jornadas.html` com `python3 docs/atlas/build.py`

**Interfaces:**
- Consumes: Task 1 (`ESCOPOS`, `lerComando`, `casarEscopos`, `escopoExato`, `EscopoId`); `CommandPages`, `CommandPage`, `useCommandPages` (`current`, `push`, `stack`, `armed`) de `@/components/ui/command`; o `CommandInput` já desenha o escopo a partir da pilha e limpa o texto ao trocar de página (não passe `leading`).
- Produces: `useTransactionsSearchQuery({ …, limite?: number })` — padrão 8; a chave da consulta inclui o limite.

- [ ] **Step 1: Write the failing tests.**
  `transactions-search.test.ts`: a chave com `limite: 20` difere da com 8 (`transactionsSearchKeys.list` ganha o limite no fim, e a invalidação por prefixo `[transactionsSearch, workspaceId]` continua valendo).
  `app-command-palette.test.ts` (fonte sem comentários):
  ```ts
  expect(fonte).toContain("<CommandPages>")
  expect(fonte).toContain("lerComando(")
  expect(fonte).toContain("casarEscopos(")
  expect(fonte).toContain("escopoExato(")
  expect(fonte).toContain('heading="Buscar em"')
  expect(fonte).toContain('"Buscar, ou / para escolher onde…"')
  expect(fonte).toContain("Apague o escopo com Backspace para buscar em tudo.")
  expect(fonte).toContain("Digite uma descrição, um valor ou uma data.")
  expect(fonte).toContain("sair do escopo")
  expect(fonte).toContain("escolher onde")
  // dentro do escopo, "/" é texto: o comando só é lido na raiz
  expect(fonte).toMatch(/escopo\s*\?\s*null\s*:\s*lerComando\(/)
  ```
- [ ] **Step 2:** `npx vitest run src/components/layout/app-command-palette.test.ts src/lib/queries/transactions-search.test.ts` → FAIL.
- [ ] **Step 3: Implement.**
  - `AppCommandPalette` envolve `PaletteBody` em `<CommandPages>`. `escopo = current as EscopoId | undefined`.
  - Na raiz: `comando = escopo ? null : lerComando(query)`. Com `comando`, renderize só o grupo **"Buscar em"** (`casarEscopos(comando.parcial)`; linha: ícone do grupo, rótulo com `CommandHighlight` não — o texto é o comando, então `CommandItemTitle` simples; `CommandItemMeta`/`CommandItemDescription` com o comando). `onSelect` = entrar. Sem casamento: o vazio `Nenhum lugar com "/<parcial>".`. Com `comando` nenhuma consulta de transações liga (o termo passado ao parse é "" na raiz com comando).
  - `entrar(e: Escopo, resto = "")`: `push({ id: e.id, label: e.rotulo, icon: <Ícone /> })`, e depois põe `resto` no campo (o `CommandInput` limpa o texto num efeito ao mudar a profundidade; aplique o `resto` num efeito seu que roda depois, por exemplo guardando o `resto` num ref e aplicando-o num `useEffect` dependente de `current`). Dispare o `input` sintético no `<input>` ao trocar de escopo, como `ds-search.tsx` faz, para o cmdk voltar ao ocioso.
  - Atalho: num efeito sobre `query` na raiz, se `comando?.fechado` e `escopoExato(comando.parcial)`, entre nele com `comando.resto`.
  - No escopo: só o grupo dele; os grupos locais usam limite **50** (campo vazio = os 50 primeiros da fonte; com texto = `ranquear(…, 50)`); Transações usa `limite: 20`; campo vazio em Transações mostra a dica (uma linha `role="status"` como a de erro, não selecionável). Sem Recentes. Vazio: `Nada em <rótulo> para "<termo>".` + "Apague o escopo com Backspace para buscar em tudo."
  - Placeholders da decisão 5; `aria-label` do campo: "Buscar no app" na raiz, "Buscar em <rótulo>" no escopo.
  - Legenda da decisão 7 (`<Kbd>/</Kbd> escolher onde` na raiz; `<Kbd>⌫</Kbd> sair do escopo` no escopo).
  - Ícone de cada escopo: o mesmo `16/solid` que o grupo já usa (telas: `Squares2X2Icon`; ações: `PlusIcon`; os demais, o ícone das linhas do grupo).
  - Docs: uma frase em cada um dos três lugares — "Digitar `/` escolhe onde buscar (`/transacoes`, `/membros`…): o nome entra no campo como escopo, só aquele grupo aparece (até 50 linhas; 20 transações), e dois Backspaces com o campo vazio voltam à busca em tudo." Rode `python3 docs/atlas/build.py`. Nada de `*` dentro de `var()`/`[...]` nos docs.
- [ ] **Step 4:** os dois testes → PASS; `npx tsc --noEmit && npm run lint && npm run test:unit` limpos.
- [ ] **Step 5: Commit** `feat(busca): /comando escolhe onde a paleta busca`.
