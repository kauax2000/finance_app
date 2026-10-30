# Revisão do lançamento — edições animadas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Todo abrir e fechar de edição no painel de revisão do lançamento inteligente (Descrição, Valor, Categoria, Forma, Data, Parcelas) e toda peça que entra ou sai do painel ganham movimento orgânico, no jeito do iOS.

**Architecture:** Tudo no componente `Revisao` de `src/components/transactions/lancamento-inteligente.tsx`, com peças que já existem: `useAlturaAnimada` (`src/hooks/use-altura-animada.ts`, a altura que anda na mola do `Dialog`), `AnimatePresence`/`motion` de `motion/react`, e o surgir do desfoque no lugar da paleta (`@keyframes menu-content-in`: opacidade 0 → 1 até 45%, `blur(10px)` → 0). Nada em `src/components/ui/`, `globals.css` nem `designsystem/`.

**Tech Stack:** Next 16, React 19, `motion` (`motion/react`), Vitest com testes de fonte (`lerFonte`/`semComentarios` de `@/test/fonte`).

**Spec:** este documento. O dono pediu "animações bem bonitas e orgânicas … como se fosse um aplicativo da Apple … abrir e fechar as edições de descrição, categorias etc., todas" e pulou as perguntas; o desenho abaixo é decisão do executor (Claude). Memória do dono: animação orgânica é a mola e o desfoque no lugar do app (`menu-morph`, viagem líquida), **nunca escala ou esmaecer simples**.

## O desenho (decisões do executor)

1. **O painel cresce e encolhe na mola.** Abrir um editor deixa a linha mais alta (50 → ~84); fechar a encolhe; a linha Parcelas entra e sai com o tipo; a miniatura do recibo e o motivo do Aprovar entram e saem. A altura do painel nunca pula: um invólucro em volta do conteúdo do `Form` usa `useAlturaAnimada`, e o vidro (`lancamento-fundo`, `absolute inset-0` da placa) acompanha sozinho.
2. **A linha vira o editor no lugar (e volta).** Trocar linha ↔ editor é uma troca com presença: quem sai **esmaece no desfoque** em `SAIDA` (150ms; opacidade 1 → 0, `blur(0)` → `blur(6px)`); quem entra **surge do desfoque** na `MOLA` (opacidade 0 → 1, `blur(10px)` → 0, `y` 4 → 0). Dentro do editor as peças chegam em escada de 40ms: o rótulo, o campo, o "ok". Vale para Descrição, Valor e Data (campo + "ok") e para Categoria, Forma e Parcelas (o gatilho surge, e o seletor brota dele com o `menu-morph` que ele já tem). Ao fechar, a linha volta surgindo do desfoque com o valor novo — é o "pousar" do valor.
3. **O que entra e sai do painel faz o mesmo gesto.** Miniatura do recibo, linha Parcelas, legenda da parcelada, motivo do Aprovar ("Escolha a categoria", "Enter para atualizar") e os selos "Confira"/"IA" entram surgindo do desfoque e saem esmaecendo no desfoque, sob `AnimatePresence`.
4. **Movimento reduzido:** sem `blur` nem `y`; só a opacidade, e a altura troca na hora (o `useAlturaAnimada` já respeita).
5. **Não muda:** o gesto de abrir/fechar o painel (`data-revela`, a cascata, o vidro), o piscar de leitura nova (`valoresAntes`), os seletores do `ui/`.

## Global Constraints

- Nada em `src/components/ui/`, `src/app/globals.css` nem `src/app/designsystem/`.
- Constantes de movimento de `@/lib/spring` (`MOLA`, `SAIDA`); nenhuma duração ou curva nova escrita solta, exceto a escada de 40ms do editor (`ESCADA_DO_EDITOR = 0.04`) e os valores de desfoque (`blur(10px)` de entrada, `blur(6px)` de saída) e o `y` de 4px, que este plano fixa.
- Nada de `scale` como movimento principal; nada de `animate-[…]`.
- `data-revela` continua em cada peça que já o tem (o gesto de abertura as procura).
- Movimento reduzido via `useReducedMotion` (já importado no arquivo).
- Banco de produção no dev: nada se aprova em teste manual.
- Verificação de cada task: `npx tsc --noEmit && npm run lint && npx vitest run src/components/transactions src/lib/lancamento-gesto.test.ts` e `npm run ds:audit -- src/components/transactions/lancamento-inteligente.tsx` sem achado novo.
- Commits em português terminando com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; nunca `CLAUDE.md` nem `.superpowers/`; depois do código, `graphify update .` e commit separado só com `graphify-out/graph.json`.

## Review Focus

1. Abrir um editor e, antes da saída terminar, tocar outra linha: nenhuma linha some, nenhuma fica duplicada, e o painel não pula de altura.
2. O gesto de abertura do painel (o campo virando placa) não pode ser afetado: o invólucro com `useAlturaAnimada` não pode animar durante o gesto, porque o vidro mede a caixa final no começo dele.
3. Escolher num seletor que abre direto (Categoria, Forma, Parcelas): o seletor fecha, o editor sai, a linha volta com o valor novo — o foco termina na linha (`fechar()`), como hoje.
4. Um `Badge` ou peça que sai com `AnimatePresence` não deixa o espaço dele pendurado depois da saída (o `popLayout` ou a altura animada resolvem; nada fica com altura fantasma).
5. Movimento reduzido: nenhuma propriedade `filter` é animada.

---

### Task 1: O painel anda na mola

**Files:**
- Modify: `src/components/transactions/lancamento-inteligente.tsx` (o corpo do `Form` dentro de `Revisao`)
- Test: `src/components/transactions/lancamento-inteligente.test.ts`

**Interfaces:**
- Produces: o invólucro `data-slot="lancamento-revisao-corpo"` com o ref de `useAlturaAnimada<HTMLDivElement>()`; as Tasks 2 e 3 põem as presenças dentro dele.

- [ ] **Step 1: Teste de fonte que falha** — `it("o corpo da revisão anda na mola", …)`: `expect(fonte).toContain("useAlturaAnimada<HTMLDivElement>()")`; `expect(fonte).toMatch(/data-slot="lancamento-revisao-corpo"/)`.
- [ ] **Step 2:** rodar → FAIL.
- [ ] **Step 3:** Embrulhar o conteúdo do `Form` (do indicador do tipo até o `ImpactoDaParcela`) num `<div data-slot="lancamento-revisao-corpo" ref={…} className="flex flex-col gap-…">` que herda o `gap` que o `Form` dava. Garanta o Review Focus 2: o hook só anima mudanças depois de montado; confirme lendo o gesto (`abrir()` mede a placa uma vez) que nada muda de altura durante a abertura — se mudar (a cascata `data-revela` não mexe em altura), anote no relatório.
- [ ] **Step 4:** Verificação dos Global Constraints → PASS.
- [ ] **Step 5:** Commit `feat(lancamento): o painel de revisão muda de altura na mola` + grafo.

### Task 2: A linha vira o editor, e volta

**Files:**
- Modify: `src/components/transactions/lancamento-inteligente.tsx` (`emEdicao`, o valor em destaque, o `.map` das linhas)
- Test: `src/components/transactions/lancamento-inteligente.test.ts`

**Interfaces:**
- Consumes: o invólucro da Task 1.
- Produces: no módulo, `const ENTRA` e `const SAI` (os alvos de `motion` para surgir e esmaecer no desfoque, já com a versão reduzida decidida por quem usa) e `const ESCADA_DO_EDITOR = 0.04`; a Task 3 reusa `ENTRA`/`SAI`.

- [ ] **Step 1: Teste de fonte que falha** — `it("a linha e o editor trocam no desfoque, na mola", …)`:
  - `expect(fonte).toContain("<AnimatePresence")` e `expect(fonte).toContain("const ESCADA_DO_EDITOR = 0.04")`
  - `expect(fonte).toMatch(/filter: "blur\(10px\)"/)` e `expect(fonte).toMatch(/filter: "blur\(6px\)"/)`
  - `expect(fonte).toMatch(/\.\.\.MOLA/)` e `expect(fonte).toMatch(/SAIDA/)` usados nos alvos
  - `expect(fonte).not.toMatch(/scale:/)` dentro de `Revisao` (basta no arquivo, fora do gesto: se o gesto já usa `scale`, restrinja o teste ao trecho de `function Revisao` com `fonte.slice(fonte.indexOf("function Revisao"))`)
- [ ] **Step 2:** rodar → FAIL.
- [ ] **Step 3:** Para cada linha, o valor em destaque e o editor: uma presença por campo (`AnimatePresence mode="popLayout" initial={false}`), com a chave `campo-linha` / `campo-editor`; o filho é `motion.div` com `initial`/`animate`/`exit` dos alvos `ENTRA`/`SAI`. O editor tem `staggerChildren: ESCADA_DO_EDITOR` (rótulo, campo, "ok" como `motion` filhos com `variants`). Os ids `lancamento-${campo}` e o `data-revela` continuam nos mesmos nós de hoje (o piscar e o gesto os procuram). O `editorRef`/foco e o `fechar()` não mudam de comportamento. Reduzido: `ENTRA`/`SAI` sem `filter` nem `y`.
- [ ] **Step 4:** Verificação → PASS.
- [ ] **Step 5:** Commit `feat(lancamento): a linha vira o editor no desfoque, na mola` + grafo.

### Task 3: O que entra e sai do painel

**Files:**
- Modify: `src/components/transactions/lancamento-inteligente.tsx` (miniatura do recibo, linha Parcelas, legenda da parcelada, motivo do rodapé, selos de `selo()`)
- Test: `src/components/transactions/lancamento-inteligente.test.ts`

**Interfaces:**
- Consumes: `ENTRA`, `SAI` da Task 2; o invólucro da Task 1.

- [ ] **Step 1: Teste de fonte que falha** — `it("o que aparece no painel surge do desfoque e sai nele", …)`: o arquivo tem pelo menos 4 `<AnimatePresence` a mais que antes da task (conte com `match(/<AnimatePresence/g).length` e fixe o número que a implementação der, ≥ 5 no total); `expect(fonte).toMatch(/<AnimatePresence[\s\S]{0,300}MiniaturaDoRecibo/)`; `expect(fonte).toMatch(/<AnimatePresence[\s\S]{0,300}lancamento-motivo/)`.
- [ ] **Step 2:** rodar → FAIL.
- [ ] **Step 3:** Embrulhar cada peça condicional numa presença com `ENTRA`/`SAI`. A linha Parcelas entra e sai pela presença das linhas (a lista é um `.map`; o filtro `tipo === "parcelada"` decide quem existe). O motivo do rodapé fica fora do invólucro (rodapé), então ele usa `mode="popLayout"` para não deixar altura fantasma. `aria-describedby` do Aprovar só aponta para o motivo enquanto ele existe.
- [ ] **Step 4:** Verificação → PASS.
- [ ] **Step 5:** Commit `feat(lancamento): as peças da revisão entram e saem no desfoque` + grafo.
