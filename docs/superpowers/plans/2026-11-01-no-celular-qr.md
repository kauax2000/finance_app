# Seção "No celular" com QR Code — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** No desktop, a seção "No celular" de Configurações deixa de mostrar uma chave sem efeito e passa a levar a pessoa ao telefone por um QR Code; no telefone, ela vira "Neste celular", com duas linhas iguais.

**Architecture:** Um componente novo do design system, `QrCode` (molécula), desenha em SVG a matriz que a biblioteca `uqr` calcula. `ThemeSettings` escolhe por `useIsMobile` entre a versão de desktop e a de telefone, o mesmo gatilho que decide se a paleta do lançamento inteligente abre.

**Tech Stack:** Next.js 16, React, Tailwind v4, Vitest, `uqr@0.1.3` (nova).

**Spec:** este plano. Decisões do dono em 2026-11-01:
- Opção C dos wireframes: desktop com QR, telefone com as duas linhas.
- Redesenho: placa sempre clara, com módulos escuros nos dois temas. Sem escada de tamanho, sem módulos arredondados, sem símbolo no centro.
- Peças: `QrCodeSkeleton` e "Copiar link". Sem legenda.
- Comportamento: nome acessível exigido; abre no toque; cresce levemente no cursor.
- App: só Configurações.

## Global Constraints

- Tudo em tokens. A placa é `bg-background text-foreground dark:bg-foreground dark:text-background`: clara nos dois temas sem token novo.
- `src/components/ui/`, `globals.css` e `designsystem/`: a mudança está autorizada pelas escolhas acima. Nenhum token novo, nenhum outro componente de `ui/` muda.
- Heroicons e nada mais; ícone sem classe de tamanho é `16/solid`.
- `hover:` sempre com o par `active:` (regra H do auditor).
- Componente novo segue `docs/design/COMPONENTE-NOVO.md`. Comentários e textos em português.
- Sem push. `git add` nomeia arquivos. Não tocar em `CLAUDE.md` nem em `.superpowers/`.
- O banco de dev é o de produção: nada de salvar, ligar chave ou excluir ao testar.
- Antes de ler código: `graphify query "<pergunta>"`. Depois de mudar código: `graphify update .`, e `graphify-out/` entra no commit.
- Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- `value` vazio (antes de o cliente saber a origem): mostra o esqueleto, sem hidratação quebrada. Teste na Task 1.
- `value` maior que a capacidade do QR: `encode` lança, e a tela não pode cair. Mostra o esqueleto. Teste na Task 1.
- Área de transferência negada ou ausente (`navigator.clipboard` indefinido em HTTP): sem rejeição solta, e a dica diz que não copiou. Teste na Task 1.
- Fila de sincronização pendente no desktop: a linha com `SyncStatusChip` continua alcançável, porque nenhuma outra tela a mostra. Teste na Task 3.
- Âncora `#no-celular` no telefone: a seção tem o `id`, e `rolarAteAncora` a acha. Teste na Task 3.

---

### Task 1: Componente `QrCode`

**Files:**
- Create: `src/components/ui/qr-code.tsx`
- Create: `src/components/ui/qr-code-versions.test.ts`
- Modify: `package.json`, `package-lock.json`
- Modify: `.claude/skills/design-system-guard/scripts/audit.mjs` (`DRAWN_SVG_FILES`)

**Interfaces:**
- Produces, todos exportados de `@/components/ui/qr-code`:
  - `qrCodeMatriz(value: string): { tamanho: number; caminho: string } | null`: `null` com `value` vazio ou que não cabe.
  - `QrCode(props: { value: string; label: string; className?: string })`
  - `QrCodeCopy(props: { value: string; className?: string })`
  - `QrCodeSkeleton(props: { group?: boolean; className?: string })`

- [ ] **Step 1: Instalar a biblioteca**

Run: `npm install uqr@0.1.3`
Expected: `package.json` com `"uqr": "0.1.3"` ou `"^0.1.3"`. Leia o `.d.ts` dela para confirmar `encode` e as opções `ecc` e `border`.

- [ ] **Step 2: Escrever o teste que falha**

Em `qr-code-versions.test.ts`, com `lerFonte` e `semComentarios` de `@/test/fonte`:

```ts
it("qrCodeMatriz desenha só os módulos escuros", () => {
    const m = qrCodeMatriz("https://app.exemplo.com/settings#no-celular")!
    expect(m.tamanho).toBeGreaterThanOrEqual(21)
    expect(m.caminho).toMatch(/^M\d+ \d+h1v1h-1z/)
})
it("sem valor ou além da capacidade, não lança e devolve null", () => {
    expect(qrCodeMatriz("")).toBeNull()
    expect(qrCodeMatriz("x".repeat(8000))).toBeNull()
})
it("a placa é clara nos dois temas, sem cor crua", () => {
    const f = semComentarios(lerFonte("src/components/ui/qr-code.tsx"))
    expect(f).toContain("bg-background text-foreground dark:bg-foreground dark:text-background")
    expect(f).not.toMatch(/bg-white|text-black|#[0-9a-f]{3,6}\b/i)
})
it("label é obrigatório e vira o nome do link", () => {
    const f = semComentarios(lerFonte("src/components/ui/qr-code.tsx"))
    expect(f).toMatch(/label: string/)
    expect(f).toContain("aria-label={label}")
})
it("o link só recebe o clique no toque, e o crescimento tem o par de toque", () => {
    const f = semComentarios(lerFonte("src/components/ui/qr-code.tsx"))
    expect(f).toContain("pointer-events-none pointer-coarse:pointer-events-auto")
    expect(f).toContain("hover:scale-110 active:scale-110")
})
it("copiar confirma pelo Tooltip e trata a recusa", () => {
    const f = semComentarios(lerFonte("src/components/ui/qr-code.tsx"))
    expect(f).toContain('"Link copiado"')
    expect(f).toContain('"Não deu para copiar"')
    expect(f).toMatch(/navigator\.clipboard\?\.writeText|try\s*\{/)
})
```

Use o caminho do teste para importar `qrCodeMatriz` direto do componente.

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx vitest run src/components/ui/qr-code-versions.test.ts`
Expected: FAIL, módulo não encontrado.

- [ ] **Step 4: Implementar `qr-code.tsx`**

Comece com `"use client"`. Comente no topo por que a placa é clara: leitor de câmera falha mais com QR invertido.

- `qrCodeMatriz`: `encode(value, { ecc: "M", border: 0 })` dentro de `try`; `caminho` é `M{x} {y}h1v1h-1z` por módulo escuro.
- `QrCode`: sem matriz, devolve `<QrCodeSkeleton />`. Com matriz, anatomia:
  - raiz `div`, `data-slot="qr-code"`: `size-32 shrink-0 rounded-row p-3 ring-1 ring-foreground/10`, a placa das Global Constraints, `transition-[scale] duration-(--duration-fast) ease-(--ease-out) hover:scale-110 active:scale-110`. O `p-3` é a margem de silêncio: não reduza.
  - dentro, `<a href={value} aria-label={label} data-slot="qr-code-link">` com `block size-full rounded-md pointer-events-none pointer-coarse:pointer-events-auto` e o foco da casa (`focus-visible:ring-3 focus-visible:ring-ring/45`).
  - dentro, `<svg viewBox="0 0 {tamanho} {tamanho}" shapeRendering="crispEdges" aria-hidden="true" className="size-full"><path fill="currentColor" d={caminho} /></svg>`.
- `QrCodeCopy`: `data-slot="qr-code-copy"`, `<Tooltip confirmation={…}>` em volta de `<Button type="button" variant="secondary" disabled={!value}>` com `LinkIcon` (`16/solid`) e o texto `Copiar link`. Siga o idioma de `src/components/members/workspace-invite-dialog.tsx:365` para o tempo da confirmação. Estado `"copiado" | "falhou" | null`; `navigator.clipboard` ausente ou recusado cai em `"falhou"`, sem rejeição solta.
- `QrCodeSkeleton`: `data-slot="qr-code-skeleton"`, `Skeleton` de `size-32 rounded-row`, dentro de `SkeletonGroup label="Preparando o código"`; com `group={false}`, o `Skeleton` sozinho. O padrão de `group` é `true`.

Adicione `src/components/ui/qr-code.tsx` a `DRAWN_SVG_FILES` em `audit.mjs`, com o motivo: a matriz é um desenho, não um ícone.

- [ ] **Step 5: Rodar e ver passar**

Run: `npx vitest run src/components/ui/qr-code-versions.test.ts && npm run ds:audit -- src/components/ui/qr-code.tsx`
Expected: testes PASS, auditor sem violação.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/components/ui/qr-code.tsx src/components/ui/qr-code-versions.test.ts .claude/skills/design-system-guard/scripts/audit.mjs
git commit -m "feat(ds): QrCode, o código desenhado em SVG com tokens"
```

### Task 2: Registro no catálogo

**Files:**
- Modify: `src/app/designsystem/registry.ts` (dentro de `layer("Molecules", …)`, em ordem alfabética)
- Create: `src/app/designsystem/docs/qr-code.tsx`
- Modify: mapa gerado por `npm run ds:docs-map`
- Modify: `AGENTS.md` (bullet em "Carrossel e apresentação"; contagem de "82 arquivos" se o número real mudou)
- Modify: `docs/design/HISTORICO-DESIGN-SYSTEM.md` (nova `### Rodada 355`, ao fim)

**Interfaces:**
- Consumes: `QrCode`, `QrCodeCopy`, `QrCodeSkeleton` da Task 1.

- [ ] **Step 1: Registrar a entrada**

`entry("qr-code", "QR Code", "O código que leva de uma tela a outro aparelho.", ui("qr-code"), "QrCode, QrCodeCopy, QrCodeSkeleton")`. Se `taxonomy.test.ts` reprovar a camada, ajuste para a que o teste apontar e diga no relatório.

- [ ] **Step 2: Escrever a página na forma fixa**

Forma de `docs/design/COMPONENTE-NOVO.md`, seção 4; modelo de controles em `src/app/designsystem/docs/presence-cursor.tsx`. `Usage` diz quando usar (levar a outro aparelho), quando não usar (link para a mesma tela) e quem usa: Configurações, uma tela. "Na tela": `QrCode` com `value="https://app.finance.com.br/settings#no-celular"` e `Interruptores` para "Copiar link" e "Esqueleto". Sem eixo, porque o dono não escolheu escada. `DocNote`s: por que a placa é clara; a margem de silêncio de 12px; por que o link só abre no toque. "No telefone" num `IphoneFrame`, mostrando que tocar abre. "Esqueleto". `PropsTable`s de `QrCode`, `QrCodeCopy` e `QrCodeSkeleton`.

- [ ] **Step 3: Atualizar o mapa e os registros**

Run: `npm run ds:docs-map && npx vitest run src/app/designsystem`
Expected: PASS, incluindo `taxonomy.test.ts` e `doc-pages.test.ts`.

O bullet do `AGENTS.md` traz: a placa clara por tokens, a margem de silêncio, `label` obrigatório, o link que só abre no toque, `QrCodeCopy` como peça solta e a rodada 355. A rodada 355 do histórico traz o levantamento, as escolhas do dono, a escolha do `uqr` e o que ficou de fora (escada, módulos arredondados, símbolo central, legenda).

- [ ] **Step 4: Commit**

```bash
git add src/app/designsystem/registry.ts src/app/designsystem/docs/qr-code.tsx AGENTS.md docs/design/HISTORICO-DESIGN-SYSTEM.md
git commit -m "docs(ds): página e registro do QrCode, rodada 355"
```

Inclua no `git add` os arquivos que `ds:docs-map` gerou.

### Task 3: Seção de Configurações

**Files:**
- Modify: `src/components/settings/theme-settings.tsx`
- Modify: `src/components/settings/settings-page.test.ts` (o caso "Este aparelho e IA e privacidade ficam em linhas…")

**Interfaces:**
- Consumes: `QrCode`, `QrCodeCopy` da Task 1; `SettingsSection` aceita `id`; `ROUTES` de `@/config/navigation`.

- [ ] **Step 1: Atualizar o teste**

No caso citado, troque as linhas de `aparelho` por:

```ts
for (const texto of [
    "useLancamentoInteligente", "SyncStatusChip", "InstallPwaSheet",
    "Neste celular", "No celular", 'id="no-celular"', "#no-celular",
    "Digite uma frase no + e o app preenche o resto.",
    "Abra o Finance no telefone", "QrCode", "QrCodeCopy",
    "pendingSyncCount",
]) expect(aparelho).toContain(texto)
expect(aparelho).not.toContain("Só tem efeito no telefone.")
expect(aparelho.match(/Vale só neste aparelho/g)).toHaveLength(2)
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/components/settings/settings-page.test.ts`
Expected: FAIL em "Neste celular".

- [ ] **Step 3: Implementar**

Aparência continua igual, e o tema não muda. A segunda `SettingsSection` passa a depender de `isMobile`.

Telefone:
- `<SettingsSection id="no-celular" titulo="Neste celular" alcance="Vale só neste aparelho.">`.
- `FormSwitch` ganha `description="Digite uma frase no + e o app preenche o resto."`.
- A linha "Instalar o app", o `SyncStatusChip` e o "Como instalar" ficam como estão.
- `InstallPwaSheet` fica neste ramo.

Desktop, do `md` para cima:
- `<SettingsSection titulo="No celular" alcance="Lance por frase e instale o app no telefone.">`, com um `Card padding="none"`.
- Dentro, `div` de `flex min-w-0 items-center justify-between gap-6 px-4 py-4`: à esquerda, `p` de `text-sm font-medium` "Abra o Finance no telefone", `Muted` "Aponte a câmera para o código. Lá você liga o lançamento inteligente e instala o app.", e `QrCodeCopy` em `mt-3`; à direita, `QrCode` com `label="Abrir o Finance no telefone"`.
- Com `shell && shell.pendingSyncCount > 0`, `Separator` e `SettingsRow titulo="Sincronização"` com `SyncStatusChip`. Com `!shell.isOnline`, a descrição é a frase de sem conexão que já existe.

O endereço vem de um `useSyncExternalStore` local (o servidor devolve `""`):

```ts
const origem = useSyncExternalStore(semAssinatura, () => window.location.origin, () => "")
const noTelefone = origem ? `${origem}${ROUTES.SETTINGS}#no-celular` : ""
```

Atualize o comentário de `ThemeSettings`: o lançamento inteligente só existe no telefone (`transaction-form-dialog.tsx`, `usarPaleta`), e no desktop a chave não faria nada, nem no celular, porque a preferência é do aparelho.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/components/settings/settings-page.test.ts && npx tsc --noEmit && npm run ds:audit -- src/components/settings/theme-settings.tsx`
Expected: PASS, sem erro de tipo, sem violação.

- [ ] **Step 5: Commit**

```bash
git add src/components/settings/theme-settings.tsx src/components/settings/settings-page.test.ts
git commit -m "feat(configuracoes): no desktop o QR leva ao telefone, e a seção vira Neste celular lá"
```

### Task 4: Jornadas e Atlas

**Files:**
- Modify: `docs/JORNADAS.md` (fluxograma de Configurações, por volta da linha 322)
- Modify: `docs/atlas/template.html`
- Modify: `docs/atlas/atlas-jornadas.html` (gerado)

- [ ] **Step 1: Atualizar o fluxograma**

Troque `settings --> pwa(["Instalar app: folha de instalação"])` por:

```
settings -->|"telefone"| pwa(["Neste celular: lançamento inteligente e instalar o app"])
settings -->|"desktop"| qr(["No celular: QR Code ou Copiar link"])
qr -->|"câmera do telefone"| settingsTel["/settings#no-celular no telefone"]
```

Ajuste a tabela de regras técnicas dessa jornada, se ela citar a seção. `href` não é id de nó válido.

- [ ] **Step 2: Atualizar o Atlas**

Em `template.html`: a explicação da mesma jornada e a data da capa, "1 nov 2026 · no desktop, Configurações leva ao telefone por um QR Code". Depois:

Run: `python3 docs/atlas/build.py`
Expected: `docs/atlas/atlas-jornadas.html` regerado, sem erro.

- [ ] **Step 3: Commit**

```bash
git add docs/JORNADAS.md docs/atlas/template.html docs/atlas/atlas-jornadas.html
git commit -m "docs(jornadas): QR Code de Configurações no desktop"
```

Quem publica o Atlas é o controlador, com a ferramenta de Artifact, depois da Task 4.
