# A lista da gaveta vai até o pé — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** nas gavetas de baixo sem rodapé, o meio que rola vai até o pé da tela, com o respiro da área segura por dentro dele.

**Architecture:** a superfície do `DrawerContent` deixa de guardar `pb-(--drawer-safe)` quando não tem `dialog-footer`; o meio (`[data-drawer-meio]`) passa a levar esse `padding-bottom`. Classes Tailwind arbitrárias, escritas por extenso, no `drawer.tsx`.

**Tech Stack:** Next.js, Tailwind v4, vaul, Vitest (testes de leitura de fonte).

**Spec:** `docs/superpowers/specs/2026-11-19-gaveta-ate-o-pe-design.md`

## Global Constraints

- Mudança em `src/components/ui/drawer.tsx` aprovada pelo dono (19/11/2026).
- `--drawer-safe` continua declarada na superfície, com a mesma fórmula (`calc(--spacing(6)+env(safe-area-inset-bottom,0px))`).
- Gaveta com `[data-slot=dialog-footer]`, gaveta de cima e desktop não mudam.
- Classes escritas por extenso (um template literal não gera regra).

## Review Focus

1. Gaveta com rodapé (Editar lançamento, Adicionar): o `pb` da superfície continua, e o rodapé segue no pé.
2. Gaveta cujo meio é neto (`:scope > * > [data-slot=dialog-body]`, o detalhe do lançamento): o `pb` chega nele.
3. Gaveta curta (conteúdo menor que a tela): ganha o respiro no fim do meio, sem pular de altura.
4. Gaveta de cima (`direction=top`): intocada.

---

### Task 1: o respiro sai da superfície e entra no meio

**Files:**
- Modify: `src/components/ui/drawer.tsx` (classes do `DrawerContent`, ~l.148)
- Test: `src/components/ui/glass.test.ts` (o bloco que cobra `pb-(--drawer-safe)`, ~l.580)

- [ ] **Step 1: Atualizar o teste**

No bloco existente, trocar a expectativa de `pb-(--drawer-safe)` simples por:

```ts
expect(gaveta, "sem rodapé a superfície não guarda o respiro").toContain(
    "data-[vaul-drawer-direction=bottom]:not-has-[[data-slot=dialog-footer]]:pb-0"
)
expect(gaveta, "com rodapé a superfície guarda a área segura").toContain(
    "data-[vaul-drawer-direction=bottom]:pb-(--drawer-safe)"
)
expect(gaveta, "sem rodapé o meio leva o respiro por dentro").toContain(
    "data-[vaul-drawer-direction=bottom]:not-has-[[data-slot=dialog-footer]]:[&_[data-drawer-meio]]:pb-(--drawer-safe)"
)
```

- [ ] **Step 2: Rodar e ver falhar** — `npx vitest run src/components/ui/glass.test.ts` → FAIL nas duas novas.

- [ ] **Step 3: Implementar** — no array de classes do `DrawerContent`, logo depois de `data-[vaul-drawer-direction=bottom]:pb-(--drawer-safe)`, somar as duas classes do teste, com um comentário em português dizendo o porquê (a lista ia até uma faixa vazia de vidro; agora passa por trás da barra de gestos, e o último item assenta acima dela).

- [ ] **Step 4: Rodar e ver passar** — `npx vitest run src/components/ui/glass.test.ts src/components/ui/drawer-versions.test.ts` → PASS. Depois `npx tsc --noEmit && npm run lint && npm run test:unit`.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/drawer.tsx src/components/ui/glass.test.ts
git commit -m "fix(drawer): a lista da gaveta vai até o pé do telefone"
```
