# Convite do Android — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O convite "Use como app" que o celular Android vê em Configurações (pelo navegador) convence e ensina melhor: texto que diz o ganho, as vantagens que o Android tem de verdade e os passos do menu numerados.

**Architecture:** Só o ramo `!iphone` de `ConviteDeInstalar` muda. Ele continua um `Card padding="none"` com um `ItemGroup`, agora em três blocos: a cabeça (ícone do app, título, frase), as vantagens e os passos. Nada novo em `src/components/ui/`.

**Tech Stack:** Next/React (cliente), Tailwind v4, vitest (testes de fonte).

**Spec:** sem documento; o dono pediu "melhore os textos e melhore mais ainda o design dessa versão que não é do iPhone" e pulou as perguntas. As decisões abaixo são do construtor. O contexto é `docs/superpowers/specs/2026-11-04-celular-e-a-propaganda-design.md` (a regra de quem vê o convite, que não muda).

## Decisões (do construtor)

- **O porquê vem antes do como.** Hoje o convite abre com "Ponha o Finance na tela de início" e logo os passos; quem não sabe o ganho não segue os passos.
- **Textos:**
  - título da seção (`SettingsSection titulo`): **"Instale o app"** (antes "Use como app"), também no ramo do iPhone, para as duas versões falarem igual;
  - cabeça: título **"Tenha o Finance como app"**; frase **"Fica na tela de início do celular e abre direto, em tela cheia, sem procurar no navegador."**;
  - vantagens (só as que o Android tem; nada de Siri, Atalhos ou Apple Pay), cada uma com um ícone Heroicons `16/solid`:
    - `BoltIcon` — **"Lance o gasto em segundos, na hora da compra"**
    - `BellAlertIcon` — **"Receba os avisos de contas e do orçamento"**
    - `CloudArrowUpIcon` — **"Lance sem internet: sincroniza quando voltar"** (a fila offline existe: `SEM_CONEXAO` em `neste-celular-grupo.tsx`)
  - rótulo dos passos: **"Como instalar"** (um `ItemGroupLabel` ou o `Item` de cabeçalho da lista);
  - passos, numerados 1, 2, 3 no lugar do ícone (o número no ladrilho `ItemMedia variant="tile" tone="neutral"`):
    1. **"Toque em ⋮ no canto do Chrome"**
    2. **"Escolha Instalar app ou Adicionar à tela inicial"** (os dois nomes que o Chrome e o Samsung Internet usam)
    3. **"Abra o Finance pelo ícone novo"**
- **Desenho:** a cabeça com a `CapaDoApp` (de `neste-celular-grupo.tsx`, já exportada), título em `ItemTitle` maior no toque; as vantagens com ícone `ItemMedia variant="icon"` em tinta `text-foreground` e texto `muted`; os passos como linhas `Item variant="flush"` com o número no ladrilho. Os três blocos separados por fio do próprio `ItemGroup variant="divided"` ou por `Separator`, à escolha do construtor dentro do design system. Sem botão: no Android não há instalação automática nesta versão.

## Global Constraints

- Design system do `AGENTS.md`: tokens, Heroicons 16/solid em ícone sem tamanho ou `size-4`, só peças de `@/components/ui/*`; **nada em `src/components/ui/`, `src/app/globals.css`, `src/app/designsystem/`**; `bg-black` só dentro da `CapaDoApp` (exceção do auditor para `neste-celular-grupo`).
- Nenhum texto de tela diz "PWA", "standalone", "Siri", "Atalhos" nem "Apple Pay" no ramo do Android.
- Não rode prettier. Commit só dos arquivos da tarefa, por caminho explícito.

## Review Focus

- O ramo do Android não pode citar nada do iPhone (Siri, Apple Pay, Atalhos, a `JanelaDoAparelho`).
- Os passos são uma sequência: o número tem de ler como 1, 2, 3 para o leitor de tela também (uma `ol` ou o número no texto acessível).
- Na largura de 343px (telefone de 375 com a calha) nenhuma linha quebra feio: a passo 2 é a mais longa.
- O ramo do iPhone continua igual, só com o título de seção novo.

---

### Task 1: O convite do Android

**Files:**
- Modify: `src/components/settings/convite-de-instalar.tsx` (o ramo `if (!iphone)` e o `titulo` da seção nos dois ramos)
- Test: `src/components/settings/settings-page.test.ts` (o `it("o convite não diz PWA e só promete o iPhone a quem tem iPhone")`)
- Modify: `docs/JORNADAS.md` e `docs/atlas/template.html` onde citam "Use como app" e o texto do Android; depois `python3 docs/atlas/build.py`

**Interfaces:**
- Consumes: `CapaDoApp()` de `@/components/settings/neste-celular-grupo`; `Item`, `ItemGroup`, `ItemMedia`, `ItemContent`, `ItemTitle`, `ItemDescription` (e, se usar, `ItemGroupLabel`) de `@/components/ui/item`.
- Produces: nada novo; `ConviteDeInstalar({ iphone })` continua.

- [ ] **Step 1: Atualizar o teste**

No `it` do convite, troque as asserções do Android por:

```ts
expect(c).toContain('titulo="Instale o app"')
expect(c).not.toContain('titulo="Use como app"')
for (const t of [
    "Tenha o Finance como app",
    "Fica na tela de início do celular e abre direto, em tela cheia, sem procurar no navegador.",
    "Lance o gasto em segundos, na hora da compra",
    "Receba os avisos de contas e do orçamento",
    "Lance sem internet: sincroniza quando voltar",
    "Toque em ⋮ no canto do Chrome",
    "Escolha Instalar app ou Adicionar à tela inicial",
    "Abra o Finance pelo ícone novo",
])
    expect(c).toContain(t)
const android = c.slice(c.indexOf("if (!iphone)"), c.indexOf("return (", c.indexOf("if (!iphone)") + 20))
expect(android).not.toMatch(/Siri|Apple Pay|Atalhos|JanelaDoAparelho|VANTAGENS_DO_IPHONE/)
expect(android).toMatch(/<ol|role="list"|aria-label="Como instalar"/)
```

Mantenha as asserções que já existem sobre PWA, `InstallPwaSheet` e a ordem do ramo do iPhone; tire as que citam os textos antigos do Android ("Toque em ⋮, no canto do navegador", "Toque em Instalar app", "Abra o Finance pela tela de início").

- [ ] **Step 2: Rodar e ver falhar** — `npx vitest run src/components/settings/settings-page.test.ts` → FAIL.
- [ ] **Step 3: Reescrever o ramo do Android** com os textos e o desenho das Decisões, e o `titulo` dos dois ramos para "Instale o app". Os passos numa lista ordenada de verdade (`ItemGroup asChild` com `<ol>`, se o componente aceitar, ou um `role="list"` com `aria-label="Como instalar"`), com o número no ladrilho `aria-hidden` só se a ordem já vier da lista.
- [ ] **Step 4: Atualizar o JORNADAS.md e o template** onde citam "Use como app" e o texto do Android (procure por "Use como app" e "Instalar app"), e rodar `python3 docs/atlas/build.py`.
- [ ] **Step 5: Rodar** `npx vitest run src/components/settings src/app/\(app\)/me && npx tsc --noEmit && npx eslint src/components/settings/convite-de-instalar.tsx src/components/settings/settings-page.test.ts && npm run ds:audit -- src/components/settings/convite-de-instalar.tsx` → passam, auditor sem achado.
- [ ] **Step 6: Commit**

```bash
git add src/components/settings/convite-de-instalar.tsx src/components/settings/settings-page.test.ts docs/JORNADAS.md docs/atlas/template.html docs/atlas/atlas-jornadas.html
git commit -m "feat(configuracoes): o convite do Android diz o ganho, as vantagens e os passos numerados"
```

A republicação do Atlas é do controlador.
