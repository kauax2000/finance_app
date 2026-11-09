# Conferir fatura com correções — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** a conferência de fatura do cartão explica o porquê de cada diferença, sugere a correção, aplica (todas de uma vez ou uma por uma, com desfazer) e aprova sozinha a fatura que fica 100% igual ao banco.

**Architecture:** a lógica é pura e testada em `src/lib/fatura/`:
- `correcoes.ts` transforma a conferência em correções sugeridas;
- `estado.ts` diz se a fatura está aprovada;
- `aplicar-correcoes.ts` grava e desfaz, com o `db` injetado.

A tela é um wireframe novo, `corrigir-fatura-wireframe.tsx`, que entra no lugar das listas do `conferir-fatura-wireframe.tsx`. Uma migração acrescenta `approved_at` e `approved_by` ao total do banco.

**Tech Stack:** Next 16, React 19, TypeScript, Supabase, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-09-corrigir-fatura-design.md`

## Global Constraints

- **Leitura e exploração**:
  - Leia o `AGENTS.md` da raiz, seções "Funcionalidade nova entra em wireframe", "Forms and Enter-to-submit" e "Jornadas do app".
  - Explore com `graphify query "<pergunta>"` antes do primeiro grep.
- **Wireframe**:
  - Só em `src/components/wireframe/`, com controles nativos (`<button type="button">`, `<input>`, `<select>`).
  - Nenhum import de `@/components/ui/`.
  - A moldura é o `WireframeBox` com `bloco={2}`.
- **Banco de dev é produção**:
  - Nos testes, o `supabase` é sempre um falso que grava as chamadas, no estilo de `src/lib/import/importar.test.ts`.
  - No navegador, só abra a página do cartão e leia. Nunca envie arquivo, aplique, aprove nem grave: com a fatura de outubro já igual, enviar o PDF aprovaria a fatura em produção.
  - A migração é só o arquivo. Aplicá-la em produção pede um pedido explícito do dono, fora deste plano.
- **Toda escrita em `transactions` e `workspace_subscriptions`** filtra também por `workspace_id`.
- **Copy exata**, em português:
  - "100% igual ao banco"
  - "Aprovada em dd/mm/aaaa"
  - "Mudou depois da aprovação: diferença R$ x"
  - "Aprovar todas (N)"
  - "Revisar uma por uma"
  - "Corrigir"
  - "Pular"
  - "Aplicar escolhidas (N)"
  - "Desfazer"
  - "Apagar"
  - "Mudar forma de pagamento"
  - "Manter"
- **Títulos dos motivos**, nesta ordem: "Fora do período", "Falta no app", "Valor diferente", "Parcela fora de sequência", "Só no app".
- **Branch `finance-app-2.0`**:
  - Os commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
  - Sem push.
  - Não adicione `CLAUDE.md` nem `graphify-out/` aos commits.
- **Antes de cada commit**: `npx vitest run <arquivos do task>`, `npx tsc --noEmit` e `npx eslint <arquivos do task>`. Não rode prettier.

## Review Focus

1. **Falha no meio do lote**: a rede cai depois de 3 de 8 updates. A pessoa espera que nada fique pela metade, ou seja, que o que foi feito seja desfeito e o erro apareça. Teste na Task 2.
2. **Desfazer um "Apagar"**: o lançamento volta com o mesmo `id` e os mesmos campos. O trigger `transactions_notify_created` avisa os membros de novo, e isso é aceito. Teste na Task 2: a linha reinserida é a do snapshot.
3. **Fatura sem nenhuma diferença**: a aprovação automática roda uma vez por leitura, não a cada render, e não roda se a migração não estiver aplicada. Nesse caso aparece o erro, sem laço. Teste na Task 4: guarda por `ref`.
4. **O mesmo lançamento com duas correções** (fora do período e valor diferente, como a Gasolina de 25/09 com R$ 228,14): sai num update só, e o impacto somado é o valor do banco. Teste na Task 1 e na Task 2.
5. **Estorno no cartão** (`type: "income"`): o impacto tem sinal negativo, e a soma "app + impactos" continua igual à do banco. Teste na Task 1.

---

### Task 1: Correções sugeridas (puro)

**Files:**
- Create: `src/lib/fatura/correcoes.ts`
- Create: `src/lib/fatura/correcoes.test.ts`
- Modify: `src/lib/fatura/conferir.ts`, para acrescentar `subscription_id?: string | null` ao `LancamentoParaConferir`
- Modify: `src/lib/fatura/ciclo.ts`, para exportar `export type ConferenciaNoCiclo<T extends ItemBanco> = ReturnType<typeof conferirNoCiclo<T>>`

**Interfaces:**
- Produces:

```ts
export type Motivo = "fora-do-periodo" | "falta-no-app" | "valor-diferente" | "parcela"
export type Correcao =
    | { id: string; motivo: "fora-do-periodo"; appId: string; descricao: string; de: string; para: string; novaDescricao: string; impacto: number }
    | { id: string; motivo: "falta-no-app"; item: ItemImportavel; impacto: number }
    | { id: string; motivo: "valor-diferente"; appId: string; descricao: string; de: number; para: number; assinaturaId: string | null; impacto: number }
    | { id: string; motivo: "parcela"; appId: string; descricao: string; de: number | null; para: number; impacto: 0 }
export type FormaForaDoCartao = Exclude<TransactionPaymentMethod, "credit_card">
export type DecisaoSoNoApp = "apagar" | "manter" | { forma: FormaForaDoCartao }
export const TITULO_DO_MOTIVO: Record<Motivo | "so-no-app", string>
export function sugerirCorrecoes(conf: ConferenciaNoCiclo<ItemImportavel>, ciclo: CicloFatura): Correcao[]
export function impactoDaDecisao(a: LancamentoParaConferir, d: DecisaoSoNoApp | undefined): number
export function agruparPorMotivo(c: Correcao[]): Array<{ motivo: Motivo; titulo: string; correcoes: Correcao[]; impacto: number }>
```

**Regras:**
- O `id` é `` `${motivo}:${appId ou item.clientId}` ``.
- **Sinal**: `+1` para `expense` e `−1` para `income`/estorno.
- **Fora do período** é todo par de `bate`, `valorDiferente` e `parcelaForaDeSequencia` cujo `app.date` está fora de `[ciclo.inicio, ciclo.fechamento]`.
  - `para` = `ciclo.inicio` se antes, `ciclo.fechamento` se depois.
  - `novaDescricao` = `` `${descricao} · compra em dd/mm` ``, da data do app.
  - `impacto` = `sinal × app.amount`.
- **Falta no app**: `impacto` = `sinal × item.valor`.
- **Valor diferente**: `impacto` = `sinal × (para − de)`, e `assinaturaId` = `app.subscription_id ?? null`.
- **Parcela**: `de` = `app.installment_sequence` e `para` = `banco.parcela.k`.
- **`impactoDaDecisao`**: `"apagar"` e `{ forma }` dão `−sinal × amount`; `"manter"` e `undefined` dão 0.
- **`agruparPorMotivo`**: segue a ordem dos títulos e omite os grupos vazios.
- Todo valor é arredondado com `roundCents`.

- [ ] **Step 1: Write the failing test**, `correcoes.test.ts`, com a fixture de outubro:

  - Ciclo: `{ inicio: "2026-09-27", fechamento: "2026-10-26" }`.
  - Banco (`ItemImportavel`, via `prepararItens`):

    | Data | Descrição | Valor | Parcela |
    | --- | --- | --- | --- |
    | 2026-09-25 | Gasolina | 228.13 | – |
    | 2026-09-26 | Pizza | 43.28 | – |
    | 2026-10-01 | Cafe | 23.00 | – |
    | 2026-10-01 | Labres Pizzaria | 30.00 | – |
    | 2026-10-26 | Meli+ | 19.90 | – |
    | 2026-09-29 | Kimono | 87.45 | `{k:5,n:5}` |

  - App:

    | id | Data | Descrição | Valor | Outros campos |
    | --- | --- | --- | --- | --- |
    | `g` | 2026-09-25 | Gasolina | 228.14 | – |
    | `p` | 2026-09-26 | Pizza | 43.28 | – |
    | `c` | 2026-10-01 | Cafe | 24 | – |
    | `m` | 2026-10-26 | Meli+ | 20 | `subscription_id "s1"` |
    | `k` | 2026-09-29 | Kimono | 87.45 | `installment_sequence 4` |
    | `f` | 2026-10-23 | Perfume | 107 | – |

  - A conferência é `conferirNoCiclo(banco, app, ciclo)`. Os testes:

```ts
it("fora do período leva ao primeiro dia do ciclo e guarda a data real", () => {
    const g = sugerir().find((c) => c.id === "fora-do-periodo:g")
    expect(g).toMatchObject({ de: "2026-09-25", para: "2026-09-27", novaDescricao: "Gasolina · compra em 25/09", impacto: 228.14 })
})
it("o mesmo lançamento fora do período e com valor diferente gera as duas, e o impacto somado é o do banco", () => {
    const doG = sugerir().filter((c) => "appId" in c && c.appId === "g")
    expect(doG.map((c) => c.motivo).sort()).toEqual(["fora-do-periodo", "valor-diferente"])
    expect(roundCents(doG.reduce((s, c) => s + c.impacto, 0))).toBe(228.13)
})
it("valor diferente de assinatura traz a assinatura", () => {
    expect(sugerir().find((c) => c.id === "valor-diferente:m")).toMatchObject({ de: 20, para: 19.9, assinaturaId: "s1", impacto: -0.1 })
})
it("parcela fora de sequência sugere o número do banco", () => {
    expect(sugerir().find((c) => c.id === "parcela:k")).toMatchObject({ de: 4, para: 5, impacto: 0 })
})
it("falta no app vira criar", () => {
    expect(sugerir().filter((c) => c.motivo === "falta-no-app").map((c) => c.impacto)).toEqual([30])
})
it("aceitar tudo e apagar o que só está no app fecha com o banco", () => {
    const perfume = conf.soNoApp.find((a) => a.id === "f")!
    const soma = conf.somaApp + sugerir().reduce((s, c) => s + c.impacto, 0) + impactoDaDecisao(perfume, "apagar")
    expect(roundCents(soma)).toBe(conf.somaBanco)
})
it("estorno tem impacto negativo", () => { /* banco: estorno 10 que falta no app → impacto −10 */ })
it("manter e sem decisão não mudam nada", () => {
    expect(impactoDaDecisao(perfume, "manter")).toBe(0)
    expect(impactoDaDecisao(perfume, undefined)).toBe(0)
})
it("agrupa na ordem dos motivos e soma o impacto", () => {
    expect(agruparPorMotivo(sugerir()).map((g) => g.titulo)).toEqual(["Fora do período", "Falta no app", "Valor diferente", "Parcela fora de sequência"])
})
```

- [ ] **Step 2:** Rode `npx vitest run src/lib/fatura/correcoes.test.ts`. Esperado: FAIL, módulo inexistente.
- [ ] **Step 3:** Implemente `correcoes.ts` e as duas mudanças de tipo.
- [ ] **Step 4:** Rode `npx vitest run src/lib/fatura/`. Esperado: PASS, com os testes antigos de `ciclo` e `conferir` intactos.
- [ ] **Step 5:** Commit `feat(fatura): correções sugeridas a partir da conferência`.

### Task 2: Aplicar e desfazer (com `db`)

**Files:**
- Create: `src/lib/fatura/aplicar-correcoes.ts`
- Create: `src/lib/fatura/aplicar-correcoes.test.ts`
- Modify: `src/lib/import/importar.ts:22` — `export type SourceImportacao` (hoje não é exportado)

**Interfaces:**
- Consumes: `Correcao`, `DecisaoSoNoApp` (Task 1); `importarLancamentos`, `desfazerImportacao` e `SourceImportacao` de `@/lib/import/importar`; `ajustarAoCiclo` e `CicloFatura`.
- Produces:

```ts
export type ContextoDeCorrecao = { userId: string; workspaceId: string; cardId: string; ciclo: CicloFatura; source: SourceImportacao; batchId: string }
export type LoteAplicado = {
    workspaceId: string
    batchId: string | null                       // null se nada foi criado
    antes: Array<{ id: string; date: string; description: string | null; amount: number; installment_sequence: number | null; payment_method: string | null; payment_credit_card_id: string | null }>
    apagados: Array<Record<string, unknown>>     // a linha inteira (select *)
    assinaturas: Array<{ id: string; amount: number }>
}
export async function aplicarCorrecoes(db: SupabaseClient, ctx: ContextoDeCorrecao, correcoes: Correcao[], decisoes: ReadonlyMap<string, DecisaoSoNoApp>): Promise<{ ok: true; lote: LoteAplicado; aplicadas: number } | { ok: false; erro: string }>
export async function desfazerCorrecoes(db: SupabaseClient, lote: LoteAplicado): Promise<{ ok: true } | { ok: false; erro: string }>
```

**Ordem do `aplicarCorrecoes`:**
1. **Ler antes de escrever**: `select` dos lançamentos tocados (nos apagados, `*`) e das assinaturas.
2. **Juntar por `appId` num patch só**, com um `update` por lançamento:
   - `date` vira `para` às `T12:00:00Z`, e `description` vira `novaDescricao`;
   - `amount`;
   - `installment_sequence`;
   - `payment_method` e `payment_credit_card_id: null`, quando a decisão é `{ forma }`.
3. **Assinaturas**: `update workspace_subscriptions set amount`.
4. **Apagar**: `delete` dos lançamentos com decisão `"apagar"`.
5. **Criar**: `importarLancamentos(db, ctx, ajustarAoCiclo(itens, ctx.ciclo), { tipo: "cartao", cardId }, ctx.source, ctx.batchId)`.
6. **Qualquer erro**: chama `desfazerCorrecoes` com o lote parcial e devolve `{ ok: false, erro }`.

`aplicadas` conta correções mais decisões diferentes de `"manter"`.

**`desfazerCorrecoes`**:
- devolve cada linha de `antes` com `update`;
- reinsere `apagados` com `insert`, mantendo o mesmo `id`;
- devolve o `amount` das assinaturas;
- se `batchId`, chama `desfazerImportacao`.

- [ ] **Step 1: Write the failing test**, com um `db` falso que grava `{ tabela, op, valores, filtros }` e pode falhar na n-ésima escrita:
  - `"junta fora do período e valor do mesmo lançamento num update só"`: um `update` em `transactions` para `g` com `{ date: "2026-09-27T12:00:00Z", description: "Gasolina · compra em 25/09", amount: 228.13 }`.
  - `"assinatura recebe o valor do banco"`: `update` em `workspace_subscriptions` com `{ amount: 19.9 }`, `id: "s1"` e o `workspace_id`.
  - `"mudar forma tira do cartão"`: `{ payment_method: "pix", payment_credit_card_id: null }`.
  - `"manter não escreve nada"`: nenhuma chamada para aquele id.
  - `"criar usa o lote e ajusta ao ciclo"`: `upsert` com `import_batch_id === ctx.batchId`.
  - `"toda escrita filtra pela carteira"`: cada `update`/`delete` tem `eq("workspace_id", ctx.workspaceId)`.
  - `"falha no meio desfaz o que já foi feito"`: falha na 3ª escrita, retorna `ok: false`, e as duas primeiras voltam com os valores do snapshot.
  - `"desfazer reinsere o apagado igual e apaga o lote criado"`.
- [ ] **Step 2:** Rode `npx vitest run src/lib/fatura/aplicar-correcoes.test.ts`. Esperado: FAIL.
- [ ] **Step 3:** Implemente.
- [ ] **Step 4:** Rode de novo. Esperado: PASS.
- [ ] **Step 5:** Commit `feat(fatura): aplicar e desfazer as correções em lote`.

### Task 3: Aprovação: migração, estado e gravação

**Files:**
- Create: `supabase/migrations/20261109120000_fatura_aprovada.sql`:
  - `alter table public.credit_card_statement_totals add column if not exists approved_at timestamptz null, add column if not exists approved_by uuid null references auth.users(id) on delete set null;`
  - o índice `idx_cc_statement_totals_approved_by_fk`, no padrão do `created_by` em `20261022120000_fatura_que_bate.sql`.
- Modify: `src/lib/supabase.ts`, para acrescentar `approved_at: string | null` e `approved_by: string | null` em `CreditCardStatementTotal`.
- Modify: `src/lib/fatura/total-com-banco.ts`, para acrescentar `totalDoCiclo(totais, cardId, closeYmd): CreditCardStatementTotal | null`. O `bancoTotalDoCiclo` passa a usá-lo.
- Create: `src/lib/fatura/estado.ts`
- Create: `src/lib/fatura/estado.test.ts`
- Create: `src/lib/fatura/aprovar.ts`

**Interfaces:**
- Produces:

```ts
export function somaDoCiclo(app: LancamentoParaConferir[], ciclo: CicloFatura): number   // expense +, income −, só dentro do ciclo
export function semDiferencas(conf: ConferenciaNoCiclo<ItemBanco>, ciclo: CicloFatura): boolean // sugerirCorrecoes vazio e soNoApp vazio
export type EstadoDaFatura =
    | { tipo: "sem-total" } | { tipo: "a-conferir"; diferenca: number } | { tipo: "igual" }
    | { tipo: "aprovada"; em: string } | { tipo: "mudou-depois"; diferenca: number; em: string }
export function estadoDaFatura(total: CreditCardStatementTotal | null, somaApp: number): EstadoDaFatura
export async function aprovarFatura(db: SupabaseClient, a: { workspaceId: string; userId: string; cardId: string; fechamento: string; bankTotal: number; source: CreditCardStatementTotalSource }): Promise<{ ok: true } | { ok: false; erro: string }>
```

**Regras:**
- **`estadoDaFatura`**, com `diferenca = roundCents(bank_total − somaApp)`:
  - sem total: `sem-total`;
  - `approved_at` e diferença 0: `aprovada`;
  - `approved_at` e diferença diferente de 0: `mudou-depois`;
  - sem `approved_at` e diferença 0: `igual`;
  - senão: `a-conferir`.
- **`aprovarFatura`** faz o mesmo `upsert` do `gravarTotal` do wireframe (`onConflict: "workspace_id,credit_card_id,statement_close_date"`), com `approved_at: new Date().toISOString()` e `approved_by: userId`.

- [ ] **Step 1: Write the failing test**, `estado.test.ts`, com uma linha de `estadoDaFatura` para cada um dos 5 estados:
  - `{bank_total: 9480.97, approved_at: null}` com soma 9480.97 dá `igual`;
  - com `approved_at` e soma 9470.97 dá `mudou-depois` com diferença 10.

  Também:
  - `somaDoCiclo`: ignora fora do ciclo e conta o estorno negativo;
  - `semDiferencas`: falso com um só no app, verdadeiro com tudo em `bate` dentro do ciclo.
- [ ] **Step 2:** Rode `npx vitest run src/lib/fatura/estado.test.ts src/lib/fatura/total-com-banco.test.ts`. Esperado: FAIL só no `estado`.
- [ ] **Step 3:** Implemente a migração, os tipos, o `totalDoCiclo`, o `estado.ts` e o `aprovar.ts`.
- [ ] **Step 4:** Rode de novo, mais `npx tsc --noEmit`. Esperado: PASS.
- [ ] **Step 5:** Commit `feat(fatura): fatura aprovada (migração, estado e gravação)`.

### Task 4: O wireframe de corrigir

**Files:**
- Create: `src/components/wireframe/corrigir-fatura-wireframe.tsx`
- Modify: `src/components/wireframe/conferir-fatura-wireframe.tsx`:
  - o `doApp` leva `subscription_id`;
  - a linha de estado fica logo abaixo do seletor de ciclo;
  - "100% igual ao banco" com a aprovação automática;
  - o `<CorrigirFatura>` entra no lugar das listas "Falta no app", "Só no app", "Valor diferente" e "Parcela fora de sequência", do botão "Importar selecionados" e do estado `desmarcados`;
  - "Bate" fica.
- Modify: `src/components/wireframe/wireframe.test.ts`

**Interfaces:**
- Consumes: as Tasks 1 a 3.
- Produces: `export function CorrigirFatura(p: { conferencia: ConferenciaNoCiclo<ItemImportavel>; ciclo: CicloFatura; ctx: ContextoDeCorrecao; onAplicado: () => Promise<void> })`.

**Comportamento:**
- **Resumo** (o padrão):
  - A primeira linha é "App R$ x · Banco R$ y · diferença R$ z".
  - Cada grupo de `agruparPorMotivo` vem como `<h3>` "Título · N · impacto", com uma linha por correção dizendo de → para.
  - O grupo "Só no app" vem por último. Cada item tem três `<input type="radio">` sem marcação inicial: "Apagar", "Mudar forma de pagamento" (com um `<select>` das `FormaForaDoCartao`, que vale quando o rádio está marcado) e "Manter".
  - Os botões "Aprovar todas (N)" e "Revisar uma por uma" ficam lado a lado.
- **"Aprovar todas"**: chama `aplicarCorrecoes` com todas as correções e as decisões já feitas.
- **Fila**:
  - Mostra "k de N", uma correção por vez, com "Corrigir" e "Pular".
  - Um item só no app mostra os três rádios, e "Pular" vale como "Manter".
  - No fim: "Novo total: R$ x" (soma do app mais os impactos escolhidos) e "Aplicar escolhidas (N)".
- **Depois de aplicar**:
  - Aparece o aviso "N correções aplicadas." e o botão "Desfazer", que chama `desfazerCorrecoes` e some depois do uso.
  - O `onAplicado` recarrega, e a conferência roda de novo.
- **Pendências**: com `pendente`, todos os botões ficam desabilitados.
- **Erro**: aparece num `role="alert"`.
- **No `conferir-fatura-wireframe`**:
  - A linha de estado usa `estadoDaFatura(totalDoCiclo(...), somaDoCiclo(doApp, ciclo))`: "Aprovada em dd/mm/aaaa", "Mudou depois da aprovação: diferença R$ x", "Igual ao banco", "Diferença R$ x" ou nada.
  - Com a leitura feita e `semDiferencas`, mostra "100% igual ao banco" com os dois totais e chama `aprovarFatura` uma vez por leitura (um `useRef` com o `batchId` já aprovado). O `bankTotal` é `leitura.total ?? conferencia.somaBanco`.
  - Um erro da aprovação vai para o `aviso` e não tenta de novo.

- [ ] **Step 1: Write the failing test**, em `wireframe.test.ts`, lendo a fonte:
  - `corrigir-fatura-wireframe.tsx` contém "Aprovar todas", "Revisar uma por uma", "Corrigir", "Pular", "Desfazer", "Apagar", "Mudar forma de pagamento" e "Manter";
  - nenhum `@/components/ui/`;
  - todo `<button` tem `type`;
  - `conferir-fatura-wireframe.tsx` importa `CorrigirFatura` e `aprovarFatura` e contém "100% igual ao banco" e `useRef`;
  - "Importar selecionados" não existe mais.
- [ ] **Step 2:** Rode `npx vitest run src/components/wireframe/wireframe.test.ts`. Esperado: FAIL nos novos.
- [ ] **Step 3:** Implemente.
- [ ] **Step 4:** Rode `npx vitest run src/components/wireframe/ src/lib/fatura/`, `npx tsc --noEmit` e `npx eslint src/components/wireframe/ src/lib/fatura/`. Esperado: PASS.
- [ ] **Step 5: Conferir na tela, só leitura.** Use `preview_start` com `dev-attach` (o `next dev` já roda em :3000) e abra `/credit-cards/fba50ad4-fa76-4b75-9f2e-e25a2dcd577d`. O bloco "WIREFRAME · Bloco 2 · Conferir fatura" aparece com a linha de estado, e não há erro no console. **Não envie arquivo nem clique em nada que grave.**
- [ ] **Step 6:** Commit `feat(fatura): corrigir a fatura em wireframe — aprovar todas ou uma por uma`.

### Task 5: Jornadas, Atlas e grafo

**Files:**
- Modify: `docs/JORNADAS.md`, na seção 6, "Cartões e faturas":
  - o nó `check` do fluxograma ganha os passos ler, porquê, "Aprovar todas" ou "Revisar uma por uma", aplicar, desfazer e aprovada;
  - a linha "Conferir fatura (Bloco 2)" da tabela de regras ganha as regras do spec;
  - a seta `G6 -->|"conferir fatura importa o que falta"|` do mapa geral vira "conferir fatura corrige e aprova".
- Modify: `docs/atlas/template.html`:
  - o item "Conferir fatura" (perto da linha 697) é reescrito com o fluxo novo;
  - a data e as contagens da capa são atualizadas.

- [ ] **Step 1:** Edite os dois arquivos seguindo a legenda e o `%%{init}%%` do topo do `JORNADAS.md`, sem ids de nó que sejam palavras reservadas do Mermaid.
- [ ] **Step 2:** Rode `python3 docs/atlas/build.py`. Esperado: gera `docs/atlas/atlas-jornadas.html` sem erro.
- [ ] **Step 3:** Republique `docs/atlas/atlas-jornadas.html` no URL do Atlas (https://claude.ai/artifact/1N43LFYP1YSVsWaRMaNTRL) com a ferramenta de Artifact. Sem a ferramenta, diga no relato que o Atlas ficou desatualizado.
- [ ] **Step 4:** Rode `graphify update .`.
- [ ] **Step 5:** Commit `docs(jornadas): conferir fatura corrige e aprova` com `docs/` e sem `graphify-out/`.

## Depois do plano (pede o dono)

Aplicar `20261109120000_fatura_aprovada.sql` em produção, com `supabase db query --linked -f` fora do sandbox. Até lá, a aprovação automática mostra o erro do banco, e o resto funciona.
