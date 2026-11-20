# Teste da faixa do mês B × F — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development.

**Goal:** No desktop do detalhe da categoria, duas versões da faixa do mês (B e F) com uma chave na tela para alternar.
**Spec:** `docs/superpowers/specs/2026-11-20-detalhe-da-categoria-faixa-teste-design.md` (binding; read it all).

## Global Constraints
- AGENTS.md vale; nada em `src/components/ui/`, `globals.css`, `src/app/designsystem/`, banco, RPC. Faltou peça → parar e reportar.
- Telefone sem mudança (continua o `ResumoDoMes` atual).
- Checks: `npm run ds:audit -- src/components/categories/detail "src/app/(app)/categories/[categoryId]"`, `npx tsc --noEmit && npm run lint && npm run test:unit`.

## Review Focus
1. Sem média (categoria nova): B sem a métrica da média; F sem a barra da média — sem buracos.
2. Mês passado: "vs <mês ant.>" (mês inteiro), sem "até dia N", sem traço do ritmo.
3. Receita: "Recebido em…", sem limite, selo verde quando recebeu mais.
4. Com limite: B usa a barra do limite; F ganha a linha "Limite".
5. `localStorage` bloqueado: a tela abre em B e a chave ainda troca (só não lembra).

### Task 1: B, F e a chave

**Files:**
- Create: `src/components/categories/detail/faixa-metricas.tsx` (B), `src/components/categories/detail/faixa-barras.tsx` (F), `src/components/categories/detail/faixa-do-mes-teste.tsx` (a chave + a escolha lembrada; renderiza B ou F)
- Modify: `src/app/(app)/categories/[categoryId]/page-client.tsx` (no desktop o `resumo` vira o teste; tira `Comparacoes` da análise no desktop — no telefone fica), `category-detail-skeleton.tsx` se a forma mudar.

**Interfaces (props das duas faixas, iguais):**
```ts
{ tipo: TipoDaCategoria; yearMonth: string; aberto: boolean; hojeYmd: string
  lancado: number; previsto: number; limite: number | null; pesoNoTotal: number | null
  comparacao: Comparacao; media: number | null
  quantidade: number; maior: Transaction | null }
```
`maior` = `maioresLancamentos(txs, tipo, 1)[0] ?? null`; a forma do maior por `paymentMethodLabel` (ou o nome do cartão, se houver em mãos). A variação do selo: `comparacao.variacao` (fração); "bom" = gastou menos (despesa) / recebeu mais (receita).

- [ ] **Step 1:** Implementar B e F conforme a spec, reaproveitando `frasesDoLimite`/`ritmoDoMes` de `resumo-do-mes.tsx` (exportar de lá se preciso, sem duplicar), `Progress`, `MoneyDisplay`, `Badge`, `ChartBarList`, `Separator orientation="vertical"`, tipografia do DS.
- [ ] **Step 2:** A chave: `ToggleGroup variant="segmented" type="single"` com rótulo acessível "Teste de layout"; `localStorage` em `try/catch`, chave `detalhe-categoria:faixa`, padrão `"B"`.
- [ ] **Step 3:** Ligar no `page-client` só no desktop; o telefone intacto.
- [ ] **Step 4:** Checks verdes; navegador (dev em :3000, NUNCA gravar no banco) a 1440px: alternar B↔F, recarregar e ver que lembra; screenshot das duas.
- [ ] **Step 5:** Commit `feat(categoria): teste da faixa do mês, B e F com chave` (inclui spec e plano).
