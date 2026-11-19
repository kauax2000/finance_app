# Transição de subpágina no iPhone — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** a subpágina do telefone só anima quando a tela nova já está montada, e anima na curva do push do iOS.

**Architecture:** `TransicaoDeSubpagina` (View Transitions API) passa a esperar em duas fases — primeiro a rota mudar (teto 4s, senão `skipTransition()`), depois o sossego de esqueleto (teto 1,2s contado da troca). O CSS do gesto troca `--duration-slow`/`--ease-out` por `--duration-spring`/`--ease-emphasized` e escurece a tela de baixo.

**Tech Stack:** Next.js (App Router), React, CSS View Transitions, Vitest (testes de leitura de fonte, ambiente `node`).

**Spec:** `docs/superpowers/specs/2026-11-19-transicao-de-subpagina-no-iphone-design.md`

## Global Constraints

- Nenhum token novo em `globals.css`; só `--duration-spring` e `--ease-emphasized`, que já existem.
- `view-transition-name` continua só sob `html[data-subpagina]` (teste existente).
- Só o telefone, sem movimento reduzido, fora de diálogo — comportamento atual intocado.
- `globals.css` está em `permissions.ask`: a edição pede confirmação do dono (autorizada pelo design aprovado).
- Rodar `npx tsc --noEmit && npm run lint && npm run test:unit` antes de cada commit; depois de mexer em código, `graphify update .`.

## Review Focus

1. Rota que nunca muda (navegação falha ou dev compilando > 4s): a tela não pode ficar congelada; a transição é pulada e a troca acontece seca quando a rota chegar.
2. Rota muda mas a tela fica em esqueleto para sempre: o gesto roda em até 1,2s depois da troca, não espera mais.
3. Toque duplo durante a espera: o segundo clique continua ignorado (`if (raiz.dataset.subpagina) return`).
4. Voltar (`direcao === "volta"`): mesma curva e o escurecimento invertido (a de baixo clareia ao voltar).
5. Rolagem da Você no fundo: o `--subpagina-desvio` segue medido depois da espera completa.

---

### Task 1: espera em duas fases

**Files:**
- Modify: `src/components/layout/transicao-de-subpagina.tsx`
- Test: `src/components/layout/transicao-de-subpagina.test.ts`

**Interfaces:**
- Produces: `telaPronta(rotaDeAntes: string): Promise<boolean>` — `true` quando a rota mudou (e o sossego passou ou o teto de 1,2s após a troca venceu); `false` quando a rota não mudou em `LIMITE_DA_ROTA_MS`.
- Constantes: `LIMITE_DA_ROTA_MS = 4000`, `LIMITE_DA_ESPERA_MS = 1200` (agora contado a partir da troca de rota), `SOSSEGO_MS = 80` (igual).
- `DocumentoComTransicao.startViewTransition` passa a devolver `{ finished: Promise<void>; skipTransition: () => void }`.

- [ ] **Step 1: Atualizar o teste "o gesto espera a tela nova"** e somar dois:

```ts
it("o gesto espera a tela nova: a navegação corre dentro da promessa, e há um teto", () => {
    expect(T).toMatch(/startViewTransition\(async \(\) => \{\s+router\.push\([\s\S]+await telaPronta\(rotaDeAntes\)/)
    expect(T).toContain("const LIMITE_DA_ESPERA_MS = 1200")
    expect(T).toContain(`'[aria-busy="true"], [data-slot="skeleton"]'`)
})

// No simulador (19/11/2026) o teto vencia com a rota velha: o gesto andava a Você
// sobre ela mesma, e a tela nova chegava num corte seco.
it("nunca anima sem a rota nova: o teto de 1,2s só conta depois da troca, e a rota tem o próprio teto", () => {
    expect(T).toContain("const LIMITE_DA_ROTA_MS = 4000")
    expect(T).toMatch(/function telaPronta\(rotaDeAntes: string\): Promise<boolean>/)
    expect(T).toMatch(/if \(!\(await telaPronta\(rotaDeAntes\)\)\) transicao\.skipTransition\(\)/)
})

it("o teto do esqueleto nasce na troca de rota, não no clique", () => {
    // o temporizador de 1,2s é armado dentro do ramo em que a rota já mudou
    expect(T).toMatch(/location\.pathname !== rotaDeAntes[\s\S]{0,300}setTimeout\([^,]+, LIMITE_DA_ESPERA_MS\)/)
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/components/layout/transicao-de-subpagina.test.ts`
Expected: FAIL nos dois testes novos (`LIMITE_DA_ROTA_MS` ausente).

- [ ] **Step 3: Implementar em `transicao-de-subpagina.tsx`**

- `telaPronta` arma `limiteDaRota = setTimeout(() => acabar(false), LIMITE_DA_ROTA_MS)` ao começar. Em `conferir`, na primeira vez que `location.pathname !== rotaDeAntes`: limpa `limiteDaRota` e arma `limiteDaEspera = setTimeout(() => acabar(true), LIMITE_DA_ESPERA_MS)` (uma vez só). Sem esqueleto, o sossego chama `acabar(true)`. `acabar(ok)` limpa os três temporizadores, desconecta o observador e resolve `ok`.
- No `aoClicar`, dentro do callback: `router.push(...)`; `if (!(await telaPronta(rotaDeAntes))) transicao.skipTransition()`; depois o `setProperty("--subpagina-desvio", …)` como hoje. `transicao` é `const` declarada pelo retorno do `startViewTransition`; o callback só corre depois da foto, então a referência já existe.
- Atualizar o JSDoc do componente: a espera tem duas fases, e sem rota nova em 4s a troca acontece sem gesto.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/components/layout/transicao-de-subpagina.test.ts`
Expected: PASS (todos)

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/transicao-de-subpagina.tsx src/components/layout/transicao-de-subpagina.test.ts
git commit -m "fix(subpagina): só anima com a rota nova montada"
```

### Task 2: o movimento do push do iOS

**Files:**
- Modify: `src/app/globals.css` (as quatro regras `html[data-subpagina="…"]::view-transition-*(subpagina-conteudo)` e os keyframes `subpagina-esquerda` / `subpagina-vem-esquerda`, ~linhas 2451–2490)
- Test: `src/components/layout/transicao-de-subpagina.test.ts`

**Interfaces:**
- Consumes: nada da Task 1.

- [ ] **Step 1: Teste novo**

```ts
it("o gesto anda na curva das folhas, e a tela de baixo escurece ao recuar", () => {
    const regras = [...CSS.matchAll(/html\[data-subpagina="(?:entra|volta)"\]::view-transition-(?:old|new)\(subpagina-conteudo\) \{\s+animation: ([^;]+);/g)].map((m) => m[1])
    expect(regras).toHaveLength(4)
    for (const a of regras) expect(a).toMatch(/^var\(--duration-spring\) var\(--ease-emphasized\) both subpagina-/)
    expect(CSS).toMatch(/@keyframes subpagina-esquerda \{[\s\S]{0,200}opacity: 0\.85;/)
    expect(CSS).toMatch(/@keyframes subpagina-vem-esquerda \{[\s\S]{0,120}opacity: 0\.85;/)
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/components/layout/transicao-de-subpagina.test.ts`
Expected: FAIL (`--duration-slow` ainda nas regras)

- [ ] **Step 3: Editar `globals.css`**

- As quatro `animation:` viram `var(--duration-spring) var(--ease-emphasized) both <keyframe>`.
- `subpagina-esquerda`: `to` ganha `opacity: 0.85`. `subpagina-vem-esquerda`: `from` ganha `opacity: 0.85`.
- O comentário acima do bloco diz a curva e o porquê (as folhas do vaul; 300ms em `--ease-out` sumiam nos quadros que o Safari perde montando a tela).

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/components/layout/transicao-de-subpagina.test.ts`
Expected: PASS

- [ ] **Step 5: Conferir no simulador** (iPhone 17, Safari, `http://localhost:3000/me`, logado)

Abrir Cartões uma vez (compila), voltar, abrir de novo gravando com `xcrun simctl io booted recordVideo`; extrair a 30 fps com `ffmpeg -threads 4`. Passou se: nenhum quadro mostra a Você deslizando sobre a Você; a tela nova cruza a tela em ≥ 10 quadros; o mesmo com a Você rolada até o fim abrindo "Preferências de notificação". Ajustar a opacidade (0,8–0,9) se a de baixo parecer apagada ou não escurecer.

- [ ] **Step 6: Verificação completa e commit**

Run: `npx tsc --noEmit && npm run lint && npm run test:unit && graphify update .`
Expected: tudo verde.

```bash
git add src/app/globals.css src/components/layout/transicao-de-subpagina.test.ts
git commit -m "feat(subpagina): o gesto na curva do push do iOS"
```
