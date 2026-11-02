# Seção "No celular" com o iPhone vazando — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** No desktop, a seção "No celular" de Configurações ganha um iPhone 17 Pro prata de verdade, que vaza por cima do cartão e é cortado embaixo, com o QR flutuando sobre a borda dele.

**Architecture:** O cartão, o aparelho e o QR saem de `theme-settings.tsx` para `NoCelularCartao`, um arquivo em `src/components/settings/`. A imagem já está pronta em `src/components/settings/assets/iphone-17-pro-prata.webp`, tirada do PSD gratuito em `docs/design/mockups/` com a tela inicial real do Simulador.

**Tech Stack:** Next.js 16 (`next/image`), Tailwind v4 com container query, Vitest.

**Spec:** este plano. Decisões do dono em 2026-11-02:
- Composição C dos mockups: texto à esquerda, aparelho à direita, QR flutuando sobre a borda esquerda dele.
- Fundo da moldura normal, sem ondas: o `Card` de sempre, nos dois temas.
- Mockup do iPhone 17 Pro do PSD, prata, sem aparelho desenhado à mão. A tela é a real do Simulador.

## Global Constraints

- Só tokens: nenhuma cor crua. Nenhum token novo, e nada em `src/components/ui/` nem em `globals.css` muda.
- A largura do aparelho é 196px, sobe 64px acima do cartão e fica a 32px da borda direita. O cartão mede 224px de altura. O QR fica a 176px da direita e a 16px do pé.
- A cópia atual não muda: "Abra o Finance no telefone", "Aponte a câmera para o código. Lá você liga o lançamento inteligente e instala o app.", "Lance por frase e instale o app no telefone.".
- `link={false}`, `wave` e `onCopied` continuam como estão no `QrCode` e no `QrCodeCopy`.
- O aparelho é decorativo: `alt=""`, sem receber clique.
- Sem push. `git add` nomeia arquivos. Não tocar em `CLAUDE.md` nem em `.superpowers/`.
- Banco de dev é o de produção: nada de salvar, ligar chave ou excluir ao testar.
- Antes de ler código para uma pergunta: `graphify query "<pergunta>"`. Depois: `graphify update .`, e `graphify-out/` entra no commit.
- Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- O `Card` nasce com `overflow-hidden`: sem `overflow-visible` no `className`, o aparelho não vaza. Teste na Task 1.
- Cartão estreito (tablet, janela de 768px com a barra aberta): o aparelho não pode cobrir o texto. Abaixo de 32rem do próprio cartão ele some, e o QR volta ao fluxo. Teste na Task 1.
- iPad ou fila pendente: a linha do app e a "Sincronização" continuam alcançáveis, num segundo cartão, sem cortar o aparelho. Teste na Task 1.
- O aparelho sobre o cabeçalho da seção não pode cobrir o título nem a descrição, nem encostar no cartão de Aparência. Verificação no navegador pelo controlador.
- A onda do QR e a cópia seguem funcionando depois da mudança de arquivo. Teste na Task 1.

---

### Task 1: Cartão com o aparelho

**Files:**
- Create: `src/components/settings/no-celular-cartao.tsx`
- Add: `src/components/settings/assets/iphone-17-pro-prata.webp` (já gerado, 588 x 882, não rastreado ainda)
- Modify: `src/components/settings/theme-settings.tsx:123-154`
- Test: `src/components/settings/settings-page.test.ts`

**Interfaces:**
- Consumes: `QrCode`, `QrCodeCopy` de `@/components/ui/qr-code`; `Card` de `@/components/ui/card`; `Muted` de `@/components/ui/typography`.
- Produces: `NoCelularCartao({ value }: { value: string })`, exportada de `@/components/settings/no-celular-cartao`.

- [ ] **Step 1: Atualizar o teste**

No caso "Este aparelho e IA e privacidade ficam em linhas…", tire de `aparelho` os textos `"Abra o Finance no telefone"`, `"QrCode"`, `"QrCodeCopy"` e `"#no-celular"` só se eles saírem de `theme-settings.tsx`, e acrescente:

```ts
const cartao = lerFonte("src/components/settings/no-celular-cartao.tsx")
for (const texto of [
    "overflow-visible",
    "iphone-17-pro-prata.webp",
    'alt=""',
    "QrCodeCopy",
    "link={false}",
    "wave={onda}",
    "Abra o Finance no telefone",
    "@container/no-celular",
]) expect(cartao).toContain(texto)
expect(aparelho).toContain("NoCelularCartao")
expect(aparelho).toContain("pendingSyncCount")
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/components/settings/settings-page.test.ts`
Expected: FAIL, arquivo não encontrado.

- [ ] **Step 3: Implementar `NoCelularCartao`**

Anatomia:
- raiz `div` com `@container/no-celular`.
- `Card padding="none"`, com `relative h-56 overflow-visible`. Abaixo de 32rem de cartão, a altura é a do conteúdo: `@max-lg/no-celular:h-auto`.
- Texto em `flex h-full flex-col justify-center p-4`, com largura de 216px (`w-54`) acima de 32rem: `p` de `text-sm font-medium`, `Muted`, e `QrCodeCopy` com `mt-3`. Abaixo de 32rem a linha é `flex items-center justify-between gap-6`, com o `QrCode` no fluxo, como era.
- Corte: `div` `pointer-events-none absolute inset-0 @max-lg/no-celular:hidden` com clip-path que só corta embaixo, no raio do cartão: `[clip-path:inset(-5rem_-2rem_0_-2rem_round_0_0_var(--radius-surface)_var(--radius-surface))]`.
- Dentro do corte, `next/image` com import estático, `alt=""`, `sizes="196px"`, classe `absolute -top-16 right-8 w-49 max-w-none select-none drop-shadow-xl`.
- `QrCode` com `link={false}`, `wave={onda}`, `label="Abrir o Finance no telefone"`, acima do corte: `@lg/no-celular:absolute @lg/no-celular:right-44 @lg/no-celular:bottom-4 @lg/no-celular:shadow-xl`.
- `onda` é `useState(0)` local, somado no `onCopied`.

Um arquivo `"use client"`, com um comentário curto dizendo que o aparelho vem do PSD de `docs/design/mockups/` e por que o `Card` precisa de `overflow-visible`.

- [ ] **Step 4: Ligar em `theme-settings.tsx`**

No ramo do desktop: `<NoCelularCartao value={noTelefone} />` no lugar do bloco do texto e do QR. Tire `onda` e os imports que ficarem sem uso. Com `instalarNoIphone`, ou com pendências, as linhas vão num segundo `Card padding="none"` abaixo, com `mt-3`, na mesma ordem de hoje.

- [ ] **Step 5: Rodar e ver passar**

Run: `npx vitest run src/components/settings/settings-page.test.ts && npx tsc --noEmit && npm run ds:audit -- src/components/settings/no-celular-cartao.tsx src/components/settings/theme-settings.tsx`
Expected: PASS, sem erro de tipo, sem violação. Se o auditor reprovar o clip-path arbitrário, nomeie a exceção com o motivo em `ARBITRARY_VALUE_EXCEPTIONS` e diga no relatório.

- [ ] **Step 6: Commit**

```bash
git add src/components/settings/no-celular-cartao.tsx src/components/settings/assets/iphone-17-pro-prata.webp src/components/settings/theme-settings.tsx src/components/settings/settings-page.test.ts graphify-out
git commit -m "feat(configuracoes): iPhone 17 Pro vazando da seção No celular"
```
