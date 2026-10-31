# Impacto da parcela no design system — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar o wireframe "Impacto da parcela" (Bloco 5) por peças do design system, no painel de revisão do lançamento, no formulário e no detalhe da transação.

**Architecture:** O componente `ImpactoDaParcela` muda de casa e mantém as props. As regras de texto viram funções puras em `src/lib/previsao/impacto-parcela.ts`, testadas sem DOM. A conta (`impactoDaParcela`, `impactoDoPlano`, `usePrevisao`) não muda.

**Tech Stack:** React 19, design system de `src/components/ui/`, Vitest.

**Spec:** este documento. O dono pediu "faça o design deste wireframe" e pulou as perguntas; o desenho é decisão do executor. Regra do AGENTS.md: na revisão, o wireframe vira design system e o arquivo dele é apagado.

## O desenho (decisões do executor)

O quadro hoje mostra seis linhas sempre abertas e, no painel de revisão do telefone, empurra o "Aprovar". O novo mostra só a resposta, e o detalhe abre sob toque:

1. **Aviso, só quando pede atenção**, sempre à vista, acima da linha: `Alert size="sm"`.
   - `limite.cabe === false` → `tone="destructive"`, título `Não cabe no limite do cartão`; com `limite.disponivel` conhecido, descrição `Disponível: <currencyBRL>`.
   - senão, `primeiroMesNegativo.depois` existe e é diferente de `primeiroMesNegativo.antes` → `tone="warning"`, título `O seguro para gastar fica negativo em <mesCurto(depois)>`.
   - senão, nenhum aviso.
2. **A linha recolhível**: `Collapsible variant="card"` com `CollapsibleRow`, rótulo `Impacto da parcela`, `trailing` com o resumo `Pico de <currencyBRL(pico.comEsta)> em <mesCurto(pico.mes)>`. Fechada por padrão.
3. **O detalhe**: `DescriptionList divided` (termo e valor na mesma linha), nesta ordem, com os mesmos dados de hoje:
   - `Parcela` → `impacto.parcelaEFim`
   - `Pico de parcelas` → `<semEsta> → <comEsta>`
   - uma linha por fatura de `proximasFaturas`: `Fatura de <formatDatePtBr(closeYmd)>` → `<antes> → <depois>`
   - `Da renda recorrente` → `<n>% no pico`, ou `Sem receita recorrente`
   - `Seguro para gastar` → `Sem mês negativo` quando nem `antes` nem `depois` existem; senão `<antes ou "nenhum"> → <depois ou "nenhum">` por `mesCurto`
   - `Limite disponível` → valor, ou `Sem limite cadastrado` com `motivo === "sem_limite"`; sem cartão, a linha não existe
4. **Os estados**: carregando, `Skeleton` na altura da linha; `erro`, `Caption` `Não deu para calcular o impacto agora.`; sem dados e sem erro, nada; plano encerrado, nada (como hoje).

## Global Constraints

- Nada em `src/components/ui/`, `src/app/globals.css` nem `src/app/designsystem/`.
- Componentes na versão padrão, sem `variant`/`size` além dos que este plano fixa. Tokens apenas. Valores monetários com `currencyBRL`, datas com `formatDatePtBr`, e `.nums` nos valores.
- As props de `ImpactoDaParcela` não mudam: `{ proposto: PlanoProposto; planoId?: never } | { planoId: string; proposto?: never }`.
- NUNCA rodar prettier ou outro formatador; o arquivo novo segue o estilo dos vizinhos (4 espaços, sem ponto e vírgula).
- Nunca `git checkout`/`restore`/`reset` em arquivos; o hook do projeto barra.
- Verificação: `npx tsc --noEmit && npm run lint && npx vitest run src/lib/previsao src/components/transactions src/components/wireframe` e `npm run ds:audit -- src/components/transactions/impacto-da-parcela.tsx`.
- Commits em português, terminando com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; nunca `CLAUDE.md` nem `.superpowers/`. Depois, `graphify update .` e commit separado só com `graphify-out/graph.json`.

## Review Focus

1. Sem cartão (`limite.motivo === "sem_cartao"`, `proximasFaturas === null`): nenhuma linha de fatura nem de limite.
2. O negativo que já existia no mesmo mês (`antes === depois`) não vira aviso: a compra não mudou nada.
3. O negativo que a compra antecipa (`antes` depois de `depois`) avisa.
4. Linha estreita a 320px: o resumo não empurra o rótulo para fora.
5. No painel de revisão, abrir o detalhe anda na mola: o invólucro `useAlturaAnimada` do corpo acompanha, e o painel rola quando passa da tela.

---

### Task 1: O quadro em peças do design system

**Files:**
- Modify: `src/lib/previsao/impacto-parcela.ts`, `src/lib/previsao/impacto-parcela.test.ts`
- Create: `src/components/transactions/impacto-da-parcela.tsx`
- Modify: os imports em `src/components/transactions/lancamento-inteligente.tsx`, `transaction-detail-sheet.tsx`, `transaction-form-fields.tsx` e `src/components/wireframe/frase-rapida-wireframe.tsx`
- Delete: `src/components/wireframe/impacto-parcela-wireframe.tsx`

**Interfaces:**
- Produces, em `impacto-parcela.ts`: `avisoDoImpacto(i: Impacto): { tom: "destructive" | "warning"; titulo: string; descricao: string | null } | null` e `resumoDoImpacto(i: Impacto): string`.
- Produces, em `impacto-da-parcela.tsx`: `ImpactoDaParcela`, com as props de hoje.

- [ ] **Step 1: Testes que falham** em `impacto-parcela.test.ts`, `describe("o texto do quadro")`, com um `Impacto` montado à mão:
  - `limite.cabe: false, disponivel: 1500` → `avisoDoImpacto` é `{ tom: "destructive", titulo: "Não cabe no limite do cartão", descricao: \`Disponível: ${currencyBRL(1500)}\` }`
  - `cabe: false, disponivel: null` → `descricao: null`
  - `primeiroMesNegativo { antes: null, depois: "2027-03" }` → `{ tom: "warning", titulo: "O seguro para gastar fica negativo em mar/2027", descricao: null }`
  - `{ antes: "2027-05", depois: "2027-03" }` → avisa em `mar/2027`
  - `{ antes: "2027-03", depois: "2027-03" }` → `null`
  - `cabe: false` junto de negativo novo → o destrutivo vence
  - `resumoDoImpacto` com `pico { comEsta: 242, mes: "2027-05" }` → `\`Pico de ${currencyBRL(242)} em mai/2027\``
  - fonte: `impacto-da-parcela.tsx` contém `<Collapsible` e `<DescriptionList`, e não contém `WireframeBox`; os quatro importadores não contêm `impacto-parcela-wireframe`; `existsSync("src/components/wireframe/impacto-parcela-wireframe.tsx")` é `false`
- [ ] **Step 2:** `npx vitest run src/lib/previsao/impacto-parcela.test.ts` → FAIL.
- [ ] **Step 3:** Implementar as duas funções e o componente, pelo desenho acima. `ImpactoDaParcela` mantém a lógica de `usePrevisao` e `useMemo` do wireframe. Para a linha termo-valor, use o `layout` da `DescriptionList` que ponha os dois na mesma linha (leia `description-list.tsx`).
- [ ] **Step 4:** Trocar os imports e apagar o wireframe com `git rm`. Se o hook recusar apagar, não contorne: deixe o arquivo, ajuste o teste de `existsSync` para fora, e diga isso no relatório.
- [ ] **Step 5:** Verificação dos Global Constraints → PASS.
- [ ] **Step 6:** Commit `feat(previsao): o impacto da parcela em peças do design system` + commit do grafo.
