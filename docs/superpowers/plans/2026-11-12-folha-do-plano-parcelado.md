# Folha do plano parcelado — plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O "ver parcelas" do card "Compra parcelada" do detalhe abre uma folha só do plano (resumo, barra, números, parcelas) com as ações editar plano, encerrar parcelamento e excluir compra.

**Architecture:** Regras puras novas em `src/lib/detalhe/plano.ts` (estado do plano, linhas com data e estado, fim). Uma mutação `encerrarInstallmentPlan` em `src/lib/transactions/mutations.ts`. O formulário ganha a abertura no escopo "plano". A folha é uma composição em `src/components/transactions/detalhe/folha-do-plano.tsx`, montada pelo `TransactionDetailSheet` e aberta pelo `BlocoParcelada`.

**Tech Stack:** Next 16, React 19, Tailwind v4, Supabase, Vitest (funções puras e testes que leem a fonte), `date-fns` 4.

**Spec:** `docs/superpowers/specs/2026-11-12-folha-do-plano-parcelado-design.md`

**Desvio do spec (chamada minha):** "excluir compra" reusa o `onDelete` do detalhe, que já confirma antes de apagar e já apaga o plano inteiro a partir de uma parcela (`deleteTransactionsByIds` → `delete_workspace_installment_plan_cascade`). A frase da confirmação é a de hoje, sem a contagem de parcelas que o spec pedia.

## Global Constraints

- Só componentes do design system, nada novo em `src/components/ui/` nem em `globals.css` (precisa de ok do dono). Faltou peça: pare e reporte.
- Tokens só; rótulos de botão em minúscula (o `Button` põe a maiúscula).
- Três ações juntas usam o `DialogFooter`/`FormActions` do sistema (`primary`, `secondary`, `tertiary` pelo `TresAcoesContext`); o destrutivo confirma num `AlertDialog`.
- Encerrar nunca apaga parcela; nada é gravado no banco sem a confirmação da pessoa. O banco de dev é o de produção: **nenhum teste ou verificação grava dados**.
- Convidado: sem folha; o "ver parcelas" continua o link `/transactions?plan=id`.
- Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Sem push. `git add` só dos próprios arquivos (nunca `graphify-out/`). Depois de mexer no código: `graphify update .`.

## Review Focus

- Plano com parcela final de valor diferente (`final_installment_amount` ≠ `installment_amount`): a última linha mostra o valor final.
- Plano encerrado com `next_billing_date` antigo: as linhas não lançadas viram "não será lançada" com data "—", nunca uma data projetada.
- Plano quitado (`!is_active`, `generated_count >= total_installments`): sem "encerrar", sem "próxima", `Badge` "quitado".
- Lançamento aberto que é uma parcela sem `installment_sequence`: o slot dele vem do `buildInstallmentScheduleRows` (pelo `transactionId`), não do `kn`.
- Folha aberta e plano editado: depois de salvar, as parcelas e o resumo relidos refletem o novo número de parcelas.

---

### Task 1: regras do plano e a mutação de encerrar

**Files:**
- Create: `src/lib/detalhe/plano.ts`
- Test: `src/lib/detalhe/plano.test.ts`
- Modify: `src/lib/transactions/mutations.ts` (junto de `updateInstallmentPlan`)

**Interfaces:**
- Consumes: `InstallmentScheduleRow` de `@/lib/installment-schedule-rows`; `TransactionInstallmentPlanRef` de `@/lib/supabase`.
- Produces, em `src/lib/detalhe/plano.ts`:
  - `type EstadoDoPlano = "ativo" | "quitado" | "encerrado"`
  - `estadoDoPlano(p: Pick<TransactionInstallmentPlanRef, "is_active" | "generated_count" | "total_installments">): EstadoDoPlano` — `is_active` → ativo; senão `generated_count >= total_installments` → quitado; senão encerrado.
  - `type LinhaDoPlano = { slot: number; transactionId: string | null; data: string | null; valor: number; estado: "lancada" | "prevista" | "nao-sera-lancada" }`
  - `linhasDoPlano(p: Pick<TransactionInstallmentPlanRef, "is_active" | "generated_count" | "total_installments" | "next_billing_date">, rows: InstallmentScheduleRow[]): LinhaDoPlano[]` — `posted` → lancada com a `date` dela (ymd local via `transactionLocalYmd`); pendente com plano ativo e `next_billing_date` → prevista, data = `next_billing_date` + (slot − primeiro slot pendente) meses (`addMonths` do `date-fns`, devolvida em ymd); pendente com plano não ativo, ou sem `next_billing_date` → nao-sera-lancada (com plano ativo e sem data: prevista com `data: null`).
  - `fimDoPlano(linhas: LinhaDoPlano[]): string | null` — a data da última linha que não é nao-sera-lancada.
- Produces, em `mutations.ts`: `encerrarInstallmentPlan(planId: string): Promise<{ ok: true } | { ok: false; errorMessage: string }>` — `update({ is_active: false })` em `workspace_installment_plans` pelo `id`, com `.select("id")`; zero linhas devolvidas é erro ("Não foi possível encerrar o parcelamento."); sucesso chama `dispatchFinanceTransactionsMutated()`.

- [ ] **Step 1: Testes que falham** em `plano.test.ts`:
  - `estadoDoPlano({ is_active: true, generated_count: 5, total_installments: 12 })` → `"ativo"`; `({ is_active: false, generated_count: 12, total_installments: 12 })` → `"quitado"`; `({ is_active: false, generated_count: 5, total_installments: 12 })` → `"encerrado"`.
  - Plano ativo de 4, `next_billing_date: "2026-12-11"`, rows com slots 1–2 posted (`date: "2026-10-11T12:00:00Z"`, `"2026-11-11T12:00:00Z"`) e 3–4 pending, último `parcelAmount` 120 e os outros 100: linhas = `[lancada "2026-10-11" 100, lancada "2026-11-11" 100, prevista "2026-12-11" 100, prevista "2027-01-11" 120]`; `fimDoPlano` → `"2027-01-11"`.
  - O mesmo plano com `is_active: false`: slots 3–4 → `nao-sera-lancada` com `data: null`; `fimDoPlano` → `"2026-11-11"`.
  - `next_billing_date: "2027-01-31"` com dois pendentes: a segunda prevista cai em `"2027-02-28"`.
  - Teste de fonte para a mutação: `mutations.ts` contém `export async function encerrarInstallmentPlan` e `is_active: false`.
- [ ] **Step 2:** `npx vitest run src/lib/detalhe/plano.test.ts` → FAIL.
- [ ] **Step 3:** Implementar `plano.ts` e `encerrarInstallmentPlan`.
- [ ] **Step 4:** `npx vitest run src/lib/detalhe src/lib/transactions && npx tsc --noEmit` → PASS.
- [ ] **Step 5:** Commit `feat(parcelada): regras do plano e encerrar parcelamento`.

### Task 2: o formulário abre no escopo do plano, e as parcelas recarregam

**Files:**
- Modify: `src/components/transactions/transaction-form-use.tsx` (o estado `installmentEditScope`, l. ~229, e o reset que grava `installmentEditScope: "slice"`, l. ~299 e ~322)
- Modify: `src/components/transactions/installment-purchase-section.tsx` (`useInstallmentSlices`)
- Modify: `src/components/transactions/transaction-detail-sheet.tsx`
- Test: `src/components/transactions/transaction-detail-sheet.test.ts` (asserções na fonte)

**Interfaces:**
- Produces:
  - `useTransactionForm({ …, initialInstallmentEditScope?: "slice" | "plan" })` — o reset usa esse valor no lugar do `"slice"` fixo (padrão `"slice"`), e aplica `syncFieldsForInstallmentScope("plan")` quando for `"plan"`, para os campos virem do plano. O seletor de escopo continua no formulário.
  - `useInstallmentSlices(planId, open, versao = 0)` — `versao` entra nas dependências do efeito: mudar recarrega.
  - No `TransactionDetailSheet`: estado `escopoAoEditar: "slice" | "plan"` (padrão `"slice"`, volta a `"slice"` ao sair da edição) passado como `initialInstallmentEditScope`; estado `versaoDasParcelas` passado ao `useInstallmentSlices` e somado 1 no `onSuccess` do formulário; e a função `editarPlano()`, que põe `escopoAoEditar = "plan"` e `detailMode = "edit"`.

- [ ] **Step 1: Teste que falha** (fonte): `transaction-form-use.tsx` casa `/initialInstallmentEditScope/`; `installment-purchase-section.tsx` casa `/useInstallmentSlices\(\s*planId[^)]*versao/`; `transaction-detail-sheet.tsx` contém `initialInstallmentEditScope: escopoAoEditar` e `const editarPlano`.
- [ ] **Step 2:** `npx vitest run src/components/transactions/transaction-detail-sheet.test.ts` → FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** `npx tsc --noEmit && npx vitest run src/components/transactions` → PASS.
- [ ] **Step 5:** Commit `feat(parcelada): o formulário abre no escopo do plano`.

### Task 3: a folha do plano, ligada ao detalhe

**Files:**
- Create: `src/components/transactions/detalhe/folha-do-plano.tsx`
- Modify: `src/components/transactions/detalhe/bloco-parcelada.tsx`
- Modify: `src/components/transactions/transaction-detail-sheet.tsx`
- Test: `src/components/transactions/detalhe/blocos.test.ts` (fonte)
- Modify: `docs/JORNADAS.md`, `docs/atlas/template.html`, o gerado `docs/atlas/atlas-jornadas.html`

**Interfaces:**
- Consumes: Task 1 (`estadoDoPlano`, `linhasDoPlano`, `fimDoPlano`, `encerrarInstallmentPlan`); Task 2 (`editarPlano`, `versaoDasParcelas`); `fetchTransactionForDetailSheet` de `@/lib/transactions-detail-sheet-query`; `diaMesCurto`, `mesPorExtenso` de `@/lib/detalhe/blocos`.
- Produces:
  - `FolhaDoPlano({ open, onOpenChange, transaction, plano, resumo, onEditar, onExcluir, onAbrirParcela, onEncerrado }: { open: boolean; onOpenChange: (o: boolean) => void; transaction: Transaction; plano: TransactionInstallmentPlanRef; resumo: InstallmentSummary; onEditar: () => void; onExcluir: () => void; onAbrirParcela: (transactionId: string) => void; onEncerrado: () => void })`.
  - `BlocoParcelada` ganha `onVerParcelas?: () => void`: com ela, o "ver parcelas" é um `Button` (o mesmo `tertiary sm` da casca) que a chama; sem ela, o link de hoje. `BlocoContexto` ganha, para isso, `link` também na forma `{ label: string; onClick: () => void }`.

- [ ] **Step 1: Teste que falha** (fonte) em `blocos.test.ts`, `it("parcelada: a folha do plano")`: `folha-do-plano.tsx` contém `linhasDoPlano(`, `estadoDoPlano(`, `encerrarInstallmentPlan(`, `<AlertDialog`, `"encerrar parcelamento"`, `"excluir compra"`, `"editar plano"`, `segments=`; `bloco-parcelada.tsx` contém `onVerParcelas`; `transaction-detail-sheet.tsx` contém `<FolhaDoPlano` e `fetchTransactionForDetailSheet(`.
- [ ] **Step 2:** `npx vitest run src/components/transactions/detalhe` → FAIL.
- [ ] **Step 3: A folha.** `Sheet` com `SheetContent` (`size="md"`; no telefone vira gaveta sozinho), aninhada no `Sheet` do detalhe. Cromagem do `Dialog`: `DialogHeader` com o título "Compra parcelada" e o `DialogCloseButton`; `DialogBody` com, em ordem: identidade (`ColorTile` da categoria pela `tileColorFor`, descrição do plano, categoria · cartão pelo nome ou o meio); o número (`MoneyDisplay size="lg"` do que falta e `Caption` "faltam X de N · de R$ total"; quitado: o total + `Badge` "quitado"; encerrado: o lançado + `Badge` "encerrado"); `Progress value={lancadas} max={n} segments={n}` com `highlight` no slot do lançamento aberto (achado pelo `transactionId` nas linhas, senão pelo `kn`); `DescriptionList` com "parcela" (`installment_amount`), "próxima" (`diaMesCurto(next_billing_date)`, só ativo) e "termina em" (`mesPorExtenso` do `fimDoPlano`); e a lista (`ItemGroup` de `Item`): "k/N", a data (`diaMesCurto`, ou "—"), um `Badge` do estado (`lançada` neutral, `prevista` warning, `não será lançada` outline) e o valor (`MoneyDisplay`). A linha do lançamento aberto vai `selected`. Linha lançada é `Item asChild` com `<button type="button">` que chama `onAbrirParcela(transactionId)`. `DialogFooter` com `start` = "excluir compra" (chama `onExcluir` direto: a confirmação é a que o `onDelete` de quem monta o detalhe já abre — `tela.excluir` pede antes de apagar; um `AlertDialog` aqui confirmaria duas vezes), e à direita "encerrar parcelamento" (só `ativo`; `AlertDialog` com `AlertDialogAction variant="primary"`: "Encerrar o parcelamento?", "As N parcelas lançadas ficam. As próximas não serão lançadas."; `pending` enquanto grava; sucesso: `toastSuccess("Parcelamento encerrado")` e `onEncerrado()`; erro: `toastError` com a mensagem) e "editar plano" (`primary`, chama `onEditar`).
- [ ] **Step 4: Ligar.** No `TransactionDetailSheet`: estado `folhaDoPlano` (bool); passa `onVerParcelas={() => setFolhaDoPlano(true)}` ao `BlocoParcelada` só quando `papel !== "guest"`; monta `<FolhaDoPlano>` com `plano`/`resumo`/`kn` que o detalhe já calcula; `onEditar` fecha a folha e chama `editarPlano()`; `onExcluir` fecha a folha e chama `onDelete(t)` (o fluxo de exclusão que já apaga o plano inteiro de uma parcela); `onAbrirParcela(id)` busca com `fetchTransactionForDetailSheet` (workspace e cartões que o detalhe já tem) e chama `onNavegar?.(tx)`, fechando a folha — sem `onNavegar`, as linhas não são clicáveis; `onEncerrado` soma 1 a `versaoDasParcelas` e relê o plano (o mesmo `planFallback`/invalidação que o detalhe usa).
- [ ] **Step 5: Jornada.** `docs/JORNADAS.md`, no detalhe do lançamento: "Ver parcelas" (adulto) abre a folha do plano; dela, editar → formulário no escopo do plano; encerrar → `AlertDialog` → `is_active = false`; excluir → o fluxo de exclusão de hoje; tocar numa parcela lançada → o detalhe dela. Convidado segue em `/transactions?plan=id`. Espelhar em `docs/atlas/template.html` e rodar `python3 docs/atlas/build.py`.
- [ ] **Step 6:** `npx tsc --noEmit && npm run lint && npx vitest run src/lib/detalhe src/components/transactions && npm run ds:audit -- src/components/transactions/detalhe` → PASS, sem achado novo.
- [ ] **Step 7:** Commit `feat(parcelada): a folha do plano no detalhe`.
