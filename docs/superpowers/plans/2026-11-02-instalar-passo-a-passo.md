# Folha de instalação, um passo por vez — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `InstallPwaSheet` vira um passo a passo de quatro telas, cada uma com um iPhone real mostrando onde tocar, no caminho certo do Safari atual.

**Architecture:** Só `src/components/pwa/install-pwa-sheet.tsx` muda. As quatro imagens já estão prontas em `src/components/pwa/assets/`: iPhone 17 Pro prata do PSD com capturas reais do Simulador (iOS 27). O ponto que pulsa é desenhado por cima, em porcentagem da imagem.

**Tech Stack:** Next.js 16 (`next/image`), Tailwind v4, Vitest.

**Spec:** este plano. Decisões do dono em 2026-11-02: conceito B dos mockups, um passo por vez, com os mockups reais do iPhone. Referências: [talabat](https://mobbin.com/screens/2f68839e-8d97-493c-934f-6d0a0686860b), [Google](https://mobbin.com/screens/73101647-2740-45fb-aa4d-82aebce34ebf), [Locket](https://mobbin.com/screens/c148da2f-c4db-4552-90a0-59898144f7bd).

## Global Constraints

- Só tokens: sem cor crua. Nada em `src/components/ui/` nem em `globals.css` muda.
- A folha continua o `Sheet` com `SheetContent side="bottom" variant="flush" fillMobileViewport`, com `DialogHeader`, `DialogTitle`, `DialogDescription` e `DialogCloseButton`: é o nome acessível dela.
- `InstallPwaSheetAuto` e `PWA_INSTALL_DISMISSED_KEY` não mudam. "Entendi" chama o `handleDismiss` de hoje.
- Sem push. `git add` nomeia arquivos. Não tocar em `CLAUDE.md` nem em `.superpowers/`.
- Antes de ler código para uma pergunta: `graphify query "<pergunta>"`. Depois: `graphify update .`, e `graphify-out/` entra no commit.
- Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- Reabrir a folha: ela volta ao passo 1, e não ao último visto. Teste na Task 1.
- Movimento reduzido: o ponto não pulsa. Teste na Task 1.
- O último passo troca "Próximo" por "Entendi", e só ele grava o `PWA_INSTALL_DISMISSED_KEY`. Teste na Task 1.
- Tela baixa: a imagem não empurra os botões para fora; o corpo rola. Verificação do controlador.
- A troca de passo avisa o leitor de tela, porque o título do passo está numa região viva. Teste na Task 1.

---

### Task 1: Passo a passo

**Files:**
- Modify: `src/components/pwa/install-pwa-sheet.tsx`
- Add: `src/components/pwa/assets/instalar-1-menu.webp`, `instalar-2-compartilhar.webp`, `instalar-3-ver-mais.webp`, `instalar-4-adicionar.webp` (já geradas, 720 de largura, não rastreadas)
- Test: `src/components/pwa/install-pwa-sheet.test.ts` (novo)

- [ ] **Step 1: Escrever o teste que falha**

Com `lerFonte` e `semComentarios` de `@/test/fonte`, sobre `install-pwa-sheet.tsx`:

```ts
const f = semComentarios(lerFonte("src/components/pwa/install-pwa-sheet.tsx"))
it("quatro passos, cada um com a imagem real", () => {
    for (const a of ["instalar-1-menu.webp", "instalar-2-compartilhar.webp", "instalar-3-ver-mais.webp", "instalar-4-adicionar.webp"]) expect(f).toContain(a)
    for (const t of ["Compartilhar", "Ver Mais", "Adicionar à Tela de Início", "Adicionar"]) expect(f).toContain(t)
})
it("o passo volta ao 1 ao abrir", () => { expect(f).toMatch(/setPasso\(0\)/) })
it("só o último passo dispensa", () => { expect(f).toContain("Entendi"); expect(f).toContain("Próximo"); expect(f).toContain("Voltar") })
it("o ponto respeita o movimento reduzido", () => { expect(f).toContain("motion-safe:animate-ping") })
it("o passo fica numa região viva", () => { expect(f).toContain('aria-live="polite"') })
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/components/pwa/install-pwa-sheet.test.ts`
Expected: FAIL em "instalar-1-menu.webp".

- [ ] **Step 3: Implementar**

Uma tabela `PASSOS` no arquivo, com import estático de cada imagem:

| # | imagem | ponto (x%, y%) | ancora | título | texto |
| --- | --- | --- | --- | --- | --- |
| 1 | `instalar-1-menu` | 28, 92.4 | baixo | Abra o menu do Safari | Na barra do Safari, toque em ≡ ou em ⋯. |
| 2 | `instalar-2-compartilhar` | 46.6, 51.6 | baixo | Toque em Compartilhar | Ele está no menu que abriu. |
| 3 | `instalar-3-ver-mais` | 40.2, 68.3 | baixo | Adicione à Tela de Início | Se não aparecer, toque em Ver Mais antes. |
| 4 | `instalar-4-adicionar` | 80.3, 12.1 | topo | Toque em Adicionar | O Finance aparece na sua tela inicial. |

Anatomia dentro do `SheetContent`:
- `DialogHeader` com `DialogTitle` "Instalar no iPhone" e `DialogDescription` "Use o Finance como app, sem a barra do Safari." Sai o `DialogMedia`.
- Janela da imagem: `relative mx-auto h-72 w-60 overflow-hidden`, com `Image` de `w-60 max-w-none` e `alt=""`, `absolute inset-x-0`, `top-0` quando a âncora é topo e `bottom-0` quando é baixo. `sizes="240px"`.
- O ponto mora num `div absolute inset-x-0` com a mesma âncora e a mesma proporção da imagem (`aspect-[720/1488]`): dois `span` com `left`/`top` em porcentagem por `style`, `size-8 -translate-x-1/2 -translate-y-1/2 rounded-full`, o de fora `motion-safe:animate-ping bg-foreground/30`, o de dentro `ring-2 ring-foreground`. Confira a proporção real no import.
- Fileira de pontos do passo, `aria-hidden`: `size-1.5 rounded-full`, `bg-foreground` no ativo e `bg-muted-foreground/40` nos outros.
- Um `div aria-live="polite"` com o título do passo (`P` em `font-semibold`) e o texto (`Muted`).
- Só no passo 1, `Muted className="text-xs"`: "Use o Safari: em outro navegador o caminho muda."
- Rodapé `flex gap-2`: `Button variant="tertiary"` "Voltar" a partir do passo 2; `Button variant="primary"` com `className="flex-1"`, "Próximo" até o 3 e "Entendi" no 4.

`passo` é `useState(0)`. Ao abrir, volta a 0: `if (open !== abertoAntes) { setAbertoAntes(open); if (open) setPasso(0) }`, no render, como o `formAnterior` do `device-frame.tsx`. Tire `ShareIcon`, `DevicePhoneMobileIcon`, `DialogMedia` e o que ficar sem uso; `InstallPwaSheetAuto` fica igual.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/components/pwa && npx tsc --noEmit && npm run ds:audit -- src/components/pwa/install-pwa-sheet.tsx`
Expected: PASS, sem erro de tipo, sem violação.

- [ ] **Step 5: Commit**

```bash
git add src/components/pwa/install-pwa-sheet.tsx src/components/pwa/install-pwa-sheet.test.ts src/components/pwa/assets graphify-out
git commit -m "feat(pwa): instalação em quatro passos, com o iPhone real"
```
