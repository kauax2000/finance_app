# Aviso de nova versão no telefone — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O aviso de nova versão vira um toast explicado e, abaixo de 768px, empilhado com um botão largo de 44px.

**Architecture:** Uma forma opt-in do toast do design system (`.toast-stacked`, CSS em `globals.css`, ligada por `toastPersistentAction({ stacked: true })`), e o `sw-register.tsx` passa a pedir essa forma com o texto novo.

**Tech Stack:** Next.js (ler `node_modules/next/dist/docs/` antes de mexer em convenção do Next), sonner, Tailwind v4, vitest (testes de fonte com `lerFonte`).

**Spec:** `docs/superpowers/specs/2026-11-21-aviso-nova-versao-mobile-design.md`

## Global Constraints

- Título exato: `Nova versão do app`.
- Descrição exata: `Atualize para ver as novidades. O que você já salvou continua aqui.`
- Rótulo exato do botão: `Atualizar agora`.
- A forma empilhada vale só em `@media (width < 48rem)`; no desktop o toast segue como hoje (só ganha a descrição).
- Botão empilhado: largura da linha inteira, `height: 44px`, tecla `primary` (`--primary`, `--primary-foreground`, `--primary-hover` no `:hover`/`:active`).
- Tokens só; nenhum `#hex`/`rgb()`. `src/lib/toast.ts` continua `.ts`. Nenhuma tela importa `toast` de `sonner`.
- O bloco CSS novo mora entre `/* ─── O toast: a placa flutuante` e `/* ── A dissolução das bordas de uma região rolável` (o `BLOCO` que `sonner-versions.test.ts` fatia), logo depois da regra `.toast-progress`.
- Não mudam: `id: "sw-update"`, duração `Infinity`, o recarregar ao esconder a aba, o ramo de primeira instalação.
- Depois de mexer em código: `graphify update .`.

## Review Focus

- **Toast com `cancel` e `stacked` ao mesmo tempo** — `toastPersistentAction` não aceita `cancel`, então não acontece; nada a testar.
- **Desktop sem regressão** — a regra empilhada não pode vazar acima de 48rem: o teste da Task 1 exige que o seletor `.toast-stacked` só apareça dentro de `@media (width < 48rem)`.
- **Bolha substituída herda classe** — `emitir` passa `className: undefined` de propósito (comentário no código). A classe nova deve entrar só quando pedida, e a ausência continua `undefined`: teste da Task 1.
- **Realce no toque** — seguir a regra existente das ações (`:hover, :active` juntos), para o toque acender pelo `:active`; o teste da Task 1 exige `var(--primary-hover)`.
- **Texto do aviso longo no 320px** — a descrição quebra dentro da faixa ao lado do poço (`max-width: calc(100% - 40px)` já existente); verificação visual na Task 3.

---

### Task 1: A forma empilhada do toast (design system)

**Files:**
- Modify: `src/lib/toast.ts` (`emitir`, `toastPersistentAction`)
- Modify: `src/app/globals.css` (bloco do toast, depois de `.toast-progress [data-description]`)
- Modify: `src/app/designsystem/docs/sonner.tsx` (demo e `PropsTable`)
- Test: `src/components/ui/sonner-versions.test.ts`

**Interfaces:**
- Produces: `toastPersistentAction(message: string, opts: { id: string; label: string; onClick: () => void; description?: ReactNode; stacked?: boolean }): string | number` — com `stacked: true`, o toast leva `className: "toast-stacked"`.
- `emitir(tipo, mensagem, duracaoPadrao, opts: ToastOptions = {}, className?: string)` — quinto parâmetro opcional, repassado ao sonner; sem ele, `className: undefined` como hoje.

- [ ] **Step 1: Escrever os testes que falham** em `sonner-versions.test.ts`, num `describe("a forma empilhada", …)`:

```ts
it("toastPersistentAction pede a forma empilhada por opção, e o resto segue sem classe", () => {
  expect(LIB).toMatch(/stacked\?: boolean/)
  expect(LIB).toContain('opts.stacked ? "toast-stacked" : undefined')
})

it("só no telefone: texto em cima, botão primário de 44 na linha inteira", () => {
  const inicio = BLOCO.indexOf("/* A forma empilhada")
  expect(inicio).toBeGreaterThan(-1)
  const regra = BLOCO.slice(inicio)
  // Toda ocorrência da classe mora depois do @media do telefone.
  expect(BLOCO.indexOf(".toast-stacked")).toBeGreaterThan(BLOCO.indexOf("@media (width < 48rem)", inicio))
  expect(regra).toContain("flex-basis: calc(100% - 40px);")
  expect(regra).toContain("flex: 1 1 100%;")
  expect(regra).toContain("height: 44px;")
  expect(regra).toContain("background: var(--primary);")
  expect(regra).toContain("color: var(--primary-foreground);")
  expect(regra).toContain("background: var(--primary-hover);")
})
```

O bloco CSS novo é o último do `BLOCO` (fica depois de `.toast-progress`), então `slice(inicio)` pega só ele.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/components/ui/sonner-versions.test.ts`
Expected: FAIL nos dois testes novos; os antigos passam.

- [ ] **Step 3: Implementar**
  - `emitir` ganha `className?: string` e passa `className` ao sonner (mantém o comentário existente sobre a bolha substituída).
  - `toastPersistentAction` aceita `stacked?: boolean` e chama `emitir(..., opts.stacked ? "toast-stacked" : undefined)`; atualizar o JSDoc dele em uma linha.
  - `globals.css`: um bloco comentado `/* A forma empilhada (toastPersistentAction stacked) … */` com `@media (width < 48rem)` contendo, com seletor `[data-sonner-toaster] [data-sonner-toast][data-styled="true"].toast-stacked`: `[data-content] { flex-basis: calc(100% - 40px); }`, `[data-button] { flex: 1 1 100%; margin-inline: 0; height: 44px; font-size: var(--text-sm); background: var(--primary); color: var(--primary-foreground); }` e `[data-button]:hover, [data-button]:active { background: var(--primary-hover); }`. Especificidade: subir `[data-sonner-theme]` se o sonner vencer (ver a regra do `cancel`).
  - `docs/sonner.tsx`: um botão de demo "versão nova" chamando `toastPersistentAction("Nova versão do app", { id: "demo-versao", label: "Atualizar agora", description: "Atualize para ver as novidades. O que você já salvou continua aqui.", stacked: true, onClick: () => toastPill("Atualizado") })`; e a linha da `PropsTable` vira `type: "(message, { id, label, onClick, description?, stacked? })"`, `description: "O aviso que espera uma decisão; stacked empilha o botão largo no telefone."`.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/components/ui/sonner-versions.test.ts src/app/designsystem`
Expected: PASS (inclui `doc-pages.test.ts`).

- [ ] **Step 5: Commit**

```bash
git add src/lib/toast.ts src/app/globals.css src/app/designsystem/docs/sonner.tsx src/components/ui/sonner-versions.test.ts
git commit -m "feat(toast): forma empilhada do aviso persistente no telefone"
```

### Task 2: O aviso de nova versão usa o texto e a forma nova

**Files:**
- Modify: `src/app/sw-register.tsx` (chamada de `toastPersistentAction`, ~linha 73)
- Test: `src/app/sw-register.test.ts`

**Interfaces:**
- Consumes: `toastPersistentAction(..., { stacked?: boolean, description?: ReactNode })` da Task 1.

- [ ] **Step 1: Escrever o teste que falha** em `sw-register.test.ts`:

```ts
it("o aviso de versão é claro: título, frase, botão largo no telefone", () => {
  expect(CODIGO).toContain('toastPersistentAction("Nova versão do app"')
  expect(CODIGO).toContain('"Atualize para ver as novidades. O que você já salvou continua aqui."')
  expect(CODIGO).toContain('label: "Atualizar agora"')
  expect(CODIGO).toContain("stacked: true")
  expect(CODIGO).toContain('id: "sw-update"')
})
```

Ajustar o comentário do teste "a primeira instalação…" e o comentário em `sw-register.tsx` que cita "Nova versão disponível" para o título novo.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/app/sw-register.test.ts`
Expected: FAIL no teste novo.

- [ ] **Step 3: Implementar** — trocar título, `label` e acrescentar `description` e `stacked: true`; o resto do handler não muda.

- [ ] **Step 4: Rodar a verificação completa**

Run: `npx vitest run src/app/sw-register.test.ts && npx tsc --noEmit && npm run lint && npm run test:unit && npm run ds:audit -- src/app/sw-register.tsx src/lib/toast.ts`
Expected: tudo verde; o auditor sem violação nova.

- [ ] **Step 5: Commit e grafo**

```bash
git add src/app/sw-register.tsx src/app/sw-register.test.ts
git commit -m "feat(pwa): aviso de nova versão mais claro, empilhado no telefone"
graphify update .
```

### Task 3: Conferir no telefone (sessão principal)

- [ ] Abrir `/designsystem/sonner` na prévia a 375px, disparar a demo "versão nova": título, frase, botão largo de 44 e preto/branco conforme o tema; em 320px a frase quebra sem estourar; a 1280px o botão fica ao lado (sem forma empilhada). Conferir claro e escuro. Screenshot como prova.
