# Lançamento inteligente Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar o diálogo de criação de lançamento por uma paleta inteligente (frase + foto → revisão editável → Lançar), ligada por um interruptor em Configurações.

**Architecture:** `TransactionFormDialog` chama `useTransactionForm` uma vez e escolhe a casca: a paleta `LancamentoInteligente` (sobre `CommandDialog`) ou o `Dialog` de hoje. A leitura (parser local ao vivo, IA automática, foto, campos travados) mora em funções puras de `src/lib/captura/lancamento-inteligente.ts` e no hook `useLeituraDoLancamento`; salvar é o mesmo `salvar()` do formulário.

**Tech Stack:** Next 16 (ler `node_modules/next/dist/docs/` antes de mexer em rota), React 19, TanStack Query, cmdk via `@/components/ui/command`, Vitest (ambiente `node`, sem testing-library: testes puros e testes de fonte com `lerFonte`/`semComentarios` de `@/test/fonte`).

**Spec:** `docs/superpowers/specs/2026-10-27-lancamento-inteligente-design.md`

## Global Constraints

- Antes de explorar código, rode `graphify query "<pergunta>"` (regra do `CLAUDE.md`); depois de mudar código, `graphify update .`.
- Não editar `src/components/ui/` nem `src/app/globals.css` (exigem autorização humana). Só compor peças existentes.
- Nenhum `#hex`, `rgb()`, classe crua de paleta (`text-gray-600`) nem valor arbitrário (`p-[13px]`).
- Ícones só Heroicons: `size-4`/sem tamanho → `@heroicons/react/16/solid`; `size-5` → `20/solid`.
- Todo `<button>` cru declara `type`; o `Button` já nasce `type="button"`.
- Dinheiro: `currencyBRL` de `@/lib/formatters`; datas: helpers de `@/lib/transaction-date`.
- Banco de produção: nenhum teste manual grava lançamento sem pedido do dono. Sem migração. Sem deploy de Edge Function.
- Nome da feature na interface: **"Lançamento inteligente"**. Chave de armazenamento: `finance:preferencia:lancamento-inteligente`. Padrão: **ligado**.
- Commits em português, no estilo `feat(lancamento): …`, terminando com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Checagem de cada tarefa: `npx tsc --noEmit && npm run lint && npm run test:unit` verdes.

## Review Focus

- Fechar a paleta (ou reescrever a frase) com a IA lendo: a resposta atrasada não pode aplicar campos (pedido numerado) — teste na Tarefa 4.
- Campo editado à mão e a frase reescrita depois: o campo editado continua o da pessoa — teste na Tarefa 4.
- Crédito sem nenhum cartão ativo: "Lançar" não pode travar pedindo cartão — teste na Tarefa 4 (`faltaParaLancar`).
- Enter durante composição de IME (acento no teclado do Mac/iOS) não lança — teste de fonte na Tarefa 5 (`isComposing`).
- Imagem que não comprime (HEIC sem suporte): mensagem e a paleta segue usável, sem foto anexada — teste na Tarefa 4 (`lerFoto` devolve erro sem chamar `onFoto`).

---

### Task 1: Parser mais esperto (dias da semana, receita, motivo do tipo)

**Files:**
- Modify: `supabase/functions/_shared/frase.ts` (tipo `FraseInterpretada` L11-22; laço de `interpretarFrase` ~L188-300, onde hoje estão `recebi`/`receita`/`salario` ~L281)
- Test: `src/lib/captura/frase.test.ts` (tabela `casos` de `interpretarFrase`)

**Interfaces:**
- Produces: `FraseInterpretada.motivoDoTipo: string | null` — a palavra (como foi escrita) que decidiu receita/estorno/parcelada; `null` para despesa sem marca. Parcelada: o trecho das parcelas ("em 10x", "10x").

- [ ] **Step 1: Testes que falham** — acrescente à tabela `casos` (HOJE da tabela é `2026-04-10`, uma sexta-feira; use um `HOJE_QUARTA = "2026-10-28"` para os dias da semana):

```ts
["sexta 30 pizza", "2026-10-28", { tipo: "expense", valor: 30, data: "2026-10-23", descricao: "Pizza" }],
["na segunda 30 pizza", "2026-10-28", { data: "2026-10-26", descricao: "Pizza" }],
["quarta 30 pizza", "2026-10-28", { data: "2026-10-28" }],
["sábado passado 80 bar", "2026-10-28", { valor: 80, data: "2026-10-24", descricao: "Bar" }],
["ganhei 200 aposta", HOJE, { tipo: "income", valor: 200, descricao: "Aposta", motivoDoTipo: "ganhei" }],
["vendi bicicleta 900", HOJE, { tipo: "income", valor: 900, descricao: "Bicicleta" }],
["reembolso 45 uber", HOJE, { tipo: "income", valor: 45, descricao: "Uber" }],
["pix do joão 150", HOJE, { tipo: "income", valor: 150, descricao: "João", forma: "pix" }],
["pix da maria 20", HOJE, { tipo: "income", descricao: "Maria" }],
["42 mercado pix", HOJE, { tipo: "expense", forma: "pix", motivoDoTipo: null }],
["rendimento 12,30", HOJE, { tipo: "income", valor: 12.3 }],
["dividendos 80", HOJE, { tipo: "income", valor: 80 }],
["tv 3000 em 10x no inter", HOJE, { tipo: "expense", valor: 3000, parcelas: 10, cartaoTexto: "inter", motivoDoTipo: "em 10x" }],
["estorno ifood 25 nubank", HOJE, { tipo: "income", estorno: true, valor: 25, cartaoTexto: "nubank", motivoDoTipo: "estorno" }],
["salário 5000", HOJE, { tipo: "income", motivoDoTipo: "salário" }],
```

- [ ] **Step 2:** `npx vitest run src/lib/captura/frase.test.ts` → FAIL nos casos novos.
- [ ] **Step 3: Implementar.** Dia da semana (`domingo`…`sábado`, com e sem acento, com "na"/"no" antes e "passado"/"passada" depois, consumidos): a ocorrência mais recente ≤ hoje; com "passado", a anterior a hoje (nunca hoje). Use `definirData`. Receita: `ganhei`, `vendi`, `reembolso`, `rendimento`, `rendimentos`, `dividendo(s)`; `ganhei`/`vendi` são consumidos, os substantivos ficam na descrição só se não sobrar outra palavra (como `receita` e `salário` hoje: "rendimento 12,30" → descrição "Rendimento"). "pix" na **primeira** posição seguido de `de`/`do`/`da` + palavra: receita, forma `pix`, consome `pix` e a preposição. `motivoDoTipo` guarda o texto original do token que decidiu.
- [ ] **Step 4:** `npx vitest run src/lib/captura` → PASS (inclusive os casos antigos).
- [ ] **Step 5:** Commit `feat(frase): dias da semana, mais receita e o motivo do tipo`.

### Task 2: Interruptor em Configurações

**Files:**
- Create: `src/hooks/use-lancamento-inteligente.ts`
- Create: `src/hooks/use-lancamento-inteligente.test.ts`
- Create: `src/components/settings/lancamento-settings.tsx`
- Modify: `src/app/(app)/settings/page-client.tsx` (montar a seção abaixo da de aparência, `ThemeSettings`)

**Interfaces:**
- Produces: `lerLancamentoInteligente(storage: Pick<Storage, "getItem"> | null): boolean` (ausente ou erro → `true`; `"0"` → `false`); `useLancamentoInteligente(): readonly [ligado: boolean, definir: (v: boolean) => void]` — mesmo padrão de `src/hooks/use-busca-do-cabecalho.ts` (`useSyncExternalStore`, evento `lancamento-inteligente`, `storage`; servidor → `true`; ligado remove a chave, desligado grava `"0"`).

- [ ] **Step 1: Teste** em `use-lancamento-inteligente.test.ts`: `lerLancamentoInteligente(null) === true`; `{ getItem: () => null }` → `true`; `{ getItem: () => "0" }` → `false`; `{ getItem: () => { throw new Error() } }` → `true`.
- [ ] **Step 2:** rodar → FAIL. **Step 3:** implementar o hook.
- [ ] **Step 4:** `LancamentoSettings`: um `PageSection` "Lançamento" com um `Switch` em linha de preferência (`FormSwitch` se a tela já usa `Form`; senão `Field` + `Switch`, olhe `theme-settings.tsx`), rótulo "Lançamento inteligente", descrição "Escreva ou fotografe e o app preenche tudo. Desligado, o + Adicionar abre o formulário." Monte em `page-client.tsx`.
- [ ] **Step 5:** `npm run ds:audit -- src/components/settings/lancamento-settings.tsx` sem violações; testes verdes. Commit `feat(lancamento): interruptor em configurações`.

### Task 3: `salvar()` no hook do formulário

**Files:**
- Modify: `src/components/transactions/transaction-form-use.tsx` (`handleSubmit` L478; retorno L855)
- Test: `src/lib/captura/frase-no-form.test.ts` (novo `it` de fonte)

**Interfaces:**
- Produces: `useTransactionForm(...)` passa a devolver também `salvar: () => Promise<void>` e `fotoDoRecibo: File | null`, `setFotoDoRecibo: (f: File | null) => void`, `needsCreditCard: boolean`. `handleSubmit = async (e) => { e.preventDefault(); await salvar() }`. Comportamento idêntico ao de hoje.

- [ ] **Step 1: Teste de fonte**: no fonte sem comentários de `transaction-form-use.tsx`, `handleSubmit` contém `e.preventDefault()` seguido de `await salvar()` e nada mais (`/const handleSubmit = async \(e: React\.FormEvent\) => \{\s*e\.preventDefault\(\)\s*await salvar\(\)\s*\}/`), e o `return {` final lista `salvar`.
- [ ] **Step 2:** FAIL. **Step 3:** mover o corpo para `salvar`. **Step 4:** verdes (todos os testes do formulário). Commit `refactor(lancamento): salvar fora do evento do formulário`.

### Task 4: A leitura (funções puras + hook)

**Files:**
- Create: `src/lib/captura/lancamento-inteligente.ts`
- Create: `src/lib/captura/lancamento-inteligente.test.ts`
- Create: `src/components/transactions/use-leitura-do-lancamento.ts`
- Move from: `src/components/wireframe/frase-rapida-wireframe.tsx` (`planoDaFrase`, a lógica de `aplicar`/`lerComIA`/`lembrarCartao`/pedido numerado) e `src/components/wireframe/foto-recibo-wireframe.tsx` (`ler`, foto inicial)

**Interfaces:**
- Consumes: `camposDaFrase`, `camposDaIA`, `historicoDaFraseEmCache`, `CamposDaFrase`, `ContextoDaFrase` (`@/lib/captura/frase-no-form`); `lerFraseComIA`, `lerImagemComIA` (`@/lib/ia/ler`); `comprimirImagem` (`@/lib/anexos`); `cartaoPreEscolhido`, `gravarUltimoCartao` (`@/lib/ultimo-cartao`); `useTransactionForm` (Tarefa 3).
- Produces (puras, em `lancamento-inteligente.ts`):
  - `type CampoDoLancamento = "tipo" | "valor" | "descricao" | "categoria" | "forma" | "data" | "parcelas"`
  - `type TipoDoLancamento = "despesa" | "receita" | "parcelada" | "estorno"`
  - `tipoDoLancamento(c: CamposDaFrase): TipoDoLancamento` (parcelas ≥ 2 → parcelada; estorno → estorno; income → receita; senão despesa)
  - `comTravas(c: CamposDaFrase, editados: Partial<CamposDaFrase>): CamposDaFrase` — os editados vencem; um campo editado sai de `duvidas`.
  - `precisaDeIA(c: CamposDaFrase): boolean` — `duvidas` contém `"valor"` ou `"descricao"`.
  - `faltaParaLancar(c: CamposDaFrase, cartoesAtivos: number): CampoDoLancamento | null` — `"valor"` sem valor; `"forma"` se crédito, `cartoesAtivos > 0` e sem `creditCardId`; senão `null`.
  - `rotuloDaAcao(c: CamposDaFrase): string` — "Lançar despesa · R$ 42,00", "Lançar receita · …", "Lançar estorno · …", "Lançar parcelada · 10× de R$ 300,00" (divisão por `splitTotalAcrossInstallments`), "Lançar despesa" sem valor.
  - `planoDaFrase` (movido, mesma assinatura).
- Produces (hook): `useLeituraDoLancamento({ form, cartoes, categorias, fraseInicial?, fotoInicial? })` →
  `{ texto, setTexto, campos: CamposDaFrase | null, editar(campo, valor parcial de CamposDaFrase), lendoIA: boolean, aviso: string | null, lancar(): Promise<void>, foto: File | null, lerFoto(f: File): Promise<void>, tirarFoto(): void }`.
  `campos` = `comTravas(camposDaFrase(texto, …), editados)` ao vivo; cada mudança aplica no form por `aplicarFrase` (ou `aplicarFoto` quando veio da foto). Histórico carregado ao montar. `lancar()`: se `precisaDeIA` e não leu ainda → IA (pedido numerado), aplica e **não** salva (a pessoa vê e aprova de novo); senão `form.salvar()`. `lerFoto` comprime; falha → `aviso = "Não foi possível abrir esta imagem."` sem `setFotoDoRecibo`.

- [ ] **Step 1: Testes puros** em `lancamento-inteligente.test.ts`, montando `CamposDaFrase` por uma fábrica `campos(over)`:
  - `tipoDoLancamento`: `{parcelas: 10}` → `"parcelada"`; `{tipo:"income", estorno:true}` → `"estorno"`; `{tipo:"income"}` → `"receita"`; padrão → `"despesa"`.
  - `comTravas(campos({valor: 42, duvidas: ["valor"]}), {valor: 50})` → `valor 50`, `duvidas` sem `"valor"`.
  - `faltaParaLancar(campos({valor: null}), 0)` → `"valor"`; `({paymentMethod:"credit_card", creditCardId:null, valor:1}, 2)` → `"forma"`; mesmo com `0` cartões → `null`.
  - `rotuloDaAcao(campos({valor: 3000, parcelas: 10}))` → `"Lançar parcelada · 10× de R$ 300,00"`; `({valor: 42})` → `"Lançar despesa · R$ 42,00"`.
  - `precisaDeIA(campos({duvidas:["valor"]}))` → `true`; `({duvidas:["cartao"]})` → `false`.
- [ ] **Step 2:** FAIL. **Step 3:** implementar as puras e o hook (mova o código dos wireframes; mantenha os comentários de "por quê" que viajam junto).
- [ ] **Step 4: Testes de fonte do hook** (no mesmo arquivo de teste): o fonte de `use-leitura-do-lancamento.ts` usa um `useRef` de pedido e compara `meu !== pedido.current` antes de aplicar a resposta da IA; `lerFoto` só chama `setFotoDoRecibo` depois do `comprimirImagem` ter dado certo.
- [ ] **Step 5:** verdes. Commit `feat(lancamento): leitura ao vivo, ia automática e foto`.

### Task 5: A paleta `LancamentoInteligente`

**Files:**
- Create: `src/components/transactions/lancamento-inteligente.tsx`
- Create: `src/components/transactions/lancamento-inteligente.test.ts` (fonte)
- Referência de uso do `CommandDialog`, páginas e dock: `src/components/layout/app-command-palette.tsx` e `src/app/designsystem/ds-search.tsx`.

**Interfaces:**
- Consumes: `useLeituraDoLancamento` e as puras (Tarefa 4); `ImpactoDaParcela` (`@/components/wireframe/impacto-parcela-wireframe`); `CommandDialog`, `CommandInput`, `CommandList`, `CommandGroup`, `CommandItem`, `CommandItemIcon`, `CommandItemMeta`, `CommandItemArrow`, `CommandPages`, `CommandPage`, `useCommandPages`, `CommandScope`, `CommandDock`, `CommandDockItem`, `CommandEmpty` de `@/components/ui/command`; `Badge`.
- Produces: `LancamentoInteligente({ open, onOpenChange, leitura, form, categorias, cartoes, onAbrirFormulario, saving }): JSX.Element`.

Comportamento (o spec, seção "Como fica", é a referência; aqui só o que o fixa):
- `commandProps={{ shouldFilter: false }}` na raiz; filtro só nas páginas de lista (categoria, forma), com `commandFilter`.
- Raiz vazia: três exemplos (`"42 mercado nubank"`, `"salário 5000 dia 5"`, `"tv 3000 em 10x no inter"`) que fazem `setTexto` e a linha "Fotografar recibo".
- Com texto: primeiro item `value="lancar"` com `rotuloDaAcao`, selecionado por padrão (`value` controlado do `Command` = `"lancar"` a cada mudança de texto); `disabled` com `faltaParaLancar` ≠ null, e o `CommandItemMeta` diz "Falta o valor"/"Falta o cartão". Depois o grupo "Entendi" (um item por `CampoDoLancamento`; tipo mostra `motivoDoTipo` como "por causa de “em 10x”"); `Badge tone="warning"` "Confira" para campo em `duvidas`; `Badge` "IA" quando `duvidas` tem `"ia"`. Depois `ImpactoDaParcela` (com `planoDaFrase`) e "Abrir formulário completo" (`onAbrirFormulario`).
- Página de campo: a pílula mostra `CommandScope` com o nome do campo; valor/descrição/parcelas leem o texto da pílula e confirmam no Enter por um item "Usar …"; tipo/categoria/forma/data são listas; escolher chama `leitura.editar` e volta à raiz. Data aceita o texto pelo parser (`interpretarFrase(texto, hoje).data` quando não houver dúvida de data).
- Foto: `<input type="file" accept="image/*" capture="environment" hidden>` acionado pelo item do dock "Recibo" e pela linha "Fotografar recibo"; `onPaste` e `onDrop` na casca leem a primeira imagem. A miniatura vai no `leading` da pílula se `CommandInput` aceitar `leading` (aceita: `command.tsx` L1044); um × remove (`tirarFoto`). "Lendo o recibo com IA…" substitui o grupo enquanto `lendoIA`.
- `Enter` com `e.nativeEvent.isComposing` não faz nada (verifique no `onKeyDown` da casca, antes do cmdk).
- Dock: "Lançar" (↵), "Campos" (↑↓), "Recibo", "Fechar" (Esc).
- `pending={saving}` trava fechar.

- [ ] **Step 1: Teste de fonte** em `lancamento-inteligente.test.ts`: o fonte sem comentários contém `CommandDialog`, `shouldFilter: false`, `isComposing`, `rotuloDaAcao(`, `faltaParaLancar(`, `onPaste`, `onDrop`, e **não** contém `<form`, `WireframeBox`, `#[0-9a-f]{3,6}`, nem `lucide`.
- [ ] **Step 2:** FAIL. **Step 3:** implementar. **Step 4:** `npm run ds:audit -- src/components/transactions/lancamento-inteligente.tsx` sem violações locais; testes verdes.
- [ ] **Step 5:** Commit `feat(lancamento): a paleta do lançamento inteligente`.

### Task 6: Ligar a paleta à criação e tirar a frase do formulário

**Files:**
- Modify: `src/components/transactions/transaction-form-dialog.tsx`
- Modify: `src/components/transactions/transaction-form-fields.tsx` (L84, L88 imports; L600-618 os dois wireframes; props `fraseInicial`, `aplicarFrase`, `fotoInicial`, `aplicarFoto`, `setFotoDoRecibo` saem de `fieldsProps` se ninguém mais os usar)
- Delete: `src/components/wireframe/frase-rapida-wireframe.tsx`, `src/components/wireframe/foto-recibo-wireframe.tsx`
- Modify tests: `src/lib/captura/frase-no-form.test.ts` (L236, L258), `src/lib/ia/form-ia.test.ts` (L164)

**Interfaces:**
- Consumes: `useLancamentoInteligente` (Tarefa 2), `useLeituraDoLancamento` (Tarefa 4), `LancamentoInteligente` (Tarefa 5), `salvar` (Tarefa 3).

Regra: `const usarPaleta = !editingTransaction && (ligado || Boolean(fraseInicial || fotoInicial)) && !usarFormulario`. `usarFormulario` é estado local, zera quando `open` vira `false`. "Abrir formulário completo" faz `setUsarFormulario(true)` — o estado do hook continua (mesma instância). Os três chamadores (`global-shell-dialogs-provider.tsx`, `transactions/page-client.tsx`, `category-embedded-transactions.tsx`) não mudam.

- [ ] **Step 1: Atualizar os testes de fonte**: `transaction-form-fields.tsx` não importa nem renderiza `FraseRapidaWireframe`/`FotoReciboWireframe`; `transaction-form-dialog.tsx` contém `useLancamentoInteligente`, `<LancamentoInteligente` e `!editingTransaction`; os testes que liam os arquivos de wireframe passam a ler `use-leitura-do-lancamento.ts`/`lancamento-inteligente.ts` (mesmas asserções de comportamento, nos novos lugares).
- [ ] **Step 2:** FAIL. **Step 3:** implementar e apagar os wireframes. **Step 4:** `npx tsc --noEmit && npm run lint && npm run test:unit` verdes.
- [ ] **Step 5:** Commit `feat(lancamento): a criação abre a paleta inteligente`.

### Task 7: Jornadas, Atlas e verificação no app

**Files:**
- Modify: `docs/JORNADAS.md` (jornada de criar lançamento: o fluxograma ganha o ramo "lançamento inteligente ligado → paleta → Lançar | Abrir formulário completo"; tabela de regras com o interruptor e o compartilhar; lacunas)
- Modify: `docs/atlas/template.html` (a mesma jornada, data e contagens da capa)
- Run: `python3 docs/atlas/build.py`

- [ ] **Step 1:** atualizar os dois documentos (o diagrama segue a legenda e o `%%{init}%%` do topo; nenhum id de nó reservado do Mermaid).
- [ ] **Step 2:** `python3 docs/atlas/build.py` sem erro.
- [ ] **Step 3:** no preview (`dev-attach`, :3000), abrir "+ Adicionar": a paleta aparece; digitar `tv 3000 em 10x no inter` mostra "Lançar parcelada · 10× de R$ 300,00"; editar a categoria por uma página; "Abrir formulário completo" leva os campos; em Configurações, desligar → "+ Adicionar" abre o formulário sem frase/foto. **Não aprovar um lançamento** (banco de produção). Conferir 375px e tema escuro.
- [ ] **Step 4:** `graphify update .`; commit `docs(lancamento): jornada e atlas do lançamento inteligente`.
- [ ] **Step 5:** republicar `docs/atlas/atlas-jornadas.html` no URL do Atlas (feito pelo orquestrador, com a ferramenta de Artifact).
