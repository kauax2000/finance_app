# Configurações: o lançamento mora no celular — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Em Configurações, "Lançar gastos pelo iPhone" só aparece no iPhone com o app instalado; no celular pelo navegador entra um convite para instalar; no computador a propaganda "No celular" vende as funcionalidades novas.

**Architecture:** Uma função pura `aparelhoDeLancar` decide o aparelho a partir de três sinais (celular pela largura, instalado, iPhone pelo `userAgent`), e o hook `useAparelhoDeLancar` a alimenta, devolvendo `"sabendo"` até o cliente montar. A página de Configurações escolhe entre `AtalhoSecao` e o novo `ConviteDeInstalar` por esse valor; o `NoCelularCartao` troca o texto.

**Tech Stack:** Next/React (cliente), Tailwind v4, vitest (testes de fonte com `lerFonte`/`semComentarios` e unitários).

**Spec:** `docs/superpowers/specs/2026-11-04-celular-e-a-propaganda-design.md`

## Global Constraints

- Design system do `AGENTS.md`: tokens, Heroicons (16/solid em ícone sem tamanho ou `size-4`), peças de `@/components/ui/*`; **nada em `src/components/ui/`, `src/app/globals.css` nem `src/app/designsystem/`**.
- Nenhum texto de tela diz "PWA" nem "standalone".
- Não rode prettier nos arquivos de `src/components/account/`.
- Commit só dos arquivos da tarefa, por caminho explícito; sem `git add -A`.
- Rodar no fim de cada tarefa: `npx vitest run <testes da tarefa> && npx tsc --noEmit && npx eslint <arquivos> && npm run ds:audit -- <arquivos de tela>`.

## Review Focus

- No primeiro quadro (servidor e hidratação) nenhum dos três blocos (seção, convite, propaganda) aparece: o valor é `"sabendo"`.
- iPhone com o app instalado e janela larga (deitado, 768px ou mais) ainda vê a seção: a largura não entra na decisão de "instalado".
- iPad (o `userAgent` diz Macintosh com toque, ou iPad) nunca vê a seção nem as vantagens do iPhone.
- Android no navegador vê o convite sem Siri nem Apple Pay e sem o botão "Como instalar".
- O computador não vê `AtalhoSecao` em nenhum caso (inclusive com aparelhos já conectados).

---

### Task 1: Qual aparelho

**Files:**
- Create: `src/hooks/use-aparelho-de-lancar.ts`
- Test: `src/hooks/use-aparelho-de-lancar.test.ts`

**Interfaces:**
- Produces:
  - `export type AparelhoDeLancar = "sabendo" | "computador" | "navegador-iphone" | "navegador-android" | "iphone-instalado" | "android-instalado"`
  - `export function aparelhoDeLancar(s: { celular: boolean; instalado: boolean; iphone: boolean }): Exclude<AparelhoDeLancar, "sabendo">`
  - `export function ehIphone(userAgent: string): boolean` — `/iphone/i`; iPad e Mac não são iPhone.
  - `export function useAparelhoDeLancar(): AparelhoDeLancar` — `"sabendo"` no servidor e na hidratação (um `useSyncExternalStore` com o servidor devolvendo `false` para "montado"); depois, `aparelhoDeLancar` com `useIsMobile()` (`@/hooks/use-mobile`), `useDisplayMode().isStandalone` (`@/hooks/use-display-mode`) e `ehIphone(navigator.userAgent)`.

A regra (a tabela do spec): instalado e iPhone → `"iphone-instalado"`; instalado e não iPhone → `"android-instalado"`; não instalado e celular → `"navegador-iphone"` se iPhone, senão `"navegador-android"`; não instalado e não celular → `"computador"`.

- [ ] **Step 1: Escrever o teste**

```ts
import { describe, expect, it } from "vitest"
import { aparelhoDeLancar, ehIphone } from "./use-aparelho-de-lancar"

describe("aparelhoDeLancar", () => {
    it("instalado decide antes da largura", () => {
        expect(aparelhoDeLancar({ celular: false, instalado: true, iphone: true })).toBe("iphone-instalado")
        expect(aparelhoDeLancar({ celular: true, instalado: true, iphone: true })).toBe("iphone-instalado")
        expect(aparelhoDeLancar({ celular: true, instalado: true, iphone: false })).toBe("android-instalado")
    })
    it("no navegador, a largura separa celular de computador", () => {
        expect(aparelhoDeLancar({ celular: true, instalado: false, iphone: true })).toBe("navegador-iphone")
        expect(aparelhoDeLancar({ celular: true, instalado: false, iphone: false })).toBe("navegador-android")
        expect(aparelhoDeLancar({ celular: false, instalado: false, iphone: false })).toBe("computador")
    })
})

describe("ehIphone", () => {
    it("só o iPhone", () => {
        expect(ehIphone("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)")).toBe(true)
        expect(ehIphone("Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)")).toBe(false)
        expect(ehIphone("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)")).toBe(false)
        expect(ehIphone("Mozilla/5.0 (Linux; Android 15; Pixel 9)")).toBe(false)
    })
})
```

- [ ] **Step 2: Rodar e ver falhar** — `npx vitest run src/hooks/use-aparelho-de-lancar.test.ts` → FAIL (módulo não existe).
- [ ] **Step 3: Implementar o arquivo** com as assinaturas acima (`"use client"` no topo).
- [ ] **Step 4: Rodar** o teste, `npx tsc --noEmit` e `npx eslint src/hooks/use-aparelho-de-lancar.ts src/hooks/use-aparelho-de-lancar.test.ts` → passam.
- [ ] **Step 5: Commit**

```bash
git add src/hooks/use-aparelho-de-lancar.ts src/hooks/use-aparelho-de-lancar.test.ts
git commit -m "feat(configuracoes): useAparelhoDeLancar decide computador, navegador ou app instalado"
```

---

### Task 2: O convite e quem vê o quê em Configurações

**Files:**
- Create: `src/components/settings/convite-de-instalar.tsx`
- Modify: `src/app/(app)/settings/(raiz)/page-client.tsx` (hoje desenha `<AtalhoSecao />` sempre)
- Test: `src/components/settings/settings-page.test.ts` (novo `describe`)

**Interfaces:**
- Consumes: `useAparelhoDeLancar` e `AparelhoDeLancar` (Task 1).
- Produces: `export function ConviteDeInstalar({ iphone }: { iphone: boolean })`.

O convite (spec, "O convite no celular pelo navegador"): `SettingsSection titulo="Use como app"` com um `Card` que traz `JanelaDoAparelho tela={TELA_DA_NOTIFICACAO}` (de `@/components/account/passo-a-passo`), o título "Ponha o Finance na tela de início", uma frase sobre usar como app (abre direto, tela cheia, avisos) e:
- `iphone`: a lista das três vantagens do iPhone (Siri ou um toque — Botão de Ação, Tela Bloqueada, ícone —; o formulário rápido; Apple Pay lança sozinho) e `Button variant="primary"` "Como instalar" que abre `InstallPwaSheet` (`@/components/pwa/install-pwa-sheet`, props `open`/`onOpenChange`);
- sem `iphone`: sem lista e sem botão; a frase diz "No menu do navegador, toque em Instalar app."

Composição livre dentro do design system (o vazio de hoje do `AtalhoSecao` é a referência: `EmptyState variant="plain" size="sm"` com a `JanelaDoAparelho compacta`).

Na página: `aparelho === "iphone-instalado"` → `<AtalhoSecao />`; `"navegador-iphone"` → `<ConviteDeInstalar iphone />`; `"navegador-android"` → `<ConviteDeInstalar iphone={false} />`; os demais (`"sabendo"`, `"computador"`, `"android-instalado"`) → nada nesse lugar. A ordem das seções continua (o lugar do `AtalhoSecao`, entre `ThemeSettings` e `IasSecao`).

- [ ] **Step 1: Escrever o teste** em `settings-page.test.ts`:

```ts
describe("Configurações: o lançamento mora no celular", () => {
    it("a seção do iPhone só no iPhone instalado, e o convite no navegador do celular", () => {
        const f = semComentarios(lerFonte("src/app/(app)/settings/(raiz)/page-client.tsx"))
        expect(f).toContain("useAparelhoDeLancar()")
        expect(f).toMatch(/"iphone-instalado"[^]*<AtalhoSecao \/>/)
        expect(f).toMatch(/"navegador-iphone"[^]*<ConviteDeInstalar iphone \/>/)
        expect(f).toMatch(/"navegador-android"[^]*<ConviteDeInstalar iphone=\{false\} \/>/)
        const ordem = ["<ThemeSettings", "<IasSecao", "<NotificationPreferences"].map((p) => f.indexOf(p))
        expect(ordem).toEqual([...ordem].sort((a, b) => a - b))
    })
    it("o convite não diz PWA e só promete o iPhone a quem tem iPhone", () => {
        const c = semComentarios(lerFonte("src/components/settings/convite-de-instalar.tsx"))
        expect(c).not.toMatch(/PWA|standalone/i)
        expect(c).toContain("Ponha o Finance na tela de início")
        expect(c).toContain("No menu do navegador, toque em Instalar app.")
        expect(c).toContain("InstallPwaSheet")
        expect(c).toMatch(/iphone \?/)
    })
})
```

(importe `semComentarios` de `@/test/fonte` junto do `lerFonte`.)

- [ ] **Step 2: Rodar e ver falhar** — `npx vitest run src/components/settings/settings-page.test.ts` → FAIL.
- [ ] **Step 3: Criar `ConviteDeInstalar` e mudar a página** como acima.
- [ ] **Step 4: Rodar** o teste do arquivo, `npx tsc --noEmit`, `npx eslint` nos três arquivos e `npm run ds:audit -- src/components/settings/convite-de-instalar.tsx "src/app/(app)/settings/(raiz)/page-client.tsx"` → passam, auditor sem achado.
- [ ] **Step 5: Commit**

```bash
git add src/components/settings/convite-de-instalar.tsx "src/app/(app)/settings/(raiz)/page-client.tsx" src/components/settings/settings-page.test.ts
git commit -m "feat(configuracoes): a seção do iPhone só no app instalado, e o convite para instalar no navegador do celular"
```

---

### Task 3: A propaganda no computador

**Files:**
- Modify: `src/components/settings/no-celular-cartao.tsx` (o texto e a lista)
- Modify: `src/components/settings/theme-settings.tsx` (o `alcance` da seção "No celular", hoje "Lance por frase e instale o app no telefone.")
- Test: `src/components/settings/settings-page.test.ts` (novo `it`)

**Interfaces:** nenhuma nova; `NoCelularCartao({ value })` continua.

O texto (spec, "A propaganda no computador"): título "O dia a dia é no celular"; uma linha curta, "No computador você vê e organiza. Na rua, lança pelo celular." (ou equivalente); a lista, nesta ordem, com Heroicons 16/solid:
1. "Lance falando com a Siri ou com um toque" — iPhone
2. "Um formulário rápido quando não dá para falar" — iPhone
3. "Pague com Apple Pay e o gasto entra sozinho" — iPhone
4. "Lance digitando uma frase, com o app na tela de início"

As três primeiras levam a marca "no iPhone" (um `Badge` pequeno do design system ou um sufixo no texto, à escolha). O `alcance` novo diz o mesmo em uma linha (ex.: "Instale no celular: é lá que você lança."). O QR, o "Copiar link", a imagem do aparelho e o comportamento abaixo de 36rem continuam; o cartão pode crescer (troque o `h-56` fixo por uma altura mínima se a lista não couber).

- [ ] **Step 1: Escrever o teste** em `settings-page.test.ts`:

```ts
it("a propaganda vende o celular com as funcionalidades novas", () => {
    const n = semComentarios(lerFonte("src/components/settings/no-celular-cartao.tsx"))
    expect(n).toContain("O dia a dia é no celular")
    for (const v of [
        "Lance falando com a Siri ou com um toque",
        "Um formulário rápido quando não dá para falar",
        "Pague com Apple Pay e o gasto entra sozinho",
        "Lance digitando uma frase, com o app na tela de início",
    ])
        expect(n).toContain(v)
    expect(n).toMatch(/no iPhone/)
    expect(n).not.toContain("Abra o Finance no telefone")
    expect(n).not.toMatch(/PWA/)
    expect(semComentarios(lerFonte("src/components/settings/theme-settings.tsx"))).not.toContain(
        "Lance por frase e instale o app no telefone.",
    )
})
```

- [ ] **Step 2: Rodar e ver falhar.**
- [ ] **Step 3: Mudar o cartão e o `alcance`.**
- [ ] **Step 4: Rodar** o teste, `tsc`, `eslint` nos dois arquivos e `npm run ds:audit -- src/components/settings/no-celular-cartao.tsx src/components/settings/theme-settings.tsx`.
- [ ] **Step 5: Commit**

```bash
git add src/components/settings/no-celular-cartao.tsx src/components/settings/theme-settings.tsx src/components/settings/settings-page.test.ts
git commit -m "feat(configuracoes): a propaganda No celular vende Siri, toques, formulário e Apple Pay"
```

---

### Task 4: Jornadas e Atlas

**Files:**
- Modify: `docs/JORNADAS.md` (a linha "Tokens de captura (Bloco 3A)" e o fluxograma/regras de Configurações que citam a seção; a linha de "Lançar ao pagar")
- Modify: `docs/atlas/template.html` (a mesma jornada: "Como funciona" e pontos de atenção; a data da capa)
- Generated: `docs/atlas/atlas-jornadas.html` via `python3 docs/atlas/build.py`

O que dizer: a seção "Lançar gastos pelo iPhone" (com o `GuiaDoAtalho` e o Lançar ao pagar) aparece só no iPhone com o app instalado (`useAparelhoDeLancar`); no celular pelo navegador, o convite "Use como app" com "Como instalar" (iPhone, abre o `InstallPwaSheet`) ou o caminho do menu (Android); no computador, só a propaganda "No celular"; no computador não se gerenciam mais os aparelhos. Também: a aba Bloqueio do passo 6 e a sugestão de nome sem repetir (4/nov), se o template ainda não os tiver.

- [ ] **Step 1: Editar os dois arquivos** (diagramas com `%%{init}%%`, ids de nó fora das palavras reservadas do Mermaid).
- [ ] **Step 2: `python3 docs/atlas/build.py`** → gera sem erro.
- [ ] **Step 3: Commit**

```bash
git add docs/JORNADAS.md docs/atlas/template.html docs/atlas/atlas-jornadas.html
git commit -m "docs(jornadas): a seção do iPhone só no app instalado, o convite no navegador e a propaganda no computador"
```

A republicação do Atlas (Artifact, mesmo URL) é do controlador, depois desta tarefa.
