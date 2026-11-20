# Foto do recibo: linha com retrato — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Na revisão do lançamento inteligente, a foto do recibo vira uma linha com a miniatura em pé, "Foto do recibo · Toque para ver", "Trocar" e lixeira; tocar na linha abre a foto grande.

**Architecture:** Só `MiniaturaDoRecibo` e o fio até ela mudam, em `lancamento-inteligente.tsx`. A câmera do "Trocar" é o mesmo `arquivoRef` da pílula, passado como `onTrocar` por `Revisao`. A foto grande é um `Dialog surface="auto"` local, na forma do `VisualizadorDeAnexo`, lendo a URL local do `File`.

**Tech Stack:** React, componentes do DS (`Item`, `ItemLink`, `ItemMedia`, `Button`, `Dialog`), Heroicons, Vitest (testes de fonte).

**Spec:** `docs/superpowers/specs/2026-11-20-foto-do-recibo-linha-com-retrato-design.md`

## Global Constraints

- Nada em `src/components/ui/` nem `globals.css`; só componentes que já existem.
- Ícones: `TrashIcon` de `@heroicons/react/16/solid` (botão sem tamanho = micro, regra do DS).
- Textos exatos: título "Foto do recibo", descrição "Toque para ver", botão "Trocar", lixeira `aria-label="Tirar a foto"`, alvo da linha `aria-label="Ver a foto do recibo"`, título do diálogo "Foto do recibo".
- Miniatura: `ItemMedia variant="image"` com `h-14 w-11 rounded-row` e a imagem `object-top`.
- Ações desabilitam com `saving`. Todo `<button>` cru declara `type`; `Button` já nasce `type="button"`.
- Rodar `graphify update .` depois de mudar código.

## Review Focus

- O `ItemLink` cobre a linha: as ações ("Trocar", lixeira) precisam continuar clicáveis por cima da película (se o `Item` não erguer `ItemActions`, ergue com `relative z-10`).
- Trocar a foto troca a miniatura e a URL do diálogo (a URL antiga é revogada).
- Tirar a foto com o diálogo aberto: o diálogo fecha (sem foto, não há o que mostrar).
- No telefone o diálogo é gaveta (`surface="auto"`) e fica por cima do lançamento.

---

### Task 1: A linha com retrato e a foto grande

**Files:**
- Modify: `src/components/transactions/lancamento-inteligente.tsx` (`MiniaturaDoRecibo` ~L983; `Revisao` ~L1044 e o uso ~L1524; o `<Revisao>` ~L825)
- Test: `src/components/transactions/lancamento-inteligente.test.ts`

**Interfaces:**
- `MiniaturaDoRecibo({ foto: File; onTirar: () => void; onTrocar: () => void; disabled: boolean })`
- `Revisao` ganha `onTrocarFoto: () => void`; o pai passa `() => arquivoRef.current?.click()`.

- [ ] **Step 1: Teste que falha** — em `lancamento-inteligente.test.ts`, um `it("a foto do recibo é uma linha com retrato, Trocar e lixeira, e abre grande")` com:

```ts
expect(fonte).toContain('"Foto do recibo"')
expect(fonte).toContain('"Toque para ver"')
expect(fonte).toContain('aria-label="Ver a foto do recibo"')
expect(fonte).toContain('aria-label="Tirar a foto"')
expect(fonte).toMatch(/<ItemMedia variant="image"[^>]*h-14 w-11 rounded-row/)
expect(fonte).toMatch(/onTrocarFoto=\{\(\) => arquivoRef\.current\?\.click\(\)\}/)
expect(fonte).not.toMatch(/<MiniaturaDoRecibo[\s\S]{0,400}<Avatar/)
```

- [ ] **Step 2:** `npx vitest run src/components/transactions/lancamento-inteligente.test.ts` → FAIL nesse teste.
- [ ] **Step 3: Implementar** conforme o spec e as constantes acima. A URL local continua nascendo e sendo revogada com o `File` (o efeito de hoje). O diálogo: estado `aberto` local; `open={aberto && url != null}`; fecha sozinho quando `foto` some. `img` com `alt="Foto do recibo"` e `object-contain`. Sem rodapé.
- [ ] **Step 4:** o mesmo vitest + `npx tsc --noEmit` + `npx eslint src/components/transactions/lancamento-inteligente.tsx` → PASS / limpo.
- [ ] **Step 5: Commit** `feat(lancamento): a foto do recibo em linha com retrato, Trocar e foto grande`.
