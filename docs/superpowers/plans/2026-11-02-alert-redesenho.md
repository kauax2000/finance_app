# Redesenho do Alert

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Levar o `Alert` à identidade do app: raio de 22px, poço do ícone, ação na mesma linha em largura estreita e dispensar com lembrança no aparelho, em todos os alertas.

**Architecture:** A mudança mora em `src/components/ui/alert.tsx`, e as 21 telas herdam sem mudar código. O raio muda apontando os dois degraus para `rounded-surface`, na escala. A `AnnouncementBar` importa `TONE_ICON` e não muda.

**Tech Stack:** React 19, Tailwind v4 (container queries), Vitest.

**Spec:** Sem documento. Escolhas do dono na `AskUserQuestion` de 2026-11-02, depois dos mockups: Redesenho "22px, tinta inteira"; Peças "Poço do ícone próprio" e "Ação na mesma linha"; Comportamento "Dispensar e lembrar"; App "Todos os alertas".

## Global Constraints

- As cinco tintas (`tone`) e `variant="brand"` não mudam: a caixa segue com a tinta inteira.
- `size` continua `sm` e `md`. Os dois vestem `rounded-surface` (22px).
- Poço: círculo `bg-current/15`, 24 no `sm` e 32 no `md`, com o ícone de 14 e 16. Sem token novo.
- Com `icon={false}` ou sem ícone, nada de poço.
- A ação `inline` sobe à direita a partir de 20rem do alerta (era 28rem).
- `storageKey` guarda em `localStorage`, na chave `alert-dispensado:${storageKey}`, e uma falha de `localStorage` nunca quebra a tela.
- Todo `<Alert>` segue valendo sem mudança na chamada.
- `src/components/ui/` foi autorizado pelas escolhas do dono.
- Sem `git stash`. `git add` nomeia arquivos. Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Sem push. Dev usa banco de produção: nada se grava ao testar.

## Review Focus

1. Título sozinho: centrado com o poço. Título com descrição: a coluna do texto começa no topo do poço (`Task 1`).
2. O × não pega por cima do texto nem da ação inline, nos dois degraus (`Task 1`).
3. Render no servidor: `storageKey` não causa diferença de hidratação (`Task 1`).
4. `localStorage` bloqueado: o aviso aparece e o × só o some até recarregar (`Task 1`).
5. Texto longo no telefone: a ação desce em vez de esmagar o texto, abaixo de 20rem (`Task 1`).

---

### Task 1: O componente

**Files:**
- Modify: `src/components/ui/alert.tsx`
- Modify: `src/components/ui/alert-icon.test.ts:52` (`@md/alert` para `@xs/alert`)
- Modify: `src/components/settings/notification-preferences.tsx`
- Test: `src/components/ui/alert-versions.test.ts` (novo)

**Interfaces:**
- Produces: `AlertBase` ganha `storageKey?: string`. `Alert` desenha `<span data-slot="alert-icon">` em volta do ícone. Exporta `alertDispensadoKey(storageKey: string): string`.

- [ ] **Step 1: Escrever o teste que falha**

```ts
import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"
import { alertDispensadoKey, alertVariants } from "./alert"

const ALERT = semComentarios(lerFonte("src/components/ui/alert.tsx"))

describe("o redesenho do alerta", () => {
    it("os dois degraus vestem o raio do cartão", () => {
        for (const size of ["sm", "md"] as const) {
            const classes = alertVariants({ size })
            expect(classes).toContain("rounded-surface")
            expect(classes).not.toContain("rounded-row")
        }
    })

    it("o poço é do componente, na cor do texto, e mede 24 e 32", () => {
        expect(ALERT).toContain('data-slot="alert-icon"')
        expect(ALERT).toContain("rounded-full bg-current/15")
        expect(alertVariants({ size: "sm" })).toContain("[--alert-well:--spacing(6)]")
        expect(alertVariants({ size: "md" })).toContain("[--alert-well:--spacing(8)]")
    })

    it("a grade pergunta pelo poço, não pelo svg", () => {
        expect(ALERT).not.toContain("has-[>svg]")
        expect(ALERT).toContain("has-[>[data-slot=alert-icon]]:grid-cols-[var(--alert-well)_1fr]")
    })

    it("título sozinho centra, e com descrição o texto começa no topo", () => {
        expect(ALERT).toContain("items-center has-[>[data-slot=alert-description]]:items-start")
    })

    it("a ação inline sobe a partir de 20rem", () => {
        expect(ALERT).toContain("@xs/alert:data-[placement=inline]:col-[-2/-1]")
        expect(ALERT).not.toContain("@md/alert")
    })

    it("dispensar guarda no aparelho, sem quebrar sem localStorage", () => {
        expect(alertDispensadoKey("push")).toBe("alert-dispensado:push")
        expect(ALERT).toContain("React.useSyncExternalStore(")
        expect(ALERT).toContain("if (dispensado) return null")
        expect(ALERT).toMatch(/try \{[\s\S]+localStorage[\s\S]+\} catch/)
    })

    it("quem chama não muda: a tinta inteira segue nos cinco tons", () => {
        expect(alertVariants({ tone: "warning" })).toContain("bg-warning-muted")
        expect(alertVariants({ tone: "destructive" })).toContain("bg-destructive-muted")
    })
})
```

Em `settings-page.test.ts`, adicione `expect(f).toContain('storageKey="push-bloqueado"')` ao teste de Notificações.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/components/ui/alert-versions.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

Em `alert.tsx`:

- Base: `items-start` vira `items-center has-[>[data-slot=alert-description]]:items-start`. Todo `has-[>svg]` vira `has-[>[data-slot=alert-icon]]`. As colunas usam `var(--alert-well)`. Saem as regras `[&>svg]` da caixa e o `translate-y` dos degraus.
- `size`:
  - `sm`: `rounded-surface py-2 px-3.5 text-xs [--alert-well:--spacing(6)] [--alert-icon:--spacing(3.5)] has-[>[data-slot=alert-icon]]:ps-2 has-[>[data-slot=alert-icon]]:gap-x-2`
  - `md`: `rounded-surface py-3 px-4 text-sm [--alert-well:--spacing(8)] [--alert-icon:--spacing(4)] has-[>[data-slot=alert-icon]]:ps-3 has-[>[data-slot=alert-icon]]:gap-x-3`
- Poço: `<span data-slot="alert-icon" aria-hidden className="flex size-(--alert-well) shrink-0 items-center justify-center rounded-full bg-current/15 [&>svg]:size-(--alert-icon)">`.
- × centrado no poço: `end-2 top-4` no `md`, `end-1.5 top-2` no `sm`.
- `AlertActions`: `@md/alert:` vira `@xs/alert:`. Corrija o comentário para 20rem.
- `alertDispensadoKey`, e um `useDispensado(storageKey?: string): [boolean, () => void]` no próprio arquivo, com `React.useSyncExternalStore`: `getServerSnapshot` devolve `false`, e a leitura e a escrita de `localStorage` ficam em `try/catch`. Sem `localStorage`, o dispensar vale até recarregar, num `Set` do módulo. O hook vem antes do `return null`.
- O × aparece com `onDismiss` ou com `storageKey`. Ao clicar, grava e chama `onDismiss`.

Em `notification-preferences.tsx`, o alerta de bloqueio ganha `storageKey="push-bloqueado"`. O de nenhum canal não.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx tsc --noEmit && npx eslint src/components/ui/alert.tsx src/components/ui/alert-versions.test.ts && npx vitest run && npm run ds:audit -- src/components/ui/alert.tsx`
Expected: tudo passa. Se `radius-roles` ou outro teste de escala reclamar, ajuste a lista dele ao novo degrau.

- [ ] **Step 5: Commit**

Nomeie os arquivos, com a mensagem `feat(alert): raio do cartão, poço do ícone e dispensar lembrado`.

### Task 2: Catálogo e registro

**Files:**
- Modify: `src/app/designsystem/docs/alert.tsx`, `src/app/designsystem/docs/shape-elevation.tsx`, `src/app/designsystem/docs-map` (por `npm run ds:docs-map`)
- Modify: `AGENTS.md`, `docs/design/HISTORICO-DESIGN-SYSTEM.md`

**Interfaces:**
- Consumes: `storageKey` e o poço (Task 1).

- [ ] **Step 1: Atualizar `docs/alert.tsx`**

Corrija toda afirmação de raio (12 e 16), de `28rem` e de ícone na caixa. Acrescente uma nota do poço, um exemplo de `storageKey` em "comportamentos" com a chave `alert-dispensado:` dita, e `storageKey` na `PropsTable`. Conteúdo realista, sem número que não foi medido.

- [ ] **Step 2: Atualizar a escala**

Em `shape-elevation.tsx`, saem `Alert sm` e `Alert md` das linhas 40 e 46, e `Alert` entra no degrau de 22px; ajuste a frase da linha 221. Em `AGENTS.md`, faça o mesmo nas listas de `rounded-surface`, `rounded-row` e `rounded-row-lg`, e reescreva o bullet do `Alert`: raio 22 nos dois degraus, poço `bg-current/15`, `storageKey`, ação inline a partir de 20rem.

- [ ] **Step 3: Registrar**

`docs/design/HISTORICO-DESIGN-SYSTEM.md`: "### Rodada 360 — o Alert na identidade do cartão", com as quatro escolhas do dono e o motivo do raio: o `Alert sm` tinha 12px ao lado do `Card` de 22. Rode `npm run ds:docs-map`.

- [ ] **Step 4: Rodar**

Run: `npx tsc --noEmit && npm run lint && npx vitest run`
Expected: passa, sem aviso novo.

- [ ] **Step 5: Commit**

Nomeie os arquivos, com a mensagem `docs(alert): catálogo, escala e rodada 360`.
