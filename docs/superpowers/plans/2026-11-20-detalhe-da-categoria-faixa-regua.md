# Faixa do mês: a régua da média, versões 1A e 1C — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** No desktop do detalhe da categoria, trocar as versões B e F da faixa do mês pelas versões **1A** e **1C** da "régua da média", mantendo a chave do cabeçalho para alternar entre as duas.

**Decisão do dono (20/11/2026):** gostou de 1A e 1C (mockups em `.superpowers/brainstorm/96236-1795184459/content/faixa-b-opcao1.html`); B e F saem.

**Architecture:** Uma peça comum (`ReguaDoMes`: valor + comparação + régua com o traço da média + veredito) e duas composições finas (1A e 1C) que mudam só onde moram os fatos. As contas novas são funções puras testadas. A chave do cabeçalho (`ChaveDaFaixa`) passa a alternar `A` / `C`.

**Tech Stack:** React 19, Tailwind v4, design system do projeto (`Progress`, `MoneyDisplay`, `DescriptionList`, `Separator`, tipografia).

## Global Constraints
- `AGENTS.md` vale todo. Nada de `src/components/ui/`, `globals.css`, banco, RPC. Faltou peça → parar e reportar.
- Só desktop (≥ 768px); o telefone continua com o `ResumoDoMes` atual.
- Texto em português, frase em minúscula inicial onde é continuação; sem maiúsculas em rótulos.
- Dinheiro por `MoneyDisplay`/`currencyBRL`; percentuais por `percentBR`.
- Checks antes do commit: `npm run ds:audit -- src/components/categories/detail "src/app/(app)/categories/[categoryId]"`, `npx tsc --noEmit && npm run lint && npm run test:unit` (o `carteira-forms.test.ts` pode estourar tempo sob carga: rodar sozinho).

## O conteúdo (igual nas duas versões)

Dados todos já chegam em `FaixaDoMesProps` (`faixa-metricas.tsx` hoje exporta o tipo; ele muda de casa, ver Task 1): `tipo`, `yearMonth`, `aberto`, `hojeYmd`, `lancado`, `previsto`, `limite`, `pesoNoTotal`, `comparacao`, `media`, `quantidade`, `maior`.

1. **Sobrancelha**: "Gasto em <mês>" (receita: "Recebido em <mês>"), `Caption`, mês por extenso minúsculo.
2. **Linha do valor**: `MoneyDisplay size="3xl"` e, na mesma linha de base, a **frase da comparação**: "↓ 18% que no mesmo dia de outubro (R$ 3.734)". Só a seta e o percentual levam a cor de estado: gastou menos (despesa) / recebeu mais (receita) = `text-success`; o contrário = `text-destructive`. Mês passado aberto: "que em outubro" (sem "no mesmo dia"). `comparacao.variacao === null` (mês anterior zero): a frase some.
3. **A régua** (largura toda da faixa):
   - **Com limite (despesa)**: o `Progress` de hoje contra o limite (`bands`, `projected`, `marker` = ritmo do mês quando aberto) — reaproveitar `BarraDoMes`/`frasesDoLimite`/`ritmoDoMes` de `resumo-do-mes.tsx`; e o traço da média **não** entra (o `Progress` só tem um `marker`, e o ritmo já o usa).
   - **Sem limite e com média**: `Progress value={lancado} max={escala.max} marker={escala.marcador}` sem `bands`. Sob a barra, um rótulo `Caption` "média de 6 meses R$ 2.907" alinhado ao traço (posição por `style={{ insetInlineStart: \`${marcador}%\` }}` com `-translate-x-1/2`, e preso às bordas: a 0–8% alinha à esquerda, a 92–100% à direita).
   - **Sem limite e sem média**: o `Progress` do peso na carteira de hoje (`BarraDoMes`), sem traço nem rótulo.
4. **Veredito** (`Muted`): sem limite → "5% acima da sua média" / "8% abaixo da sua média" / "na sua média" (|Δ| < 2%); sem média → nada. Com limite → a frase do limite de hoje ("Sobra R$ X de R$ Y", aviso do previsto).
5. **Fatos**: Lançamentos (`quantidade`), Maior gasto (`maior.amount` + forma por `paymentMethodLabel`, ou o nome do cartão se a `maior` trouxer), Média por lançamento (`lancado / quantidade`, some com 0), Do gasto da carteira (`percentBR(pesoNoTotal)`, some sem peso). Receita: "Maior entrada", "Da receita da carteira".

## As duas versões

**1A — fatos embaixo, em quatro colunas.** Sobrancelha → linha do valor → régua → veredito → `Separator` horizontal → os fatos numa grade de 4 colunas iguais (`grid-cols-4`), cada coluna separada da anterior por um fio vertical (`border-s` no token `--border`, ou `Separator orientation="vertical"`), termo em `Caption` muted e valor em `MoneyDisplay size="md"`/número em `font-mono font-semibold`. Ocupa a linha inteira. Nesta versão o peso na carteira sai do veredito (é o 4º fato).

**1C — fatos na linha do valor.** Sobrancelha → uma linha `flex justify-between items-baseline flex-wrap gap-x-6`: à esquerda o valor + a frase da comparação; à direita três fatos (Lançamentos, Maior gasto, Do gasto da carteira) em `flex gap-9`, termo acima do valor. → régua → veredito, com a média por lançamento no fim ("5% acima da sua média · média por lançamento R$ 340,28").

Ritmo vertical: `gap-3` entre sobrancelha e valor, régua com `mt-5`, o rótulo do traço com `mb-6` de espaço reservado, `gap-5` entre blocos. Tudo alinhado à esquerda, sem cartão nem borda em volta da faixa.

## Review Focus
1. Categoria nova (sem média): sem traço, sem rótulo, sem veredito; nada de "NaN" nem "0%".
2. Mês passado: "que em outubro", sem ritmo.
3. Com limite: a régua do limite e a frase do limite; o traço da média não aparece.
4. Receita: textos de receita e cores invertidas.
5. Rótulo do traço perto das bordas (média muito baixa ou muito alta) não vaza da faixa.
6. 1024px: 1C quebra os fatos para a linha de baixo sem sobrepor a frase.

---

### Task 1: Contas puras da régua

**Files:**
- Create: `src/components/categories/detail/regua-do-mes.ts` (sem JSX, sem `cva`)
- Test: `src/components/categories/detail/regua-do-mes.test.ts`

**Interfaces:**
```ts
export function escalaDaRegua(args: { lancado: number; media: number | null; anterior: number }): { max: number; marcador: number | null }
// max = max(lancado, media ?? 0, anterior) * 1.15 (mínimo 1); marcador = media/max*100 (null sem media ou media <= 0)
export function vereditoDaMedia(lancado: number, media: number | null): string | null
// null sem média (ou media <= 0); |Δ| < 2% → "na sua média"; senão "N% acima da sua média" / "N% abaixo da sua média" (N inteiro, percentBR sem decimais)
export function fraseDaComparacao(args: { tipo: "expense" | "income"; comparacao: Comparacao }): { seta: "↑" | "↓"; percentual: string; bom: boolean; resto: string } | null
// null quando variacao === null; resto = "que no mesmo dia de outubro (R$ 3.734)" ou "que em outubro (R$ 3.734)"
```
- [ ] Step 1: testes — escala com média maior que o lançado; sem média → marcador null; veredito 5% acima, 8% abaixo, 1% → "na sua média", média 0 → null; comparação de despesa caindo → `bom: true`, receita caindo → `bom: false`, mês passado → "que em …".
- [ ] Step 2: `npx vitest run src/components/categories/detail/regua-do-mes.test.ts` → FAIL.
- [ ] Step 3: implementar.
- [ ] Step 4: → PASS.

### Task 2: A peça comum e as duas versões

**Files:**
- Create: `src/components/categories/detail/regua-do-mes.tsx` — `ReguaDoMes` (sobrancelha opcional, linha do valor com `fatosNaLinha?: ReactNode`, régua, veredito com `sufixo?: string`), `FatosDoMes` (os fatos, `layout: "colunas" | "linha"`), e o tipo `FaixaDoMesProps` (movido de `faixa-metricas.tsx`).
- Create: `src/components/categories/detail/faixa-1a.tsx`, `faixa-1c.tsx` (composições finas).
- Modify: `faixa-do-mes-teste.tsx` — `VersaoDaFaixa = "A" | "C"`, chave `detalhe-categoria:faixa-regua` (nova, para não herdar "B"/"F"), padrão `"A"`, rótulos "1A · Fatos embaixo" e "1C · Fatos no topo".
- Delete: `faixa-metricas.tsx`, `faixa-barras.tsx` (conferir com grep que nada mais importa; mover o que outro arquivo usar).
- Modify: `src/app/(app)/categories/[categoryId]/page-client.tsx` só no que os imports/tipos exigirem.
- [ ] Step 1: implementar conforme "O conteúdo" e "As duas versões".
- [ ] Step 2: checks do Global Constraints verdes.
- [ ] Step 3: navegador (dev já em `http://localhost:3000`, **nunca gravar no banco**): Carro (`/categories/fdc3a58a-7d80-4cc6-a0ee-a92148f53820?type=expense&month=2026-11`) a 1440px nas duas versões pela chave; recarregar e ver que lembra; `?month=2026-08`; 1024px; 375px (telefone igual). Screenshot das duas; criticar alinhamento, colisão do rótulo do traço, quebra; corrigir. Voltar o viewport ao desktop.
- [ ] Step 4: commit `feat(categoria): a régua da média na faixa do mês, versões 1A e 1C` com este plano.
