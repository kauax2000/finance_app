# Categorias pela IA no Importar extrato — plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** ao chegar na conferência do Importar extrato, as linhas que o histórico não categorizou recebem sozinhas uma categoria sugerida. Primeiro passam pelas regras que o app já tem, sem custo. O que sobrar vai à IA. A pessoa vê o que veio da IA, revisa e troca antes de importar.

**Architecture:**
- **Duas camadas, na ordem:**
  1. **Regras locais.** É o `casarCategoria` do lançamento inteligente (`supabase/functions/_shared/frase.ts`, reexportado em `src/lib/captura/frase.ts`): histórico exato, nome da categoria, palavra significativa e palavras comuns. Ele substitui o `sugerirCategoria` atual na preparação do lote.
  2. **IA.** Só para o que continua sem categoria. É uma op nova, `categorizar`, na Edge Function `ia-ler`, feita no molde do `alinhar`: redige os nomes dos membros, consome a cota, usa o cache `ia_cache` e cai no segundo provedor da cadeia se o primeiro falhar.
- **A IA só escolhe entre as categorias que existem na carteira**, do tipo certo de cada linha. Ela nunca cria categoria e nunca grava nada: a resposta vira sugestão na conferência, e quem grava é o Importar, como hoje.
- **A interface nova é wireframe** (regra do `AGENTS.md`, "Funcionalidade nova entra em wireframe"), em `src/components/wireframe/`.

**Tech Stack:** Next 16 / React 19 (cliente), Supabase Edge Functions em Deno (`ia-ler`), Groq (`openai/gpt-oss-20b`) com Cloudflare de reserva (`CADEIA.texto` de `ia-config.ts`), Vitest (`npm run test:unit`), `deno test` (`npm run test:edge`).

**Spec:** pedido do dono (09/11/2026): "aplicar uma feature de leitura automática com IA para categorizar automaticamente esses gastos, dentro desse processo de importação". O dono pulou as perguntas. As decisões abaixo são minhas e estão marcadas.

## Decisões (minhas, sem consulta)

1. **Automático.** A IA corre sozinha ao entrar na conferência, uma vez por lote, sem botão para disparar. Um "Tentar de novo" só aparece depois de uma falha.
2. **Regras antes da IA.** O que as regras resolvem não gasta cota nem manda dado para fora. Isso também melhora o importador sem plano: hoje ele só usa o histórico.
3. **A pessoa vence.** Uma categoria escolhida pela pessoa, ou vinda da planilha, nunca é sobrescrita pela IA. A resposta só preenche linhas que ainda estão sem categoria quando ela chega.
4. **Origem por linha:** `"planilha" | "historico" | "regra" | "ia" | "pessoa"`. As que vieram da IA ganham uma marca "IA" na linha, e um filtro novo, **"Pela IA"**, junta as sugestões para revisão. Trocar a categoria de uma linha muda a origem dela para `"pessoa"`, e a marca some.
5. **Sem plano Família**, a `ia-ler` responde 402. O wireframe não mostra nada (sem convite a assinar nesta entrega). **Cota esgotada:** a mensagem que o app já usa ("Você usou a IA 30 vezes hoje. Amanhã volta."). **Falha da IA:** "A IA não respondeu agora. Categorize à mão." com "Tentar de novo".
6. **Uma chamada por lote**, com até 200 linhas pendentes (`MAX_CATEGORIZAR = 200`). Acima disso vão as 200 primeiras, e a faixa diz quantas ficaram para a pessoa. Uma chamada consome uma cota. O cache do servidor torna grátis repetir a mesma entrada, por exemplo depois do Inverter.
7. **O que vai à IA:** índice, descrição redigida e tipo (`expense` ou `income`) de cada linha, mais os nomes das categorias de cada tipo. Não vão valor, data, id nem carteira. Valor e data não ajudam a categorizar, e quanto menos dado sair, melhor.
8. **Aprender:** não há tabela de regras nova. Depois de importar, o histórico passa a decidir sozinho da próxima vez (camada 1).

## O que existe hoje (lido no código)

- `prepararLote` (`src/components/transactions/importar/use-importar-extrato.ts:219`):
  - lê o histórico com `select("description,category_id,date")`, limitado a 1000 linhas;
  - lê as categorias com `"id,name,type,color,icon"`;
  - chama `prepararItens` (`src/lib/import/importar.ts:30`), que usa `sugerirCategoria` (`src/lib/import/categoria-pelo-historico.ts`: descrição exata e palavra significativa, sem olhar o tipo);
  - aplica `comCategoriaDaPlanilha`.
- `casarCategoria(descricao, tipo, categorias, historico)` (`frase.ts:714`) pede `LinhaHistorico` com `type`, `payment_method`, `payment_credit_card_id`. Para casar, só lê `description`, `category_id`, `date` e `type`.
- `tipoDoItem(i, destino)` (`src/lib/import/importar.ts:47`): o tipo da categoria de cada linha. O estorno no cartão é despesa.
- A `ia-ler` (`supabase/functions/ia-ler/index.ts`) tem as ops `frase`, `fatura`, `imagem` e `alinhar`, e checa método → JWT → corpo → membro → plano `familia`.
- `alinharFatura` (`supabase/functions/_shared/ia.ts:486`) é o molde: `redigir`, `executar(ctx, 'texto', chave, mensagens, MAX_TOKENS_FATIA, validar)`, e a chave de cache `sha256Hex(\`alinhar:${VERSAO_PROMPT}:${entrada}\`)`.
- O cliente chama pelo `src/lib/ia/ler.ts`: `alinharFaturaComIA` → `traduzir` com o mapa `MENSAGEM`; `marcarCotaEsgotada`.
- O filtro da conferência é `FILTROS` (`conferir-importacao.tsx:103`), e o tipo `FiltroConferencia` mora no hook.
- A jornada do Importar está em `docs/JORNADAS.md`, linha 899. Ela muda nesta entrega, porque um passo passa a chamar uma Edge Function.

## Global Constraints

- **Não tocar** `src/components/ui/`, `src/app/globals.css`, `CLAUDE.md` nem `graphify-out/` (este só por `graphify update .`). A interface nova mora em `src/components/wireframe/importar-ia-wireframe.tsx`, com a cara fixa do wireframe: `border-dashed border-muted-foreground/60`, `bg-muted/40`, `font-mono`, `text-muted-foreground` e a etiqueta `WIREFRAME · Bloco 2 · Categorias pela IA`. Controles nativos (`<button type="button">`), nenhuma peça do design system.
- **Produção:**
  - o banco do dev é o de produção;
  - nada grava dado sem pedido;
  - no navegador, nunca clicar em Importar nem em Desfazer;
  - **o deploy da `ia-ler` só com o ok explícito do dono** (Task 6). A Supabase CLI roda fora do sandbox, com `deploy --use-api`.
- **IA:**
  - nenhum nome de membro sai (`redigir`);
  - nenhum id, valor nem data na entrada;
  - a resposta é validada contra a lista enviada, e nome que não está na lista é descartado;
  - `VERSAO_PROMPT` só muda se o prompt de outra op mudar.
- **Sem prettier.** Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Sem push.
- **Verificação de cada tarefa de código:**
  - `npx tsc --noEmit`
  - `npx eslint <arquivos tocados>`
  - `npx vitest run src/lib/import src/lib/ia src/components/transactions/importar src/components/wireframe`
  - `npm run test:edge`
  - `npm run ds:audit -- src/components/transactions/importar`

## Review Focus

1. **A pessoa troca uma categoria enquanto a IA ainda lê.** Quando a resposta chega, a escolha da pessoa fica.
2. **Inverter (releitura) durante ou depois da IA.**
   - Os `clientId` mudam a cada leitura. As sugestões se reaplicam pela chave estável (`chavesDasLinhas`, descrição + tipo).
   - A resposta de uma leitura velha não pinta a nova: o número da vez é conferido, como o `vez.vale(n)`.
3. **Fechar o diálogo, ou voltar ao Arquivo, com a IA lendo.** Nada é aplicado depois, e nada quebra.
4. **A IA devolve um nome que não está na lista, a categoria de outro tipo, um índice repetido ou um índice fora do intervalo.** Tudo isso é descartado sem erro, e as outras sugestões valem.
5. **Carteira sem nenhuma categoria de um tipo**, por exemplo nenhuma de receita. As linhas desse tipo não vão à IA. Lote sem pendentes: nenhuma chamada.

---

### Task 1: a op `categorizar` no servidor

**Files:**
- Modify: `supabase/functions/_shared/ia.ts` (tipos, prompt, `validarCategorias`, `categorizar`)
- Modify: `supabase/functions/ia-ler/index.ts` (o `Pedido`, a leitura do corpo e o despacho)
- Test: `supabase/functions/_shared/ia.test.ts` (no molde dos testes de `alinharFatura`, com o provedor falso que o arquivo já usa)

**Interfaces (Produces):**
```ts
export type ItemParaCategorizar = { i: number; descricao: string; tipo: 'expense' | 'income' }
export type CategoriasPorTipo = { expense: string[]; income: string[] }
export type Sugestao = { i: number; categoria: string }
export const MAX_CATEGORIZAR = 200
/** Valida a resposta: cada `i` existe em `itens`, aparece uma vez, e `categoria` é um nome de `categorias[tipo do item]` (comparação sem acento e sem caixa; devolve o nome exato da lista). Nulos e inválidos saem. */
export function validarCategorias(bruto: unknown, itens: ItemParaCategorizar[], categorias: CategoriasPorTipo): Sugestao[] | null
export async function categorizar(ctx: ContextoIA, itens: ItemParaCategorizar[], categorias: CategoriasPorTipo): Promise<ResultadoIA<Sugestao[]>>
/** O corpo da op: lista com descrição ≤ 200, tipo válido, `i` inteiro ≥ 0 e únicos; categorias com no máximo 100 nomes de ≤ 60 caracteres por tipo. Null se algo falhar. */
export function lerPedidoCategorizar(v: unknown): { itens: ItemParaCategorizar[]; categorias: CategoriasPorTipo } | null
```
- **A resposta da op:** `{ ok: true, sugestoes: Sugestao[], provedor, modelo }`, ou `{ ok: false, motivo }`. O motivo pode ser `cota`, `sem_ia`, `sem_chave` ou `grande`.
- **Acima de `MAX_CATEGORIZAR`:** `{ ok: false, motivo: 'grande' }`. Quem corta em 200 é o cliente.

- [x] **Step 1: testes que falham** (`ia.test.ts`):
  - `validarCategorias`:
    - um nome válido com outra caixa ou acento (`"mercado"` para `"Mercado"`) vira o nome da lista;
    - descarta um nome inexistente;
    - descarta uma categoria de receita numa linha de despesa;
    - descarta o segundo `i` repetido;
    - descarta um `i` fora de `itens`;
    - `{ sugestoes: "x" }` dá `null`.
  - `categorizar`:
    - a mensagem enviada ao provedor falso não contém o nome de um membro (`ctx.nomes`), nem `valor` ou `data`;
    - a entrada leva só `i`, `descricao` e `tipo` por item, mais as listas de categorias;
    - a chave de cache começa por `categorizar:`;
    - com 201 itens, devolve `motivo: 'grande'` sem chamar o provedor.
  - `lerPedidoCategorizar`:
    - aceita um corpo válido;
    - recusa descrição de 201 caracteres, tipo `"x"`, `i` repetido e 101 categorias.
- [x] **Step 2:** `npm run test:edge` → FAIL.
- [x] **Step 3: implementar.**
  - O prompt (`PROMPT_CATEGORIZAR`) pede JSON `{"sugestoes":[{"i":0,"categoria":"Mercado"}]}`. Ele manda escolher só nomes da lista do tipo da linha, ou deixar a linha de fora na dúvida. É em português, com dois exemplos curtos sem dado real.
  - Passa por `executar(ctx, 'texto', …, MAX_TOKENS_FATIA, (b) => validarCategorias(b, itens, categorias))`.
  - Em `ia-ler/index.ts`:
    - entra `{ op: 'categorizar'; workspaceId; itens; categorias }` no `Pedido`;
    - a leitura usa `lerPedidoCategorizar` (inválido → `INVALIDO('Lista para categorizar inválida.')`);
    - o despacho faz `responder(await categorizar(ctx, …), 'sugestoes')`.
- [x] **Step 4:** a Verificação passa.
- [x] **Step 5:** commit `feat(ia): a op categorizar na ia-ler, escolhendo só entre as categorias da carteira`.

### Task 2: as regras locais e a parte pura do cliente

**Files:**
- Modify: `src/lib/import/importar.ts` (`prepararItens` passa a usar `casarCategoria` com o tipo da linha; o item ganha `origem`)
- Modify: `src/components/transactions/importar/use-importar-extrato.ts` (o `select` do histórico ganha `type`)
- Create: `src/lib/import/categorizar.ts`
- Modify: `src/lib/ia/ler.ts` (`categorizarComIA`)
- Test: `src/lib/import/categorizar.test.ts`, mais os testes existentes de `importar.ts` e `use-importar-extrato.test.ts`

**Interfaces:**
- Consumes: `Sugestao`, `ItemParaCategorizar`, `CategoriasPorTipo` (Task 1, espelhados no cliente como `ItemParaAlinhar` já é).
- Produces:
  ```ts
  export type OrigemDaCategoria = "planilha" | "historico" | "regra" | "ia" | "pessoa"
  // ItemImportavel ganha: origem: OrigemDaCategoria | null   (null = sem categoria)
  export function prepararItens(itens: ItemBanco[], historico: LinhaHistorico[], categorias: CategoriaParaCasar[], destino: DestinoImportacao): ItemImportavel[]
  /** As linhas sem categoria, de tipos com pelo menos uma categoria, até MAX_CATEGORIZAR, com índice local. */
  export function pedidoDaIA(itens: ItemImportavel[], categoriaDe: (id: string) => string | null, categorias: Categoria[], destino: DestinoImportacao): { itens: ItemParaCategorizar[]; categorias: CategoriasPorTipo; clientIds: string[]; ficaram: number }
  /** clientId → categoryId, pelo nome devolvido e o tipo da linha. */
  export function aplicarSugestoes(sugestoes: Sugestao[], pedido: ReturnType<typeof pedidoDaIA>, categorias: Categoria[]): Map<string, string>
  export function categorizarComIA(workspaceId: string, itens: ItemParaCategorizar[], categorias: CategoriasPorTipo): Promise<Lido<{ sugestoes: Sugestao[] }>>
  ```
- O `motivo` de `historico` e `palavra` vira origem `"historico"`; o de `nome` e `comum` vira `"regra"`. O `sugerirCategoria` fica sem uso e é apagado junto com o teste dele.

- [x] **Step 1: testes que falham.**
  - `prepararItens` com histórico vazio:
    - categoria "Mercado" e descrição "COMPRA MERCADO EXTRA": `categoryId` do Mercado, origem `"regra"`;
    - estorno no cartão: casa com categoria de despesa;
    - linha de receita na conta: casa só com categoria de receita.
  - `pedidoDaIA` pula:
    - linhas com categoria;
    - tipos sem categoria;
    - a partir da linha 201 (`ficaram` conta as que ficaram de fora).
  - `aplicarSugestoes` ignora um `i` sem `clientId`.
  - `categorizarComIA` mapeia `grande` para "Muitas linhas para a IA. Categorize o resto à mão.".
- [x] **Step 2:** `npx vitest run src/lib/import src/lib/ia` → FAIL.
- [x] **Step 3:** implementar.
  - No `prepararLote`, passe as categorias e o destino a `prepararItens`, e acrescente `type` ao `select` do histórico.
  - `comCategoriaDaPlanilha` marca origem `"planilha"`. A categoria que ainda não existe e é zerada (`categoryId: null`) fica com origem `null`.
- [x] **Step 4:** a Verificação passa.
- [x] **Step 5:** commit `feat(importar): as regras do lançamento inteligente categorizam antes da IA`.

### Task 3: a IA no hook do Importar

**Files:**
- Modify: `src/components/transactions/importar/use-importar-extrato.ts`
- Test: `src/components/transactions/importar/use-importar-extrato.test.ts`

**Interfaces:**
- Consumes: `pedidoDaIA`, `aplicarSugestoes`, `categorizarComIA` (Task 2).
- Produces, no objeto do hook (`ImportarExtrato`):
  ```ts
  ia: { estado: "ocioso" | "lendo" | "pronto" | "falhou" | "indisponivel"; sugeridas: number; ficaram: number; mensagem: string | null }
  tentarIaDeNovo: () => void
  origemDe: (clientId: string) => OrigemDaCategoria | null
  // FiltroConferencia ganha "ia"; contagens["ia"] = linhas com origem "ia"
  ```

**Comportamento:**
- Ao entrar em `conferir` com pendentes, o estado vai a `lendo` e a chamada parte uma vez por lote. Pense num `useEffect` com o número da vez, como a releitura.
- Na resposta:
  - aplica só nas linhas que ainda estão sem categoria;
  - marca origem `"ia"`;
  - o estado vai a `pronto`, com `sugeridas`.
- `setCategoria` feito pela pessoa marca origem `"pessoa"`.
- A releitura (Inverter, Ajustar) guarda as sugestões por `chavesDasLinhas` e as reaplica na leitura nova, antes de pedir de novo. Assim só o que falta vai à IA, e o cache do servidor cobre o resto.
- Erro:
  - 402 → `indisponivel`, sem mensagem;
  - `cota` → `falhou`, com a mensagem de cota;
  - outro erro → `falhou`, com "A IA não respondeu agora. Categorize à mão.".
- Fechar, `reiniciar` ou voltar ao arquivo invalida a vez.

- [x] **Step 1: testes que falham.** Use as funções puras, e o hook com o `categorizarComIA` simulado, como o arquivo já faz com o Supabase:
  - a resposta não pisa numa categoria da pessoa;
  - uma resposta de vez velha é ignorada;
  - 402 → `indisponivel`;
  - releitura reaplica pela chave;
  - `contagens.ia`.
- [x] **Step 2:** rodar → FAIL.
- [x] **Step 3:** implementar.
- [x] **Step 4:** a Verificação passa.
- [x] **Step 5:** commit `feat(importar): a conferência pede à IA as categorias que faltam, sem pisar na escolha da pessoa`.

### Task 4: o wireframe na conferência

**Files:**
- Create: `src/components/wireframe/importar-ia-wireframe.tsx`
- Modify: `src/components/transactions/importar/conferir-importacao.tsx` (importa o wireframe; ganha o filtro "Pela IA" em `FILTROS`)
- Test: `src/components/wireframe/wireframe.test.ts` (se ele lista os arquivos) e `importar-extrato-dialog.test.ts`

**Interfaces:**
- Consumes: `imp.ia`, `imp.tentarIaDeNovo`, `imp.origemDe`, `imp.setFiltro("ia")` (Task 3).
- Produces:
  ```ts
  export function FaixaDaIaWireframe(props: { ia: ImportarExtrato["ia"]; onVer: () => void; onTentar: () => void }): React.ReactElement | null
  export function MarcaIaWireframe(): React.ReactElement   // a etiqueta "IA" ao lado da categoria da linha
  ```
- **A faixa** (acima das abas, nos dois modos):
  - `lendo`: "A IA está lendo N lançamentos sem categoria…";
  - `pronto`: "A IA sugeriu N categorias. Revise antes de importar.", com o botão "Ver sugeridas" (`onVer`, filtro "ia"); com `ficaram > 0`, soma "N ficaram para você.";
  - `falhou`: a `mensagem`, com "Tentar de novo";
  - `ocioso` e `indisponivel`: `null`.
- **A marca:** em `Linha` (compacto) e na célula de categoria da tabela, quando `origemDe(id) === "ia"`.
- **O filtro novo:** `{ valor: "ia", rotulo: "Pela IA", so_com_linhas: true }`, depois de "Sem categoria".

- [x] **Step 1: testes de fonte que falham.**
  - O wireframe tem `WIREFRAME · Bloco 2 · Categorias pela IA` e `border-dashed`, e não importa nada de `@/components/ui/`.
  - `conferir-importacao.tsx` importa `FaixaDaIaWireframe` e `MarcaIaWireframe`, e tem `rotulo: "Pela IA"`.
- [x] **Step 2:** rodar → FAIL.
- [x] **Step 3:** implementar.
- [x] **Step 4:** a Verificação passa. O `ds:audit` ignora `src/components/wireframe/`.
- [x] **Step 5:** commit `feat(importar): a faixa e a marca da IA na conferência, em wireframe`.

### Task 5: a jornada e o Atlas

**Files:**
- Modify: `docs/JORNADAS.md` (a linha da tabela do Importar, linha 899, e o fluxograma da jornada de Transações, se ele mostra a conferência)
- Modify: `docs/atlas/template.html` (o "Como funciona" do Importar, o apêndice de backend com a op `categorizar` da `ia-ler`, a data e as contagens da capa)
- Generated: `docs/atlas/atlas-jornadas.html`, via `python3 docs/atlas/build.py`

- [x] **Step 1:** descrever o passo novo:
  - as regras primeiro;
  - a IA para o que sobra (op `categorizar` da `ia-ler`, plano Família, uma cota por lote, até 200 linhas);
  - a marca e o filtro "Pela IA";
  - a pessoa vence.
- [x] **Step 2:** rodar `python3 docs/atlas/build.py`, sem erro.
- [x] **Step 3:** commit `docs(jornadas): a categoria pela IA no Importar`.
- [x] **Controlador:** republicar `docs/atlas/atlas-jornadas.html` no mesmo URL do Atlas (https://claude.ai/artifact/1N43LFYP1YSVsWaRMaNTRL) com a ferramenta de Artifact.

### Task 6: deploy e conferência ao vivo (controlador, com o dono)

- [ ] **Parar e perguntar ao dono** antes do deploy: `supabase functions deploy ia-ler --use-api`, que vai para produção.
- [ ] Com o ok, abrir o Importar com um CSV de teste gerado no navegador, com descrições genéricas e categorias da carteira (só ler; **nunca clicar Importar**), e conferir:
  - as regras categorizam "COMPRA MERCADO …";
  - a faixa mostra "lendo" e depois "sugeriu N";
  - a marca "IA" aparece e o filtro "Pela IA" junta as linhas;
  - trocar uma categoria tira a marca;
  - o Inverter não pede tudo de novo (a cota não cai duas vezes, conferir em `ia_eventos` ou no retorno `doCache`).
- [ ] Mandar prints ao dono.
