# Jornada de acesso — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesenhar login, cadastro, recuperação de senha e convite com cenas-vitrine por tela, telas de status unificadas, reenviar com contagem, força da senha e `next` preservado — só com componentes.

**Architecture:** `AuthShell` ganha `scene` (o painel de marca passa a renderizar a cena recebida) e `media`; o `SplitShell` (DS) ganha `media` acima do título. Peças novas da camada do app em `src/components/auth/`; lógica pura em `src/lib/` e `src/hooks/`, testada com vitest.

**Tech Stack:** Next.js 16 (ver `node_modules/next/dist/docs/` antes de API de Next), React 19, Tailwind v4, Supabase JS, vitest (sem testing-library: testes de função pura e de fonte com `@/test/fonte`).

**Spec:** `docs/superpowers/specs/2026-10-12-jornada-de-acesso-design.md`

## Global Constraints

- Leia `AGENTS.md` antes de cada tarefa; ele vence este plano em caso de conflito.
- Zero literais de cor/medida (`#hex`, `rgb()`, `text-gray-*`, `p-[13px]`); só tokens e componentes do DS. Rode `npm run ds:audit -- <arquivos tocados>` antes de commitar.
- Ícones: só Heroicons; `16/solid` para `size-4`/sem tamanho, `20/solid` para `size-5`, `24/outline` para `size-6`+.
- Nenhum texto corrido direto sobre o campo de marca: o que se lê vive em `Card`.
- Botões: `Button` nasce `type="button"`; par de ações é `primary` + `tertiary`; não escreva `pendingLabel` que repita o verbo.
- Ids `#email` e `#password` do login são contrato (`e2e/auth.setup.ts`).
- Dinheiro: `MoneyDisplay`/`currencyBRL`. Toast: `@/lib/toast`, nunca `sonner`.
- `src/components/ui/` e `src/app/designsystem/` pedem confirmação do harness: só a Tarefa 3 os toca (aprovado pelo dono).
- **O dev usa o Supabase de produção**: nenhuma verificação no preview pode enviar formulário que crie conta, envie e-mail ou troque senha.
- Copy em português, frase em caixa normal, verbo no botão; a ação mantém o nome do botão ao resultado ("Reenviar código" → toast "Código reenviado").
- Verificação de cada tarefa: `npx tsc --noEmit && npm run lint && npm run test:unit`.

## Review Focus

- `?next=` malicioso (`//evil.com`, `https://…`) na recuperação: tem de cair no padrão — coberto em Tarefa 6 por teste de `recoveryLinks`.
- Contagem de reenviar com 0 s / segundos > 60 / negativos: `formatCooldown` não pode exibir `-0:01` nem `0:60` — Tarefa 2.
- Senha vazia: força `0`, barra não aparece; senha com caractere fora da lista de símbolos (ex. `_`) não conta como símbolo — Tarefa 1.
- Telefone com teclado aberto: só o wordmark aparece e o formulário cabe — verificação visual na Tarefa 8.
- Reenvio que falha (limite de taxa): mensagem em português (já tratada em `src/lib/supabase-errors.ts:278`) e contagem preservada — Tarefa 2 (o `onResend` que rejeita não reinicia a contagem).

---

### Task 1: Força da senha

**Files:**
- Modify: `src/lib/password-policy.ts`
- Create: `src/lib/password-policy.test.ts`
- Modify: `src/components/auth/password-requirements.tsx`

**Interfaces:**
- Produces: `passwordStrength(password: string): { score: number; tone: "destructive" | "warning" | "success" }` em `@/lib/password-policy`; `<PasswordRequirements password />` passa a desenhar barra + checklist.

- [ ] **Step 1: Teste que falha** — `src/lib/password-policy.test.ts`

```ts
import { describe, expect, it } from "vitest"
import { PASSWORD_RULES, failedPasswordRules, passwordStrength } from "./password-policy"

describe("a força da senha", () => {
  it("conta as regras cumpridas", () => {
    expect(passwordStrength("").score).toBe(0)
    expect(passwordStrength("abc").score).toBe(1)
    expect(passwordStrength("Abcdefg1!").score).toBe(PASSWORD_RULES.length)
  })

  it("tom pela nota: < 3 destrutivo, 3–4 aviso, 5 sucesso", () => {
    expect(passwordStrength("ab").tone).toBe("destructive")
    expect(passwordStrength("Abc1").tone).toBe("warning")
    expect(passwordStrength("Abcdefg1").tone).toBe("warning")
    expect(passwordStrength("Abcdefg1!").tone).toBe("success")
  })

  it("um símbolo fora da lista não conta", () => {
    expect(failedPasswordRules("Abcdefg1_").map((r) => r.id)).toEqual(["symbol"])
  })
})
```

- [ ] **Step 2:** `npx vitest run src/lib/password-policy.test.ts` → FAIL (`passwordStrength` não existe).

- [ ] **Step 3: Implementar** — em `src/lib/password-policy.ts`, depois de `failedPasswordRules`:

```ts
export type PasswordStrengthTone = "destructive" | "warning" | "success"

/** Quantas regras a senha cumpre, e o tom da barra: a régua é a política. */
export function passwordStrength(password: string): { score: number; tone: PasswordStrengthTone } {
    const score = PASSWORD_RULES.length - failedPasswordRules(password).length
    const tone: PasswordStrengthTone =
        score === PASSWORD_RULES.length ? "success" : score >= 3 ? "warning" : "destructive"
    return { score, tone }
}
```

- [ ] **Step 4:** Rodar o teste → PASS.

- [ ] **Step 5: Barra no `PasswordRequirements`.** Substituir o corpo por (o checklist riscando o cumprido é o `met` do `FieldChecklist`; confira em `/designsystem/field` como ele desenha o cumprido):

```tsx
"use client"

import { FieldChecklist } from "@/components/ui/field"
import { Progress } from "@/components/ui/progress"
import { PASSWORD_RULES, passwordStrength } from "@/lib/password-policy"

const ROTULO = { destructive: "fraca", warning: "quase lá", success: "forte" } as const

/**
 * A força da senha e a lista viva de regras. A barra é a mesma régua do
 * checklist (`passwordStrength` conta as regras cumpridas), então as duas
 * nunca discordam. Serve cadastro, redefinição e o diálogo de trocar senha.
 */
export function PasswordRequirements({ password }: { password: string }) {
    if (!password) return null
    const { score, tone } = passwordStrength(password)

    return (
        <div className="mt-1 flex flex-col gap-3">
            <Progress
                size="sm"
                value={score}
                max={PASSWORD_RULES.length}
                tone={tone}
                aria-label={`Força da senha: ${ROTULO[tone]}`}
            />
            <FieldChecklist
                title="Requisitos da senha"
                items={PASSWORD_RULES.map((rule) => ({
                    id: rule.id,
                    label: rule.label,
                    met: rule.test(password),
                }))}
            />
        </div>
    )
}
```

- [ ] **Step 6:** Nos três consumidores (`signup-form.tsx`, `password-recovery-form.tsx`, e o diálogo que `grep -rn PasswordRequirements src` mostrar), troque a condição `!fieldError && !isPasswordValid(password)` por `!fieldError` — a lista fica visível enquanto se digita, inclusive quando todas as regras já foram cumpridas (a barra verde é a confirmação). Remova o import de `isPasswordValid` onde ficar sem uso.

- [ ] **Step 7:** `npx tsc --noEmit && npm run lint && npm run test:unit && npm run ds:audit -- src/components/auth`

- [ ] **Step 8: Commit**

```bash
git add src/lib/password-policy.ts src/lib/password-policy.test.ts src/components/auth/password-requirements.tsx src/components
git commit -m "feat(auth): barra de força da senha sobre a mesma régua do checklist"
```

---

### Task 2: Reenviar com contagem

**Files:**
- Create: `src/hooks/use-cooldown.ts`, `src/hooks/use-cooldown.test.ts`
- Create: `src/components/auth/resend-button.tsx`

**Interfaces:**
- Produces: `formatCooldown(seconds: number): string` e `useCooldown(seconds: number): { remaining: number; restart: () => void }` em `@/hooks/use-cooldown`; `<ResendButton seconds?={60} onResend={() => Promise<void>} successMessage label />` em `@/components/auth/resend-button`. `onResend` **lança** em erro.

- [ ] **Step 1: Teste que falha** — `src/hooks/use-cooldown.test.ts`

```ts
import { describe, expect, it } from "vitest"
import { formatCooldown } from "./use-cooldown"

describe("a contagem do reenviar", () => {
  it("minutos e segundos com dois dígitos", () => {
    expect(formatCooldown(60)).toBe("1:00")
    expect(formatCooldown(42)).toBe("0:42")
    expect(formatCooldown(5)).toBe("0:05")
  })

  it("nunca negativa nem fracionada", () => {
    expect(formatCooldown(0)).toBe("0:00")
    expect(formatCooldown(-3)).toBe("0:00")
    expect(formatCooldown(9.4)).toBe("0:10")
  })
})
```

- [ ] **Step 2:** `npx vitest run src/hooks/use-cooldown.test.ts` → FAIL.

- [ ] **Step 3: Implementar** — `src/hooks/use-cooldown.ts`

```ts
"use client"

import { useCallback, useEffect, useState } from "react"

export function formatCooldown(seconds: number): string {
    const s = Math.max(0, Math.ceil(seconds))
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
}

/**
 * Uma contagem regressiva que começa ao montar. `restart` a recomeça (depois
 * de um reenvio que deu certo). Um intervalo de 1 s só enquanto conta.
 */
export function useCooldown(seconds: number) {
    const [remaining, setRemaining] = useState(seconds)

    useEffect(() => {
        if (remaining <= 0) return
        const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000)
        return () => clearInterval(id)
    }, [remaining > 0]) // eslint-disable-line react-hooks/exhaustive-deps

    const restart = useCallback(() => setRemaining(seconds), [seconds])
    return { remaining, restart }
}
```

Se o lint reclamar da dependência booleana, troque por um `const counting = remaining > 0` acima do efeito e use `[counting]`.

- [ ] **Step 4:** Rodar o teste → PASS.

- [ ] **Step 5: `ResendButton`** — `src/components/auth/resend-button.tsx`

```tsx
"use client"

import { useState } from "react"

import { Alert, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { formatCooldown, useCooldown } from "@/hooks/use-cooldown"
import { toastSuccess } from "@/lib/toast"
import { formatAuthErrorMessagePt } from "@/lib/supabase-errors"

/**
 * Reenviar o código ou o e-mail, liberado depois da contagem. A contagem
 * começa ao entrar no passo (o envio acabou de acontecer). Um reenvio que
 * falha mostra o erro no lugar e **não** zera a contagem — pedir de novo na
 * hora só esbarraria no limite de taxa outra vez.
 */
export function ResendButton({
    label,
    successMessage,
    onResend,
    seconds = 60,
}: {
    label: string
    successMessage: string
    /** Lança em erro (a mensagem crua do Supabase). */
    onResend: () => Promise<void>
    seconds?: number
}) {
    const { remaining, restart } = useCooldown(seconds)
    const [pending, setPending] = useState(false)
    const [error, setError] = useState("")

    const resend = async () => {
        setError("")
        setPending(true)
        try {
            await onResend()
            toastSuccess(successMessage)
            restart()
        } catch (e) {
            setError(formatAuthErrorMessagePt(e instanceof Error ? e.message : String(e)))
        } finally {
            setPending(false)
        }
    }

    return (
        <div className="flex flex-col gap-3">
            {error ? (
                <Alert tone="destructive">
                    <AlertTitle>{error}</AlertTitle>
                </Alert>
            ) : null}
            <Button
                variant="tertiary"
                size="xl"
                className="w-full"
                disabled={remaining > 0 || pending}
                aria-busy={pending || undefined}
                onClick={resend}
            >
                {remaining > 0 ? `${label} em ${formatCooldown(remaining)}` : label}
            </Button>
        </div>
    )
}
```

Confira em `/designsystem/button` se o `Button` tem `pending` próprio; se tiver, use-o no lugar de `disabled`/`aria-busy` manuais.

- [ ] **Step 6:** `npx tsc --noEmit && npm run lint && npm run test:unit && npm run ds:audit -- src/components/auth src/hooks/use-cooldown.ts`

- [ ] **Step 7: Commit**

```bash
git add src/hooks/use-cooldown.ts src/hooks/use-cooldown.test.ts src/components/auth/resend-button.tsx
git commit -m "feat(auth): reenviar com contagem de 60 s"
```

---

### Task 3: `SplitShell media` (design system — aprovado)

**Files:**
- Modify: `src/components/ui/split-shell.tsx` (o `<header>` em ~l.172)
- Modify: `src/components/ui/split-shell-versions.test.ts`
- Modify: `src/app/designsystem/docs/split-shell.tsx`
- Modify: `AGENTS.md` (bullet do `SplitShell`), `docs/design/HISTORICO-DESIGN-SYSTEM.md` (rodada nova)

**Interfaces:**
- Produces: `SplitShell` aceita `media?: React.ReactNode`, desenhado acima do `<H1>` dentro do `<header>`, num `<div data-slot="split-shell-media">`.

- [ ] **Step 1: Teste que falha** — acrescente em `split-shell-versions.test.ts`, dentro de `describe("as peças", …)`:

```ts
  it("a mídia acima do título, dentro do cabeçalho", () => {
    expect(CODIGO).toContain("media?: React.ReactNode")
    expect(CODIGO).toContain('data-slot="split-shell-media"')
    expect(CODIGO.indexOf('data-slot="split-shell-media"')).toBeLessThan(CODIGO.indexOf("<H1 ref={titulo}"))
  })
```

- [ ] **Step 2:** `npx vitest run src/components/ui/split-shell-versions.test.ts` → FAIL.

- [ ] **Step 3: Implementar.** Na desestruturação acrescente `media,`; no tipo, depois de `description`:

```ts
  /** O ícone acima do título (status: confira seu e-mail, senha atualizada). */
  media?: React.ReactNode
```

E o `<header>` fica:

```tsx
                <header>
                  {media ? (
                    <div data-slot="split-shell-media" className="mb-5 flex">
                      {media}
                    </div>
                  ) : null}
                  <H1 ref={titulo} tabIndex={-1} className="outline-none">
                    {title}
                  </H1>
                  {description ? <Muted>{description}</Muted> : null}
                </header>
```

- [ ] **Step 4:** Rodar o teste → PASS.

- [ ] **Step 5: Página do catálogo.** Em `src/app/designsystem/docs/split-shell.tsx`, no mostrador "Na tela": acrescente um `Toggle` fantasma em `Interruptores` ("Mídia", sem o nome da prop à vista) que, ligado, passa `media={<EmptyStateIcon variant="done" className="[--empty-state-icon:--spacing(12)]" />}` e troca o título para "Senha atualizada"; uma nota curta abaixo dizendo que a mídia é o ícone de status acima do título e que o foco do `step` continua no título. Acrescente a linha `media` na `PropsTable` do `SplitShell`. Siga a forma de `doc-pages.test.ts`.

- [ ] **Step 6: Registro.** `npm run ds:docs-map`. No `AGENTS.md`, bullet do `SplitShell` (seção "Listas, tabelas e navegação"): acrescente `media` (o ícone de status acima do título) à lista de props. Em `docs/design/HISTORICO-DESIGN-SYSTEM.md`, uma rodada nova (próximo número depois da última) com: o que mudou, por quê (as telas de status da jornada de acesso), quem consome (as telas de acesso).

- [ ] **Step 7:** `npx tsc --noEmit && npm run lint && npm run test:unit`

- [ ] **Step 8: Commit**

```bash
git add src/components/ui/split-shell.tsx src/components/ui/split-shell-versions.test.ts src/app/designsystem AGENTS.md docs/design/HISTORICO-DESIGN-SYSTEM.md
git commit -m "feat(split-shell): media acima do título"
```

---

### Task 4: `AuthShell` com cena, `AuthStatus` e a cena do login

**Files:**
- Modify: `src/components/layout/auth-shell.tsx`, `src/components/layout/auth-brand-panel.tsx`
- Create: `src/components/auth/auth-status.tsx`, `src/components/auth/scenes/login-scene.tsx`
- Create: `src/components/auth/auth-shell.test.ts`
- Modify: `src/components/login-form.tsx`, `src/app/(auth)/login/page.tsx`, `src/app/(auth)/register/page.tsx`
- Modify: `src/components/ui/split-shell-versions.test.ts:45` se a asserção sobre `PAINEL` quebrar

**Interfaces:**
- Consumes: `SplitShell media` (Task 3).
- Produces:
  - `AuthShell({ title, description?, back?, footer?, step?, scene, media?, children })` — `scene: ReactNode` **obrigatório**.
  - `AuthBrandPanel({ children }: { children: ReactNode })`.
  - `AuthStatus({ title, description, icon?: "mail" | "done" | "expired" | "invite", scene, step?, footer?, children })` — `children` são as ações.
  - `LoginScene()` (sem props).
  - Todos os chamadores de `AuthShell` nas Tarefas 5–7 passam `scene`.

- [ ] **Step 1: Teste de fonte que falha** — `src/components/auth/auth-shell.test.ts`

```ts
import { describe, expect, it } from "vitest"
import { arquivosTsx, lerFonte, semComentarios } from "@/test/fonte"

const fonte = (c: string) => semComentarios(lerFonte(c), "linha-inteira")

describe("o casco das telas de acesso", () => {
  it("no telefone, só o wordmark", () => {
    expect(fonte("src/components/layout/auth-shell.tsx")).toContain('asideMobile="logo"')
  })

  it("o painel desenha a cena que recebe, e não uma fixa", () => {
    const painel = fonte("src/components/layout/auth-brand-panel.tsx")
    expect(painel).toContain("{children}")
    expect(painel).not.toContain("const SALDO")
  })

  it("as cenas só compõem o design system: nenhuma cor crua", () => {
    for (const arq of arquivosTsx("src/components/auth/scenes")) {
      expect(fonte(arq)).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(|oklch\(|(?:text|bg)-(?:gray|zinc|slate|neutral|green|red)-\d/)
    }
  })
})
```

Confira a assinatura real de `arquivosTsx` em `src/test/fonte.ts` (pode receber pasta e devolver caminhos absolutos ou relativos) e ajuste a chamada.

- [ ] **Step 2:** `npx vitest run src/components/auth/auth-shell.test.ts` → FAIL.

- [ ] **Step 3: `AuthBrandPanel` recebe a cena.** Reescreva `auth-brand-panel.tsx` mantendo o comentário de topo (atualizado: o painel agora hospeda a cena de cada tela) e removendo `SALDO`, `AREAS` e os cartões:

```tsx
import type { ReactNode } from "react"

import { AppWordmark } from "@/components/layout/app-wordmark"
import { SplitShellAside } from "@/components/ui/split-shell"

export function AuthBrandPanel({ children }: { children: ReactNode }) {
    return (
        <SplitShellAside
            surface="brand"
            brand={<AppWordmark size="lg" />}
            logo={<AppWordmark size="md" rainbow />}
        >
            {children}
        </SplitShellAside>
    )
}
```

(Confirme os nomes de `size` aceitos em `app-wordmark.tsx`.)

- [ ] **Step 4: `AuthShell`** — acrescente `scene: ReactNode` e `media?: ReactNode` às props, e:

```tsx
        <SplitShell
            aside={<AuthBrandPanel>{scene}</AuthBrandPanel>}
            asideMobile="logo"
            media={media}
            title={title}
            description={description}
            back={back}
            footer={footer}
            step={step}
        >
```

- [ ] **Step 5: `LoginScene`** — `src/components/auth/scenes/login-scene.tsx`. "Seu mês de relance": o saldo com a faísca do mês e as próximas contas. Entrada única em cascata (`stagger-ladder` + `rise`, ver `globals.css`; zerada no movimento reduzido pelas próprias utilities).

```tsx
import { BanknotesIcon, BoltIcon, CreditCardIcon, HomeModernIcon } from "@heroicons/react/16/solid"

import { Badge } from "@/components/ui/badge"
import { Card, CardNote, CardToolbar } from "@/components/ui/card"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import { MoneyDisplay } from "@/components/ui/money-display"
import {
    StatCard,
    StatCardChart,
    StatCardHeader,
    StatCardIcon,
    StatCardLabel,
    StatCardValue,
} from "@/components/ui/stat-card"

/** Números de exemplo, autorados com fidelidade; nenhuma alegação comercial. */
const SALDO = [
    { dia: 1, saldo: 3120 }, { dia: 5, saldo: 2890 }, { dia: 10, saldo: 4410 },
    { dia: 15, saldo: 3980 }, { dia: 20, saldo: 4630 }, { dia: 25, saldo: 4182.6 },
]

const PROXIMAS = [
    { icon: CreditCardIcon, titulo: "Fatura do cartão", quando: "vence amanhã", valor: 1284.6, urgente: true },
    { icon: HomeModernIcon, titulo: "Aluguel", quando: "em 4 dias", valor: 2150 },
    { icon: BoltIcon, titulo: "Energia", quando: "em 9 dias", valor: 186.4 },
] as const

/** A cena do login: o mês de quem volta, de relance. */
export function LoginScene() {
    return (
        <div className="stagger-ladder flex flex-col gap-4">
            <StatCard size="lg" tone="income" className="animate-rise">
                <StatCardHeader>
                    <StatCardLabel>
                        <StatCardIcon>
                            <BanknotesIcon />
                        </StatCardIcon>
                        Saldo de outubro
                    </StatCardLabel>
                </StatCardHeader>
                <StatCardValue value={SALDO.at(-1)!.saldo} />
                <StatCardChart data={SALDO} y="saldo" label="Saldo" variant="area" />
            </StatCard>
            <Card variant="elevated" padding="none" className="animate-rise">
                <CardToolbar variant="title">Próximas contas</CardToolbar>
                <ItemGroup variant="divided">
                    {PROXIMAS.map(({ icon: Icon, titulo, quando, valor, ...p }) => (
                        <Item key={titulo} size="md">
                            <ItemMedia variant="icon"><Icon /></ItemMedia>
                            <ItemContent>
                                <ItemTitle>{titulo}</ItemTitle>
                                <ItemDescription>{quando}</ItemDescription>
                            </ItemContent>
                            <ItemActions>
                                {"urgente" in p ? <Badge tone="warning" size="xs">amanhã</Badge> : null}
                                <MoneyDisplay value={valor} size="md" />
                            </ItemActions>
                        </Item>
                    ))}
                </ItemGroup>
                <CardNote>Números de exemplo.</CardNote>
            </Card>
        </div>
    )
}
```

**Antes de escrever, abra `/designsystem/stat-card`, `/designsystem/item`, `/designsystem/badge` e o `globals.css`** e ajuste nomes que divergirem: a classe da subida pode não ser `animate-rise` (procure o `@keyframes rise` e quem o usa com `stagger-ladder`); o `Badge` "amanhã" repete o `quando` — se ficar redundante na tela, tire o `quando` da linha urgente e deixe só o selo. Se `StatCardValue` já formatar dinheiro por padrão, ótimo; senão use `format` conforme a página.

- [ ] **Step 6: `AuthStatus`** — `src/components/auth/auth-status.tsx`

```tsx
import type { ReactNode } from "react"
import { EnvelopeIcon, ExclamationTriangleIcon, UserGroupIcon } from "@heroicons/react/24/outline"

import { AuthShell } from "@/components/layout/auth-shell"
import { EmptyStateIcon } from "@/components/ui/empty-state"

const ICONE = {
    mail: <EmptyStateIcon className="[--empty-state-icon:--spacing(12)]"><EnvelopeIcon /></EmptyStateIcon>,
    done: <EmptyStateIcon variant="done" className="[--empty-state-icon:--spacing(12)]" />,
    expired: <EmptyStateIcon tone="warning" className="[--empty-state-icon:--spacing(12)]"><ExclamationTriangleIcon /></EmptyStateIcon>,
    invite: <EmptyStateIcon className="[--empty-state-icon:--spacing(12)]"><UserGroupIcon /></EmptyStateIcon>,
} as const

/**
 * A tela de status da jornada de acesso: um ícone, o que aconteceu, o que
 * fazer agora. Confira seu e-mail, senha atualizada, link expirado e convite
 * aceito têm a mesma forma — antes cada um era um arranjo.
 */
export function AuthStatus({
    title,
    description,
    icon = "mail",
    scene,
    step,
    footer,
    children,
}: {
    title: string
    description: ReactNode
    icon?: keyof typeof ICONE
    scene: ReactNode
    step?: string
    footer?: ReactNode
    /** As ações: a primária primeiro, a `tertiary` depois. */
    children?: ReactNode
}) {
    return (
        <AuthShell
            title={title}
            description={description}
            media={ICONE[icon]}
            scene={scene}
            step={step ?? title}
            footer={footer}
        >
            {children ? <div className="flex flex-col gap-3">{children}</div> : null}
        </AuthShell>
    )
}
```

Confira os `tone` aceitos por `EmptyStateIcon` (`emptyStateIconVariants`); se `warning` não existir, use o mais próximo e anote no relatório. Se o tamanho por variável não pegar fora do `EmptyState`, reporte em vez de inventar medida.

- [ ] **Step 7: Login.** Em `login-form.tsx`: `scene={<LoginScene />}`; descrição "Bem-vindo de volta."; o link "Esqueceu a senha?" vira

```tsx
                            <Button asChild variant="link" size="sm">
                                <Link href={forgotHref}>Esqueceu a senha?</Link>
                            </Button>
```

(remova o comentário que justificava a classe à mão; confirme em `/designsystem/button` o degrau que alinha com o rótulo). Nos fallbacks de `login/page.tsx` e `register/page.tsx`, passe `scene={<LoginScene />}` e `scene={<RegisterScene />}` — **a `RegisterScene` nasce na Tarefa 5**; até lá use `LoginScene` no register e anote no relatório para a Tarefa 5 trocar.

- [ ] **Step 8:** Todo outro chamador de `AuthShell` (`grep -rn "<AuthShell" src`) recebe `scene={<LoginScene />}` provisório para compilar; as Tarefas 5–7 trocam pela cena certa.

- [ ] **Step 9:** `npx vitest run src/components/auth src/components/ui/split-shell-versions.test.ts` → PASS (ajuste a asserção de `split-shell-versions.test.ts` que lia `PAINEL` só se ela exigir algo que saiu de propósito, como os cartões fixos; mantenha a que exige `SplitShellAside`).

- [ ] **Step 10:** `npx tsc --noEmit && npm run lint && npm run test:unit && npm run ds:audit -- src/components/auth src/components/layout/auth-shell.tsx src/components/layout/auth-brand-panel.tsx src/components/login-form.tsx`

- [ ] **Step 11: Commit**

```bash
git add src/components/auth src/components/layout/auth-shell.tsx src/components/layout/auth-brand-panel.tsx src/components/login-form.tsx "src/app/(auth)" src/components/ui/split-shell-versions.test.ts src/components
git commit -m "feat(auth): casco com cena por tela, AuthStatus e a cena do login"
```

---

### Task 5: Cadastro — cena, "Confira seu e-mail" com reenviar

**Files:**
- Create: `src/components/auth/scenes/register-scene.tsx`
- Modify: `src/components/signup-form.tsx`, `src/app/(auth)/register/page.tsx`

**Interfaces:**
- Consumes: `AuthShell scene`, `AuthStatus`, `ResendButton`, `PasswordRequirements`.
- Produces: `RegisterScene()`.

- [ ] **Step 1: `RegisterScene`** — o que a pessoa ganha: o mês dividido, um orçamento perto do limite, quem divide a casa.

```tsx
import { ScaleIcon } from "@heroicons/react/16/solid"

import { AvatarGroup, AvatarGroupItem } from "@/components/ui/avatar-group"
import { Card, CardContent, CardNote, CardToolbar } from "@/components/ui/card"
import { Progress, ProgressHeader, ProgressLabel, ProgressValue } from "@/components/ui/progress"
import { StatCard, StatCardHeader, StatCardIcon, StatCardLabel, StatCardSplit } from "@/components/ui/stat-card"
import { BUDGET_BANDS } from "@/lib/budget-bands"

const PESSOAS = [{ name: "Marina Costa" }, { name: "Rafael Lima" }, { name: "Você" }]

/** A cena do cadastro: o que a conta nova já faz. */
export function RegisterScene() {
    return (
        <div className="stagger-ladder flex flex-col gap-4">
            <StatCard size="md" className="animate-rise">
                <StatCardHeader>
                    <StatCardLabel>
                        <StatCardIcon><ScaleIcon /></StatCardIcon>
                        Outubro
                    </StatCardLabel>
                </StatCardHeader>
                <StatCardSplit
                    items={[
                        { label: "Entradas", value: 8432.15, tone: "income" },
                        { label: "Saídas", value: 6218.4, tone: "expense" },
                    ]}
                />
            </StatCard>
            <Card variant="elevated" className="animate-rise">
                <CardContent>
                    <Progress value={88} bands={BUDGET_BANDS} header={
                        <ProgressHeader>
                            <ProgressLabel>Mercado</ProgressLabel>
                            <ProgressValue>R$ 1.056 de R$ 1.200</ProgressValue>
                        </ProgressHeader>
                    } />
                </CardContent>
            </Card>
            <Card variant="elevated" padding="none" className="animate-rise">
                <CardToolbar variant="title">
                    Casa
                    <AvatarGroup label="Quem divide a carteira Casa" size="sm">
                        {PESSOAS.map((p) => <AvatarGroupItem key={p.name} name={p.name} />)}
                    </AvatarGroup>
                </CardToolbar>
                <CardNote>Números de exemplo.</CardNote>
            </Card>
        </div>
    )
}
```

**Abra antes** `src/lib/budget-bands.ts` (o nome real da constante de orçamento `[85, 100]`), `/designsystem/progress` (como `header` e `ProgressValue` recebem o texto; o valor em dinheiro deve sair de `currencyBRL`, não escrito à mão) e `/designsystem/stat-card` (os `tone` de `StatCardSplit`: `DIVISAO_COR`). Ajuste e use `currencyBRL` no `ProgressValue`.

- [ ] **Step 2: Formulário.** Em `signup-form.tsx`:
  - `scene={<RegisterScene />}` no `AuthShell` do formulário; descrição continua "A carteira pessoal e as categorias já vêm prontas.".
  - O bloco `if (success)` vira:

```tsx
    if (success) {
        return (
            <AuthStatus
                title="Confira seu e-mail"
                icon="mail"
                scene={<RegisterScene />}
                step="confirm"
                description={
                    <>
                        Enviamos um link para{" "}
                        <strong className="font-medium text-foreground">{email.trim()}</strong>. Abra-o para
                        ativar a conta.
                    </>
                }
                footer={
                    <SplitShellFooter>
                        <p>
                            Já confirmou? <Link href={loginHref}>Entrar</Link>
                        </p>
                    </SplitShellFooter>
                }
            >
                {nextPath ? (
                    <Alert tone="info">
                        <AlertTitle>
                            Depois de confirmar, você volta para concluir o convite.
                        </AlertTitle>
                    </Alert>
                ) : null}
                <ResendButton
                    label="Reenviar e-mail"
                    successMessage="E-mail reenviado"
                    onResend={async () => {
                        const { error } = await supabase.auth.resend({
                            type: "signup",
                            email: email.trim(),
                            options: { emailRedirectTo: redirectTo() },
                        })
                        if (error) throw new Error(error.message)
                    }}
                />
                <Button variant="tertiary" size="xl" className="w-full" onClick={() => setSuccess(false)}>
                    Usar outro e-mail
                </Button>
            </AuthStatus>
        )
    }
```

  - Extraia `const redirectTo = () => \`${window.location.origin}${nextPath ?? ROUTES.DASHBOARD}\`` e use-o no `signUp` e no `resend`.
  - Dois `tertiary` empilhados (reenviar e usar outro e-mail) são duas ações do mesmo peso — ok pela regra; o "Ir para o login" `secondary` some (vai ao rodapé como link).
- [ ] **Step 3:** No fallback de `register/page.tsx`, troque a `LoginScene` provisória por `<RegisterScene />`.
- [ ] **Step 4:** `npx tsc --noEmit && npm run lint && npm run test:unit && npm run ds:audit -- src/components/auth src/components/signup-form.tsx`
- [ ] **Step 5: Commit**

```bash
git add src/components/auth/scenes/register-scene.tsx src/components/signup-form.tsx "src/app/(auth)/register/page.tsx"
git commit -m "feat(auth): cadastro com cena própria e 'Confira seu e-mail' com reenviar"
```

---

### Task 6: Recuperação — timeline ao vivo, reenviar, `next`, status

**Files:**
- Create: `src/components/auth/scenes/recovery-scene.tsx`
- Create: `src/lib/recovery-links.ts`, `src/lib/recovery-links.test.ts`
- Modify: `src/components/password-recovery-form.tsx`

**Interfaces:**
- Consumes: `AuthShell scene`, `AuthStatus`, `ResendButton`, `getSafeInternalNextPath` (`@/lib/auth-return-path`), `ROUTES`.
- Produces: `RecoveryScene({ step }: { step: "email" | "code" | "password" | "done" })`; `recoveryLinks(next: string | null | undefined): { login: string; loginUpdated: string; forgot: string; resetPath: string }`.

- [ ] **Step 1: Teste que falha** — `src/lib/recovery-links.test.ts`

```ts
import { describe, expect, it } from "vitest"
import { recoveryLinks } from "./recovery-links"

describe("os links da recuperação carregam o next", () => {
  it("sem next, os destinos de sempre", () => {
    expect(recoveryLinks(null)).toEqual({
      login: "/login",
      loginUpdated: "/login?reason=password-updated",
      forgot: "/forgot-password",
      resetPath: "/reset-password",
    })
  })

  it("com next interno, ele atravessa", () => {
    const l = recoveryLinks("/invites/accept?token=abc")
    const n = encodeURIComponent("/invites/accept?token=abc")
    expect(l.login).toBe(`/login?next=${n}`)
    expect(l.loginUpdated).toBe(`/login?reason=password-updated&next=${n}`)
    expect(l.forgot).toBe(`/forgot-password?next=${n}`)
    expect(l.resetPath).toBe(`/reset-password?next=${n}`)
  })

  it("next de fora é descartado", () => {
    expect(recoveryLinks("//evil.com").login).toBe("/login")
    expect(recoveryLinks("https://evil.com").forgot).toBe("/forgot-password")
  })
})
```

- [ ] **Step 2:** `npx vitest run src/lib/recovery-links.test.ts` → FAIL.

- [ ] **Step 3: Implementar** — `src/lib/recovery-links.ts`

```ts
import { ROUTES } from "@/config/navigation"
import { getSafeInternalNextPath } from "@/lib/auth-return-path"

/** Os destinos da recuperação de senha, com o `next` seguro atravessando todos. */
export function recoveryLinks(next: string | null | undefined) {
    const safe = getSafeInternalNextPath(next ?? null)
    const q = safe ? `next=${encodeURIComponent(safe)}` : ""
    const com = (path: string, extra?: string) => {
        const params = [extra, q].filter(Boolean).join("&")
        return params ? `${path}?${params}` : path
    }
    return {
        login: com(ROUTES.LOGIN),
        loginUpdated: com(ROUTES.LOGIN, "reason=password-updated"),
        forgot: com(ROUTES.FORGOT_PASSWORD),
        resetPath: com(ROUTES.RESET_PASSWORD),
    }
}
```

Confirme a assinatura de `getSafeInternalNextPath` (aceita `null`? devolve `null` ou `undefined` para inválido?) e ajuste.

- [ ] **Step 4:** Rodar o teste → PASS.

- [ ] **Step 5: `RecoveryScene`** — a timeline que anda com a pessoa:

```tsx
import { Card, CardToolbar, CardContent } from "@/components/ui/card"
import { Timeline, TimelineDescription, TimelineItem, TimelineTitle } from "@/components/ui/timeline"

type Step = "email" | "code" | "password" | "done"

const PASSOS = [
    { id: "email", titulo: "Código enviado", desc: "Seis dígitos no seu e-mail." },
    { id: "code", titulo: "Código conferido", desc: "Só quem tem acesso ao e-mail chega aqui." },
    { id: "password", titulo: "Nova senha", desc: "As sessões antigas são encerradas." },
] as const

const ORDEM: Step[] = ["email", "code", "password", "done"]

/**
 * A cena da recuperação: a mesma sequência do formulário, ao vivo. O passo
 * atual é `current`, os anteriores `done`. É a peça que se mexe nesta
 * jornada — o resto das cenas fica parado depois da entrada.
 */
export function RecoveryScene({ step }: { step: Step }) {
    const atual = ORDEM.indexOf(step)
    return (
        <Card variant="elevated" padding="none" className="animate-rise">
            <CardToolbar variant="title">Recuperar o acesso</CardToolbar>
            <CardContent>
                <Timeline aria-label="Passos da recuperação">
                    {PASSOS.map((p, i) => (
                        <TimelineItem
                            key={p.id}
                            state={i < atual ? "done" : i === atual ? "current" : "upcoming"}
                        >
                            <TimelineTitle>{p.titulo}</TimelineTitle>
                            <TimelineDescription>{p.desc}</TimelineDescription>
                        </TimelineItem>
                    ))}
                </Timeline>
            </CardContent>
        </Card>
    )
}
```

Os índices: no passo `email` o item 0 ("Código enviado") é `current` — o envio ainda vai acontecer; em `code`, 0 é `done` e 1 `current`; em `done`, os três `done`. Confira em `/designsystem/timeline` se o `Timeline` aceita `aria-label`, o `size` para caber no cartão e se o `state` precisa de `marker`.

- [ ] **Step 6: Formulário.** Em `password-recovery-form.tsx`:
  - Leia o `next`: `const searchParams = useSearchParams()` e `const links = useMemo(() => recoveryLinks(searchParams.get("next")), [searchParams])`. **`useSearchParams` exige `<Suspense>`**: envolva o `<PasswordRecoveryForm />` em `forgot-password/page.tsx` e `reset-password/page.tsx` com `<Suspense fallback={<AuthShell title="Recuperar senha" scene={<RecoveryScene step="email" />}><AuthFormSkeleton fields={1} /></AuthShell>}>` (siga o padrão de `login/page.tsx`; leia `node_modules/next/dist/docs/` sobre `useSearchParams` se houver dúvida).
  - `redirectTo: \`${window.location.origin}${links.resetPath}\`` no `resetPasswordForEmail`.
  - Extraia o envio para `const requestCode = async (address: string) => supabase.auth.resetPasswordForEmail(address, { redirectTo: … })`, usado por `sendCode` e pelo reenviar.
  - Todo `AuthShell` recebe `scene={<RecoveryScene step={step} />}`.
  - Passo `code`: troque o `Button` "Usar outro e-mail" por

```tsx
                <ResendButton
                    label="Reenviar código"
                    successMessage="Código reenviado"
                    onResend={async () => {
                        const { error } = await requestCode(email.trim())
                        if (error) throw new Error(error.message)
                    }}
                />
                <Button variant="tertiary" size="xl" className="w-full" onClick={() => { setStep("email"); setCode(""); setError(""); setFieldError(undefined) }}>
                    Usar outro e-mail
                </Button>
```

    e tire o `pendingLabel="Conferindo…"` só se o `FormSubmit` já derivar "Continuando…" — "Conferindo…" diz algo diferente do verbo, então **mantenha-o**.
  - "Link expirado" vira `AuthStatus icon="expired" title="Link expirado" description="Este link de recuperação não vale mais. Peça um código novo." scene={<RecoveryScene step="email" />}` com `<Button asChild size="xl" className="w-full"><Link href={links.forgot}>Pedir novo código</Link></Button>` e o rodapé "Lembrou a senha? Entrar" com `links.login`.
  - "Senha atualizada" vira `AuthStatus icon="done" title="Senha atualizada" description="Entre com a senha nova. Levando você ao login…" scene={<RecoveryScene step="done" />}` com `<Button asChild size="xl" className="w-full"><Link href={links.loginUpdated}>Entrar agora</Link></Button>`; o `later(...)` usa `router.push(links.loginUpdated)`.
  - Rodapés "Lembrou a senha? Entrar" usam `links.login`.
  - O esqueleto de `linkValid === null` recebe `scene={<RecoveryScene step="password" />}`.
- [ ] **Step 7:** `npx tsc --noEmit && npm run lint && npm run test:unit && npm run ds:audit -- src/components/auth src/components/password-recovery-form.tsx src/lib/recovery-links.ts "src/app/(auth)"`
- [ ] **Step 8: Commit**

```bash
git add src/components/auth/scenes/recovery-scene.tsx src/lib/recovery-links.ts src/lib/recovery-links.test.ts src/components/password-recovery-form.tsx "src/app/(auth)"
git commit -m "feat(auth): recuperação com timeline ao vivo, reenviar código e next preservado"
```

---

### Task 7: Convite — cena, carregamento no casco, status aceito

**Files:**
- Create: `src/components/auth/scenes/invite-scene.tsx`
- Modify: `src/app/(auth)/invites/accept/page.tsx`, `src/app/(auth)/invites/accept/page-client.tsx`

**Interfaces:**
- Consumes: `AuthShell scene`, `AuthFormSkeleton`, `AuthStatus`.
- Produces: `InviteScene()`.

- [ ] **Step 1: Ler** `page-client.tsx` inteiro (215 linhas) e anotar: os estados (gate sem usuário, aceitando, erro, aceito → para onde vai e quando), o par de botões em `div` (~l.143).
- [ ] **Step 2: `InviteScene`** — o espaço compartilhado, genérico (o nome real do workspace não é conhecido antes de aceitar):

```tsx
import { HomeModernIcon, ShoppingCartIcon, WifiIcon } from "@heroicons/react/16/solid"

import { AvatarGroup, AvatarGroupItem } from "@/components/ui/avatar-group"
import { Card, CardNote, CardToolbar } from "@/components/ui/card"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import { MoneyDisplay } from "@/components/ui/money-display"

const DIVIDIDO = [
    { icon: HomeModernIcon, titulo: "Aluguel", detalhe: "dividido em 2", valor: 1075 },
    { icon: ShoppingCartIcon, titulo: "Mercado", detalhe: "quem pagou anota", valor: 412.3 },
    { icon: WifiIcon, titulo: "Internet", detalhe: "todo dia 10", valor: 59.95 },
] as const

/** A cena do convite: uma carteira dividida, do jeito que ela vai ficar. */
export function InviteScene() {
    return (
        <Card variant="elevated" padding="none" className="animate-rise">
            <CardToolbar variant="title">
                Carteira compartilhada
                <AvatarGroup label="Quem já está na carteira" size="sm">
                    <AvatarGroupItem name="Marina Costa" />
                    <AvatarGroupItem name="Rafael Lima" />
                </AvatarGroup>
            </CardToolbar>
            <ItemGroup variant="divided">
                {DIVIDIDO.map(({ icon: Icon, titulo, detalhe, valor }) => (
                    <Item key={titulo} size="md">
                        <ItemMedia variant="icon"><Icon /></ItemMedia>
                        <ItemContent>
                            <ItemTitle>{titulo}</ItemTitle>
                            <ItemDescription>{detalhe}</ItemDescription>
                        </ItemContent>
                        <ItemActions><MoneyDisplay value={valor} size="md" /></ItemActions>
                    </Item>
                ))}
            </ItemGroup>
            <CardNote>Números de exemplo.</CardNote>
        </Card>
    )
}
```

(O `ColorTile` da spec fica de fora: a cor do workspace não é conhecida aqui, e `ColorTile` é para cor escolhida pela pessoa — usar uma cor de tema nele contraria o `AGENTS.md`.)
- [ ] **Step 3: Fallback.** Em `page.tsx`, troque `Container` > `Card` > `<p>` por

```tsx
<AuthShell title="Convite" scene={<InviteScene />}>
    <div role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">Carregando o convite…</span>
        <AuthFormSkeleton fields={1} />
    </div>
</AuthShell>
```

  e remova imports órfãos.
- [ ] **Step 4: Cliente.** Todo `AuthShell` recebe `scene={<InviteScene />}`. O par de botões em `div flex … sm:flex-row` vira os dois `Button` empilhados `w-full size="xl"`, `primary` primeiro e `tertiary` depois, dentro de `<div className="flex flex-col gap-3">` (a mesma forma do `AuthStatus`; se o par é do gate sem usuário — "Entrar" / "Criar conta" — use `AuthStatus icon="invite"` para o gate). Quando aceito: mostre `AuthStatus icon="done" title="Convite aceito" description={<>Você entrou em <strong className="font-medium text-foreground">{nome}</strong>.</>}` com `<Button asChild size="xl" className="w-full"><Link href={destino}>Abrir a carteira</Link></Button>`, **mantendo o destino atual** e o redirecionamento automático que já existir (se hoje redireciona na hora, passe a redirecionar depois de 2 s com `useTimeout`, e o botão serve quem não quer esperar).
- [ ] **Step 5:** `npx tsc --noEmit && npm run lint && npm run test:unit && npm run ds:audit -- src/components/auth "src/app/(auth)/invites"`
- [ ] **Step 6: Commit**

```bash
git add src/components/auth/scenes/invite-scene.tsx "src/app/(auth)/invites"
git commit -m "feat(auth): convite com cena, carregamento no casco e status de aceito"
```

---

### Task 8: Jornadas, Atlas e verificação visual

**Files:**
- Modify: `docs/JORNADAS.md` (§1, tabela de regras, §11), `docs/atlas/template.html`
- Generate: `docs/atlas/atlas-jornadas.html`

- [ ] **Step 1: `JORNADAS.md` §1.** No fluxograma 1a: "Confirme seu e-mail" → "Confira seu e-mail" com o nó "Reenviar e-mail (60 s)" voltando a ele. No 1b: nó "Reenviar código (60 s)" no passo do código; `next` atravessando (`/forgot-password?next` → `redirectTo /reset-password?next` → `/login?reason=password-updated&next`); "Link expirado" → "Pedir novo código" com `next`. No convite: o passo "Convite aceito" antes do destino. Siga a legenda e o `%%{init}%%` do topo; ids de nó sem palavra reservada do Mermaid.
- [ ] **Step 2: Tabela de regras:** linha do reenviar (60 s, `auth.resend` / `resetPasswordForEmail`, falha não zera) e do `next` na recuperação (`src/lib/recovery-links.ts`).
- [ ] **Step 3: §11:** fechadas em 2026-10-12 — `next` perdido na recuperação, sem reenviar código, fallback do convite fora do casco.
- [ ] **Step 4: Atlas.** `docs/atlas/template.html`: a mesma jornada em "Como funciona", resumo, pontos de atenção, lacunas, apêndice de rotas, data e contagens da capa. Depois `python3 docs/atlas/build.py`.
- [ ] **Step 5: Commit**

```bash
git add docs/JORNADAS.md docs/atlas
git commit -m "docs(jornadas): reenviar, next na recuperação e status de convite"
```

- [ ] **Step 6: Republicar o Atlas** (o controlador da sessão faz, com a ferramenta de Artifact): `docs/atlas/atlas-jornadas.html` no URL `https://claude.ai/artifact/1N43LFYP1YSVsWaRMaNTRL`.
- [ ] **Step 7: Verificação visual** (controlador, preview `dev-attach` em :3000, **sem enviar formulário**): `/login`, `/register`, `/forgot-password`, `/reset-password` (sem token → "Link expirado"), `/invites/accept` — desktop e 375×812, claro e escuro. Conferir: cena certa por tela; no telefone só o wordmark; nada some no escuro; foco visível. Os estados que dependem de envio (código, confira seu e-mail, senha atualizada) ficam verificados pela página do `SplitShell` com mídia e pelo `ds:audit`.
