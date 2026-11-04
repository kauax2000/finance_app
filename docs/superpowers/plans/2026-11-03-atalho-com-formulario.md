# Atalho do iPhone com formulário Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O atalho "Lançar gasto" pergunta a frase (lançamento inteligente ligado) ou um formulário campo a campo (desligado, ou frase sem valor), com listas vindas do app, e o guia ensina a abrir o atalho do jeito que a pessoa escolher.

**Architecture:** A preferência vira coluna de `user_settings`; a Edge `capture` ganha um `GET` de opções e aceita `category`/`payment` por nome no `POST`; `gerar-atalho.py` gera a versão 2; o front lê a preferência da conta, avisa quem precisa baixar o atalho de novo e o guia ganha "Como abrir o atalho".

**Tech Stack:** Postgres (Supabase), Deno (Edge), Python 3 (`shortcuts sign`), Next 16 / React 19, vitest, `deno test`.

**Spec:** `docs/superpowers/specs/2026-11-03-atalho-com-formulario-design.md` (com a seção "Respostas da revisão", que vale como parte dele).

## Global Constraints

- Banco de desenvolvimento = produção. **Nenhum agente aplica migração, publica Edge, grava dado ou chama a Edge de produção.** A sessão principal publica depois, com o ok do dono.
- Códigos de erro estáveis na resposta: `codigo: "sem_valor"` (frase sem valor, o `ERRO_VALOR`) e `codigo: "opcao_invalida"` (categoria ou pagamento fora da lista). Todo erro leva `error`, `resumo` ("Não lançado: …") e, quando houver, `codigo`.
- Listas do `GET`: só da **carteira padrão do token**. `categorias` = `["Sem categoria", …despesa em ordem alfabética]`; `pagamentos` = `["Não informar", …cartões ativos por nome, "Pix", "Débito", "Dinheiro"]`. Nome repetido ganha " (2)", " (3)". Resposta: `{ modo: "frase" | "formulario", categorias: string[], pagamentos: string[] }`.
- `POST` do formulário: `amount` + `category` (nome) + `payment` (nome) + `merchant` + `date` + `source: "shortcut"`. Descrição vazia → nome da categoria, ou `"Gasto"` com "Sem categoria". Data vazia → hoje. Sempre despesa, sem "a conferir". "Não informar" → `payment_method` nulo.
- Cabeçalho `X-Atalho-Versao: 2` no atalho novo; a Edge grava em `capture_tokens.atalho_versao` (smallint, nulo = v1) a cada uso válido.
- Preferência: `user_settings.lancamento_inteligente boolean not null default true` e `lancamento_inteligente_em timestamptz` (nulo = nunca escolhido). Migração do `"0"` local: grava `false` uma vez, só se `lancamento_inteligente_em` for nulo, e apaga a chave local.
- Perguntas do atalho (texto exato): "Qual o valor?", "Descrição (opcional)", "Categoria", "Forma de pagamento", "Data" com "Hoje" e "Outro dia".
- Design system do `AGENTS.md`; nada novo em `src/components/ui/`, `globals.css` ou `src/app/designsystem/`.
- Commits só com os arquivos da tarefa; `docs/JORNADAS.md` e `docs/atlas/*` ficam sem commit (sessão principal).

## Review Focus

1. **Frase sem valor no modo frase** abre o formulário, e não só a notificação: o atalho testa `codigo == "sem_valor"` (Task 3, `--verificar`).
2. **Categoria com nome repetido ou com acento/caixa diferente** resolve para a mesma que a lista mostrou (Task 2, teste de `opcoesDoFormulario` + `resolverOpcao`).
3. **Valor "0", negativo ou com vírgula** ("42,90") no formulário: vírgula aceita, zero ou negativo é `sem_valor` (Task 2).
4. **Atalho antigo (sem cabeçalho)** continua lançando igual e grava `atalho_versao` nulo (Task 2).
5. **Pessoa sem linha em `user_settings`** abre o app e o atalho vê `modo: "frase"` (default), e o interruptor cria a linha ao gravar (Tasks 1 e 4).

---

### Task 1: Migração

**Files:**
- Create: `supabase/migrations/20261103160000_atalho_formulario.sql`
- Test: `supabase/tests/atalho_formulario.test.sql` (pgTAP, como os vizinhos em `supabase/tests/`)

- [ ] **Step 1:** pgTAP: as três colunas existem com os tipos e defaults das Global Constraints; `has_column('public','capture_tokens','atalho_versao')`; o default de `lancamento_inteligente` é `true`.
- [ ] **Step 2:** Escreva a migração (`add column if not exists`, comentário no topo no estilo de `20261103150000_apple_pay_configurado.sql`). Não rode contra o banco ligado; `supabase test db` só se houver banco local (sem Docker, pule e diga no relatório).
- [ ] **Step 3:** Commit `feat(captura): colunas do atalho com formulário`.

### Task 2: Edge `capture` — GET de opções e POST do formulário

**Files:**
- Modify: `supabase/functions/_shared/captura.ts`, `supabase/functions/capture/index.ts`
- Test: `supabase/functions/_shared/captura.test.ts`

**Interfaces:**
- Produces (em `captura.ts`):
  - `opcoesDoFormulario(categorias: { id: string; name: string }[], cartoes: { id: string; name: string }[]): { categorias: { nome: string; id: string | null }[]; pagamentos: { nome: string; forma: 'credit_card' | 'pix' | 'debit_card' | 'cash' | null; cartaoId: string | null }[] }` — com "Sem categoria"/"Não informar" no topo e os sufixos de repetidos.
  - `resolverOpcao<T extends { nome: string }>(lista: T[], nome: string | undefined): T | null` — compara sem acento e sem caixa, aparando espaços.
  - `PedidoCaptura` ganha `category?: string; payment?: string`; `validarPedido` aceita os dois como string ≤ `MAX_TEXTO`.
  - `montarLancamento` com `category`/`payment` no pedido e `ctx.formulario` (as opções resolvidas) monta despesa sem dúvidas, na carteira padrão.
  - O erro de valor devolve `codigo: "sem_valor"`; opção desconhecida, `status 422, erro: "Escolha uma opção da lista."`, `codigo: "opcao_invalida"`.
- Em `index.ts`: `GET` autentica como o `POST` (token, plano, membro), lê `user_settings.lancamento_inteligente` do dono do token (sem linha = `true`), lê categorias de despesa e cartões ativos da carteira padrão e responde `{ modo, categorias: nomes, pagamentos: nomes }`. O `POST` grava `atalho_versao` do cabeçalho `X-Atalho-Versao` (inteiro 1–99; ausente = nulo) junto do `last_used_at`. `json()` copia `codigo` quando existir.

- [ ] **Step 1: Testes Deno** (`captura.test.ts`):
  - `opcoesDoFormulario` com categorias `[{id:'a',name:'Mercado'},{id:'b',name:'Mercado'},{id:'c',name:'Água'}]` e cartão `[{id:'k',name:'Nubank'}]` → nomes `['Sem categoria','Água','Mercado','Mercado (2)']` e `['Não informar','Nubank','Pix','Débito','Dinheiro']`.
  - `resolverOpcao(lista, ' agua ')` acha "Água"; `resolverOpcao(lista, 'Feira')` é `null`.
  - `validarPedido({ amount: '42,90', category: 'Mercado', payment: 'Pix' })` ok; `category: 5` é "Corpo inválido.".
  - `montarLancamento` do formulário: `{amount:'42,90', merchant:'', category:'Mercado', payment:'Pix'}` → `description: 'Mercado'`, `category_id: 'a'`, `payment_method: 'pix'`, `needs_review: false`, `type: 'expense'`; com "Sem categoria" e sem descrição → `description: 'Gasto'`, `category_id: null`; `payment: 'Nubank'` → `payment_method: 'credit_card'`, `payment_credit_card_id: 'k'`; `amount: '0'` → erro com `codigo: 'sem_valor'`; `category: 'Feira'` → `codigo: 'opcao_invalida'`.
  - O pedido antigo do Apple Pay (`amount`, `merchant`, `card`) segue igual (teste existente continua verde).
- [ ] **Step 2:** `npm run test:edge` — falha.
- [ ] **Step 3:** Implemente em `captura.ts` e `index.ts`.
- [ ] **Step 4:** `npm run test:edge` verde e `deno check --node-modules-dir=none supabase/functions/capture/index.ts`.
- [ ] **Step 5:** Commit `feat(captura): GET de opções e POST do formulário na Edge capture`.

### Task 3: Atalho v2

**Files:**
- Modify: `scripts/atalho/gerar-atalho.py`, `public/atalho/Lançar gasto.shortcut` (regerado)

**Interfaces:**
- Consumes: o contrato da Task 2 (GET `{modo, categorias, pagamentos}`, `codigo`, `X-Atalho-Versao`).

- [ ] **Step 1:** Em `atalho()`: sem Entrada → `GET` (Obter conteúdo de URL, `Authorization` + `X-Atalho-Versao: 2`). Resposta com `resumo` (erro) → notificação e Parar. Sem resposta (falha de rede) → caminho da frase. `modo == "frase"` → a frase de hoje; se o `POST` voltar `codigo == "sem_valor"`, entra no formulário. `modo == "formulario"` → formulário. Formulário: Pedir Entrada Número "Qual o valor?", Pedir Entrada Texto "Descrição (opcional)" (vazio permitido), Escolher da Lista "Categoria" e "Forma de pagamento" sobre as listas do GET, Escolher do Menu "Data" com "Hoje" / "Outro dia" (Pedir Data, formatada `yyyy-MM-dd`). `POST` com os campos das Global Constraints e o cabeçalho de versão. Notificação com o `resumo`. O caminho do Apple Pay (com Entrada) não muda, mas leva o cabeçalho de versão.
- [ ] **Step 2:** `--verificar` passa a conferir: há o GET, as cinco perguntas com os textos exatos, a condição `sem_valor` e o cabeçalho `X-Atalho-Versao` nos dois `POST`.
- [ ] **Step 3:** `python3 scripts/atalho/gerar-atalho.py --verificar` e depois `python3 scripts/atalho/gerar-atalho.py` (assina; precisa do `shortcuts` do macOS, fora do sandbox). Sem rede para a Edge real: não rode o atalho.
- [ ] **Step 4:** Commit `feat(atalho): versão 2 com o formulário e o GET de opções` (script + `.shortcut`).

### Task 4: Front — preferência na conta e o aviso de baixar de novo

**Files:**
- Modify: `src/hooks/use-lancamento-inteligente.ts`, `src/components/settings/neste-celular-grupo.tsx` (texto do interruptor), `src/components/account/aparelhos-de-captura.ts` (lê `atalho_versao`), `src/components/account/atalho-secao.tsx`, `src/lib/supabase.ts` (`CaptureToken.atalho_versao: number | null`)
- Test: `src/hooks/use-lancamento-inteligente.test.ts` (novo), `src/components/account/conta.test.ts`

**Interfaces:**
- `useLancamentoInteligente()` mantém a assinatura de hoje (o `transaction-form-dialog` e o grupo continuam iguais na chamada); a fonte passa a ser a conta (React Query, chave `["lancamento_inteligente", userId]`), com o `localStorage` só como valor inicial enquanto carrega.
- `export async function migrarPreferenciaLocal(userId, storage, ler: () => Promise<{ valor: boolean; em: string | null } | null>, gravar: (v: boolean) => Promise<void>): Promise<boolean>` — grava `false` só com `"0"` local e `em` nulo; apaga a chave; devolve se gravou.
- `atalho-secao`: aparelho com `last_used_at` e `atalho_versao == null` → segunda linha "Baixe o atalho de novo para ter o formulário" e o ⋯ ganha "Baixar o atalho de novo" (`ArrowDownTrayIcon`), que abre o `GuiaDoAtalho` no passo 2 (`passoInicial={1}`).

- [ ] **Step 1: Testes**: `migrarPreferenciaLocal` (com `"0"` e `em` nulo grava `false` e apaga; com `em` preenchido não grava; sem chave não grava); leitura de fonte: o hook lê `user_settings.lancamento_inteligente` e grava `lancamento_inteligente_em`; o texto do interruptor diz "vale na conta, inclusive no atalho do iPhone"; `aparelhos-de-captura` seleciona `atalho_versao`; `atalho-secao` contém o aviso e "Baixar o atalho de novo".
- [ ] **Step 2:** `npx vitest run src/hooks src/components/account src/components/settings` — falha.
- [ ] **Step 3:** Implemente.
- [ ] **Step 4:** `npx tsc --noEmit && npx vitest run src && npx eslint src/hooks src/components && node .claude/skills/design-system-guard/scripts/audit.mjs src/components/account src/components/settings src/hooks` — verde.
- [ ] **Step 5:** Commit `feat(conta): lançamento inteligente vale na conta, e o aparelho antigo pede o atalho novo`.

### Task 5: Guia — "Como abrir o atalho"

**Files:**
- Modify: `src/components/account/guia-do-atalho.tsx`
- Test: `src/components/account/conta.test.ts`

**Interfaces:**
- `GuiaDoAtalho` ganha `passoInicial?: number` (padrão 0), usado no reset ao abrir. Com `passoInicial > 0` e sem código criado, o passo 1 (código) fica fora: o guia mostra do passo de baixar ao último, porque o aparelho já existe.
- O último passo vira **"Como abrir o atalho"**: um `ToggleGroup variant="segmented"` (ou `Tabs` sem `TabsContent`, o trilho padrão do projeto) com Siri, Botão de Ação, Toque traseiro e Tela de início; cada opção mostra 1–2 frases:
  - Siri: "Diga "E aí Siri, Lançar gasto"." (a tela da Siri de hoje continua aqui)
  - Botão de Ação: "Ajustes › Botão de Ação › Atalho › Lançar gasto."
  - Toque traseiro: "Ajustes › Acessibilidade › Toque › Toque traseiro › Toque triplo › Lançar gasto."
  - Tela de início: "No app Atalhos, toque e segure Lançar gasto › Compartilhar › Adicionar à Tela de Início."
  - Abaixo, uma frase: "O atalho pergunta a frase ou um formulário, conforme o Lançamento inteligente em Configurações."

- [ ] **Step 1: Testes** (leitura de fonte): o título "Como abrir o atalho", as quatro opções e os quatro textos exatos, `passoInicial`, e o caminho do Toque traseiro.
- [ ] **Step 2–4:** falha → implementa → `tsc`, vitest, eslint, auditor verdes.
- [ ] **Step 5:** Commit `feat(conta): o guia ensina a abrir o atalho do jeito que a pessoa escolher`.

### Task 6: Documentos e publicação (sessão principal)

- [ ] `docs/captura/atalho-iphone.md`: o contrato novo (GET, `category`, `payment`, `codigo`, `X-Atalho-Versao`) e o formulário; commit.
- [ ] `docs/JORNADAS.md`, `docs/atlas/template.html`, `python3 docs/atlas/build.py`, republicar o Atlas (sem commit).
- [ ] Com o ok do dono: aplicar a migração em produção (ensaio com rollback, depois `schema_migrations`), publicar a `capture` (`--use-api --no-verify-jwt`) e conferir o `GET` com token inválido ("Não lançado: Token inválido.").
