# Resumo do mês num cartão — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** No telefone, o detalhe da categoria mostra a comparação num chip no topo e todo o resumo do mês (barra, limite, fechamento, peso) dentro de um `Card`.

**Architecture:** Só arquivos da tela, compondo peças que já existem (`Card`, `Progress` com `header`, `ProgressHeader`/`ProgressLabel`, `Badge`). As contas de texto ficam em `regua-do-mes-contas.ts` e `resumo-do-mes.tsx`; o desktop (`FaixaDoMes`, `ResumoDoMes destaque`) não muda.

**Tech Stack:** Next 16, React 19, Tailwind v4, Vitest (testes de fonte e `renderToStaticMarkup`).

**Spec:** `docs/superpowers/specs/2026-11-27-resumo-do-mes-num-cartao-design.md`

## Global Constraints

- Nada em `src/components/ui/`, `src/app/globals.css` nem `src/app/designsystem/` muda.
- O desktop não muda: `FaixaDoMes`, `ReguaDoMes` e o ramo `destaque` do `ResumoDoMes` ficam como estão, e `fraseDaComparacao(...).resto` mantém o texto de hoje ("que no mesmo dia de outubro (R$ 3.734)").
- Nenhuma informação que a tela mostra hoje some do telefone.
- Textos em português, como no spec: "gasto em <mês>"/"Gasto em <mês>" como hoje, "de R$ <total>", "dia N de M", "Deve fechar em", "Com o previsto, passa", "Ainda vem", "do gasto da carteira"/"da receita da carteira".
- Só tokens e degraus do design system; raio pelo `Card` (`rounded-surface`), nada de `rounded-[…]`.
- Commit só dos arquivos da tarefa (`git add <caminhos>`). Nunca fazer stage de `CLAUDE.md`, `AGENTS.md`, `graphify-out/graph.json`, `docs/design/painel/*` nem `src/components/layout/*` (há mudanças de outra tarefa não commitadas ali). Sem `git stash`. Mensagem terminando com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Testes de texto normalizam o espaço não separável do `Intl` (`.replace(/ /g, " ")`).

## Review Focus

- Categoria sem limite com total da carteira zero (`pesoNoTotal` nulo): a barra não existe; o cartão mostra só o que houver (fechamento) e some inteiro se não houver nada — teste na Task 2.
- Mês fechado: nada de "dia N de M" nem "Deve fechar" — teste na Task 2.
- Receita: "da receita da carteira", e o limite não vale (só despesa tem limite) — teste na Task 2.
- Passou do limite: a frase forte vira "Passou R$ X" e o resto " do limite de R$ Y" — teste na Task 2.
- Comparação nula (primeiro mês): sem chip e sem " · " no topo — teste na Task 1.

---

### Task 1: A comparação vira chip no topo

**Files:**
- Modify: `src/components/categories/detail/regua-do-mes-contas.ts` (`fraseDaComparacao`)
- Modify: `src/components/categories/detail/topo-da-categoria.tsx`
- Test: `src/components/categories/detail/topo-da-categoria.test.ts`

**Interfaces:**
- Produces: `fraseDaComparacao` devolve, além de `seta`, `percentual`, `bom` e `resto` (inalterado), dois campos novos: `texto: string` ("que no mesmo dia de outubro" ou "que em outubro", sem o valor) e `anterior: string` (`reaisInteiros(anterior)`, "R$ 3.734").

- [ ] **Step 1: Atualizar os testes**

Em `topo-da-categoria.test.ts`, o primeiro caso passa a esperar:

```ts
expect(t).toContain("Gasto em novembro")
expect(t).toContain("↓ 18% que no mesmo dia de outubro · R$ 3.734")
expect(t).not.toContain("(R$ 3.734)")
```

Novo caso, na mesma `describe("TopoDaCategoria")`:

```ts
it("a comparação mora num Badge", () => {
    const fonte = semComentarios(lerFonte("src/components/categories/detail/topo-da-categoria.tsx"))
    expect(fonte).toContain("<Badge")
})
```

O caso "sem comparação" continua (sem " · "), e ganha `expect(renderToStaticMarkup(h(TopoDaCategoria, {...})) ).not.toContain('data-slot="badge"')`.

Em `regua-do-mes-contas.test.ts` (crie se não existir; se existir, acrescente sem apagar), com `comparacao = { mesAnterior: "2026-10", anterior: 3734, atual: 4114.39, variacao: -0.18, mesmoPonto: true }`:

```ts
const f = fraseDaComparacao({ tipo: "expense", comparacao })!
expect(f.texto).toBe("que no mesmo dia de outubro")
expect(f.anterior.replace(/ /g, " ")).toBe("R$ 3.734")
expect(f.resto.replace(/ /g, " ")).toBe("que no mesmo dia de outubro (R$ 3.734)")
expect(fraseDaComparacao({ tipo: "expense", comparacao: { ...comparacao, mesmoPonto: false } })!.texto).toBe("que em outubro")
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/components/categories/detail/topo-da-categoria.test.ts src/components/categories/detail/regua-do-mes-contas.test.ts`
Expected: FAIL (sem `texto`/`anterior`, sem Badge, texto com parênteses).

- [ ] **Step 3: Implementar**

`fraseDaComparacao`: acrescentar `texto` e `anterior`; `resto` passa a ser `` `${texto} (${anterior})` `` (mesmo texto de hoje).

`TopoDaCategoria`: `MoneyDisplay` como hoje; embaixo `Caption` com "Gasto em <mês>"/"Recebido em <mês>" sozinha; e, se há frase, `<Badge variant="soft" tone="neutral" size="md">` com a seta e o percentual num `span` no tom de hoje (`text-success` / `text-destructive`) e, em `text-muted-foreground`, `` ` ${frase.texto} · ${frase.anterior}` ``. O pai já é a coluna centrada do `PageHeaderHero`; nenhum `gap` ou margem à mão no `Badge`.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/components/categories/detail && npx tsc --noEmit`
Expected: PASS, 0 erros.

- [ ] **Step 5: Commit**

```bash
git add src/components/categories/detail/regua-do-mes-contas.ts src/components/categories/detail/topo-da-categoria.tsx src/components/categories/detail/topo-da-categoria.test.ts src/components/categories/detail/regua-do-mes-contas.test.ts
git commit -m "feat(categoria): no telefone a comparação com o mês anterior vira chip no topo"
```

---

### Task 2: O resumo do telefone num cartão

**Files:**
- Modify: `src/components/categories/detail/resumo-do-mes.tsx` (`frasesDoLimite`, `BarraDoMes`, ramo do telefone do `ResumoDoMes`)
- Modify: `src/components/categories/detail/regua-do-mes-contas.ts` (novo `diaDoMes`)
- Modify: `src/app/(app)/categories/[categoryId]/page-client.tsx` (passa `hojeYmd` ao `ResumoDoMes`)
- Create: `src/components/categories/detail/resumo-do-mes-cartao.test.ts`
- Modify (se quebrar): `src/components/categories/detail/topo-da-categoria.test.ts` (caso "o resumo do telefone…")

**Interfaces:**
- Produces:
  - `diaDoMes(yearMonth: string, hojeYmd: string): string` → `"dia 27 de 30"`.
  - `frasesDoLimite(...)` devolve também `forte: string` e `resto: string`, com `forte + resto === principal` ("Sobra R$ 320,00" + " de R$ 1.500,00"; "Passou R$ 40,00" + " do limite de R$ 1.500,00"). `principal` e `aviso` não mudam (o desktop usa).
  - `BarraDoMes` aceita `header?: React.ReactNode`, repassado ao `Progress` nos dois ramos.
  - `ResumoDoMes` ganha a prop obrigatória `hojeYmd: string`. Atualize todo chamador (`grep -rn "<ResumoDoMes" src`).

- [ ] **Step 1: Escrever o teste**

`resumo-do-mes-cartao.test.ts`, renderizando `ResumoDoMes` (sem `destaque`) com `renderToStaticMarkup`, tags tiradas e ` ` normalizado. Base: `{ tipo: "expense", yearMonth: "2026-11", hojeYmd: "2026-11-27", aberto: true }`.

```ts
it("sem limite: o peso dá nome à barra, o total ao lado, e o fechamento embaixo", () => {
    const t = texto({ ...base, lancado: 4114.39, previsto: 0, limite: null, pesoNoTotal: 0.26 })
    expect(t).toContain("26% do gasto da carteira")
    expect(t).toContain("de R$ 15.825")
    expect(t).toContain("Deve fechar em R$ 4.114")
    expect(t).toContain("nada mais previsto até o dia 30")
    expect(t).not.toContain("dia 27 de 30")
})
it("com limite: a frase do limite em cima, o dia, o fechamento e o peso", () => {
    const t = texto({ ...base, lancado: 1180, previsto: 260, limite: 1500, pesoNoTotal: 0.09 })
    expect(t).toContain("Sobra R$ 320,00 de R$ 1.500,00")
    expect(t).toContain("dia 27 de 30")
    expect(t).toContain("Deve fechar em R$ 1.440")
    expect(t).toContain("cabe no limite")
    expect(t).toContain("9% do gasto da carteira")
})
it("o previsto que passa do limite avisa", () => {
    const t = texto({ ...base, lancado: 1380, previsto: 260, limite: 1500, pesoNoTotal: 0.1 })
    expect(t).toContain("Com o previsto, passa R$ 140,00")
})
it("passou do limite: a frase forte é Passou", () => {
    expect(texto({ ...base, lancado: 1540, previsto: 0, limite: 1500, pesoNoTotal: 0.1 })).toContain("Passou R$ 40,00 do limite de R$ 1.500,00")
})
it("mês fechado: sem dia e sem Deve fechar", () => {
    const t = texto({ ...base, yearMonth: "2026-10", aberto: false, lancado: 3902.1, previsto: 0, limite: 1500, pesoNoTotal: 0.24 })
    expect(t).not.toContain("Deve fechar")
    expect(t).not.toMatch(/dia \d+ de \d+/)
})
it("receita fala da receita da carteira", () => {
    expect(texto({ ...base, tipo: "income", lancado: 500, previsto: 0, limite: null, pesoNoTotal: 0.1 })).toContain("10% da receita da carteira")
})
it("sem barra e sem fechamento, não desenha nada", () => {
    expect(renderToStaticMarkup(h(ResumoDoMes, { ...base, aberto: false, yearMonth: "2026-10", lancado: 0, previsto: 0, limite: null, pesoNoTotal: null }))).toBe("")
})
it("o telefone monta um Card com o header no Progress", () => {
    const fonte = semComentarios(lerFonte("src/components/categories/detail/resumo-do-mes.tsx"))
    const telefone = fonte.slice(fonte.lastIndexOf("return ("))
    expect(telefone).toContain("<Card")
    expect(fonte).toContain("<ProgressHeader")
})
```

E em `regua-do-mes-contas.test.ts`: `expect(diaDoMes("2026-11", "2026-11-27")).toBe("dia 27 de 30")` e `expect(diaDoMes("2026-02", "2026-02-03")).toBe("dia 3 de 28")`.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/components/categories/detail/resumo-do-mes-cartao.test.ts src/components/categories/detail/regua-do-mes-contas.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

Ramo do telefone do `ResumoDoMes`, dentro do `PageSection aria-label` de hoje, um `<Card>` (padrão: `outline`, `padding="md"`) com, nesta ordem:
1. `BarraDoMes` com `header`:
   - com limite: `<ProgressHeader>` com, à esquerda, `<span><span className="font-semibold">{forte}</span><span className="text-muted-foreground">{resto}</span></span>` e, à direita e só no mês aberto, `<span className="text-muted-foreground">{diaDoMes(yearMonth, hojeYmd)}</span>`;
   - sem limite: à esquerda `<span className="font-semibold">{percentBR(peso, { maximumFractionDigits: 0 })}</span>` + `" do gasto da carteira"`/`" da receita da carteira"` em `text-muted-foreground`; à direita `` `de ${reaisInteiros(lancado / pesoNoTotal)}` `` em `text-muted-foreground`.
   - Não use `ProgressLabel` (ele tomaria o nome acessível; o `aria-label` da `BarraDoMes` fica).
2. `LinhaDoFechamento` no mês aberto (como hoje).
3. Uma linha `Muted` com as partes que existirem, juntas por " · ": o aviso do limite (num `span className="text-warning"`), "Ainda vem R$ X" (só sem fechamento, como hoje) e, **só com limite**, o peso ("9% do gasto da carteira").

O `Badge` do peso e o `P` da frase principal saem (o conteúdo foi para o header e a linha). Se não há barra, nem fechamento, nem linha, `ResumoDoMes` devolve `null`. O `gap` entre as peças é o do próprio `Card`/`Progress` (o `Progress` com `header` já empilha); se precisar, um `grid gap-3` no conteúdo do cartão, como hoje.

`page-client.tsx`: passar `hojeYmd={hojeYmd}` (já existe na linha ~473) ao `ResumoDoMes`.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/components/categories src/app && npx tsc --noEmit && npx eslint src/components/categories/detail "src/app/(app)/categories/[categoryId]/page-client.tsx" && npm run ds:audit -- src/components/categories/detail/resumo-do-mes.tsx`
Expected: PASS, 0 erros de tipo, lint limpo, nenhuma violação nova no auditor. Se o caso "o resumo do telefone…" de `topo-da-categoria.test.ts` quebrar por nome de variável, ajuste a asserção para a forma nova sem afrouxar o que ela tranca (sem título, sem `MoneyDisplay`, com fechamento e barra).

- [ ] **Step 5: Commit**

```bash
git add src/components/categories/detail/resumo-do-mes.tsx src/components/categories/detail/regua-do-mes-contas.ts src/components/categories/detail/regua-do-mes-contas.test.ts src/components/categories/detail/resumo-do-mes-cartao.test.ts src/components/categories/detail/topo-da-categoria.test.ts "src/app/(app)/categories/[categoryId]/page-client.tsx"
git commit -m "feat(categoria): no telefone o resumo do mês mora num cartão, com o que a barra mede em cima"
```

---

### Task 3: O esqueleto espera com o cartão

**Files:**
- Modify: `src/components/categories/detail/category-detail-skeleton.tsx` (bloco do telefone, linhas ~80–103)
- Test: `src/components/categories/detail/category-detail-skeleton.test.ts`

**Interfaces:**
- Consumes: a forma da Task 1 (topo: ladrilho, nome, valor, legenda, chip) e da Task 2 (cartão: linha de cima, barra, fechamento).

- [ ] **Step 1: Acrescentar o teste**

```ts
it("no telefone, o topo espera o chip e o resumo espera num cartão", () => {
    expect(fonte).toMatch(/<Skeleton shape="pill"[^>]*md:hidden/) // o chip da comparação, no topo
    expect(fonte).toMatch(/<Card aria-hidden[^>]*md:hidden/)      // o cartão do resumo, só no telefone
})
```

Os casos de hoje continuam passando.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/components/categories/detail/category-detail-skeleton.test.ts`
Expected: FAIL no caso novo.

- [ ] **Step 3: Implementar**

No bloco do telefone: o topo centrado ganha, depois da legenda, um `Skeleton shape="pill"` (h-6, ~w-60) do chip; o "Deve fechar" em duas linhas e o `pill` do peso saem dali e viram um `<Card aria-hidden className="… md:hidden">` com uma linha de dois textos (`justify-between`), a barra (`Skeleton` `h-2 rounded-full` ou a forma que o arquivo já usa para barra) e uma linha de texto. O desktop (`max-md:hidden`) não muda. Meça a altura do cartão real a 375px (Task 2) e use a mesma no osso.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/components/categories/detail && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/categories/detail/category-detail-skeleton.tsx src/components/categories/detail/category-detail-skeleton.test.ts
git commit -m "fix(esqueletos): o detalhe da categoria no telefone espera o chip e o cartão do resumo"
```
