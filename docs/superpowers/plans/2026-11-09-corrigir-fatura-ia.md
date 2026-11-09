# Conferir fatura: leitura e alinhamento com IA — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** quando a leitura do PDF sai incompleta ou a comparação sobra dos dois lados, a conferência usa a IA do app sozinha: relê a fatura e casa as compras do banco com as do app que a regra de texto não casou.

**Architecture:**
- **Edge `ia-ler`:** ganha a operação `alinhar`. O prompt e a validação ficam em `supabase/functions/_shared/ia.ts`, com `alinharFatura`, na mesma cadeia de modelos da tarefa `texto`, com redação, cache e cota.
- **Cliente:** `src/lib/ia/ler.ts` ganha `alinharFaturaComIA`. Uma função pura, `aplicarAlinhamento` em `src/lib/fatura/alinhar.ts`, move os pares que a IA achou de "falta no app" e "só no app" para `valorDiferente` ou `bate`.
- **Wireframe:** dispara as duas coisas sozinho, uma vez por leitura.

**Tech Stack:** Next 16, Vitest, Deno (Edge), Groq e Cloudflare pela `CADEIA` de `ia-config.ts`.

**Spec:** `docs/superpowers/specs/2026-11-09-corrigir-fatura-design.md`, mais o pedido do dono de 09/11: "se for necessário, faça a leitura e alinhamento com inteligência artificial, os modelos que temos dentro do app".

## Global Constraints

- **Por que o alinhamento existe:** ele resolve o caso que a regra não pega. Valor diferente com descrição diferente: "PELANDA ALPINO 3" (R$ 228,13) no banco e "Gasolina" (R$ 228,14) no app viram hoje um "falta no app" mais um "só no app".
- **O que vai à IA, e só isso:**
  - Banco: índice, data, descrição já redigida e valor.
  - App: índice, data, descrição e valor.
  - Nunca o id do lançamento, a categoria ou o nome de quem lançou.
  - O texto passa pelo `redigir` com os nomes dos membros, como na fatura.
- **A IA só sugere o par, e o código valida.** Um par só vale com:
  - índices dentro da faixa e nunca repetidos;
  - mesmo tipo (estorno com receita);
  - `|dias| ≤ 7`;
  - `|valor_banco − valor_app| ≤ max(10, 25% do valor do banco)`.

  O que falhar na validação é descartado em silêncio.
- **"Se for necessário"**:
  - **Reler com IA** só quando a leitura é de PDF, saiu incompleta (`completa === false`) e ainda não passou pela IA.
  - **Alinhar** só quando, depois da regra, sobra ao menos um item em "falta no app" **e** um em "só no app".
  - Cada um roda uma vez por leitura (`leituraId`), sozinho, e o botão "Ler com IA" sai.
- **Cota e erro**: a chamada gasta da cota de 30 por dia. Se faltar cota ou rede, aparece o aviso de hoje (`MENSAGEM` de `ler.ts`), a conferência continua com o resultado da regra e não há nova tentativa.
- **Na tela**: o par que veio da IA leva " (IA)" na linha de "Valor diferente". Enquanto ela lê, aparece "Relendo com IA…" e, enquanto alinha, "Alinhando com IA…".
- **Produção**:
  - A Edge só vai para produção com o pedido explícito do dono, fora deste plano. Até lá, o cliente recebe erro e segue sem alinhar.
  - Nos testes, nada chama provedor nem banco: as Edges têm `fetch` falso, como `ia.test.ts`, e o cliente tem `invokeEdgeJson` falso.
  - No navegador, só leitura: não envie arquivo.
- **Branch `finance-app-2.0`**:
  - Os commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
  - Sem push.
  - Nunca adicione `CLAUDE.md` nem `graphify-out/`.
  - Outra sessão também faz commits aqui.

## Review Focus

1. **A IA devolve um par inválido** (índice fora, repetido, tipo trocado, valor longe demais): ele é descartado e o resto vale. Teste na Task 1 e na Task 2.
2. **Re-render, StrictMode ou troca de ciclo** com a IA ainda pensando: no máximo uma chamada por leitura, e a resposta velha não entra na leitura nova. Teste na Task 3, por guarda em `ref` e `pedido`.
3. **A soma não muda pelo alinhamento**: `somaApp` e `somaBanco` continuam iguais e só a classificação muda. Teste na Task 2.
4. **Um par da IA com o app fora do ciclo** não deve existir, porque "só no app" é só do ciclo. Teste na Task 2: o par passa a ser `valorDiferente`, e `sugerirCorrecoes` o trata como sempre.
5. **Cota esgotada**: o aviso aparece uma vez e nada fica girando. Teste na Task 3.

---

### Task 1: Edge — a operação `alinhar`

**Files:**
- Modify: `supabase/functions/_shared/ia.ts`, `supabase/functions/_shared/ia.test.ts` e `supabase/functions/ia-ler/index.ts`.

**Interfaces:**
- Produces, em `_shared/ia.ts`:

```ts
export type ItemParaAlinhar = { i: number; data: string; descricao: string; valor: number; estorno: boolean }
export type ParAlinhado = { banco: number; app: number }
export function validarPares(bruto: unknown, banco: ItemParaAlinhar[], app: ItemParaAlinhar[]): ParAlinhado[]  // aplica as regras de "A IA só sugere o par", e nunca devolve null: o inválido sai
export async function alinharFatura(ctx: ContextoIA, banco: ItemParaAlinhar[], app: ItemParaAlinhar[]): Promise<ResultadoIA<ParAlinhado[]>>
```

**Regras:**
- O prompt pede `{"pares":[{"banco":i,"app":j}]}` e diz que só se casa o que é a mesma compra, mesmo com nomes diferentes (estabelecimento contra descrição livre).
- As descrições passam pelo `redigir(…, ctx.nomes)`.
- O cache usa `sha256Hex("alinhar:" + VERSAO_PROMPT + JSON das listas)`, e a cadeia é `'texto'`.
- Tetos: até 200 itens de cada lado; acima disso, `{ ok: false, motivo: 'fatura_grande' }`.
- **No `ia-ler`**: entra `op: 'alinhar'`, com corpo `{ op, workspaceId, banco, app }`.
  - Valida que são arrays de `ItemParaAlinhar`, com descrição de até 200 caracteres.
  - Responde `{ ok: true, pares, provedor, modelo }` com a chave `pares`.
  - Usa a mesma ordem de JWT, membro, plano e nomes das outras operações.

- [ ] **Step 1:** Escreva os testes em `ia.test.ts`, com `fetch` falso como os vizinhos:
  - `validarPares descarta índice fora, repetido, tipo trocado, dias > 7 e valor longe`;
  - `validarPares aceita 228.13 x 228.14 a 0 dias`;
  - `alinharFatura redige o nome do membro antes de enviar`;
  - `alinharFatura recusa mais de 200 itens com fatura_grande`.
- [ ] **Step 2:** Rode `deno test supabase/functions/_shared/ia.test.ts` (ou o comando de `supabase/LOCAL_EDGE_FUNCTIONS.md`). Esperado: FAIL.
- [ ] **Step 3:** Implemente. **Step 4:** PASS, e os testes antigos de `ia.test.ts` intactos.
- [ ] **Step 5:** Commit `feat(ia): alinhar a fatura do banco com os lançamentos do app`.

### Task 2: Cliente — chamar e aplicar o alinhamento

**Files:**
- Modify: `src/lib/ia/ler.ts`, para acrescentar `alinharFaturaComIA(workspaceId, banco, app)`, que devolve `Lido<{ pares: ParAlinhado[] }>` (espelhe os tipos com um comentário apontando `_shared/ia.ts`, como os vizinhos).
- Create: `src/lib/fatura/alinhar.ts` e `src/lib/fatura/alinhar.test.ts`.

**Interfaces:**
- Consumes: `ConferenciaNoCiclo<ItemImportavel>`, de `ciclo.ts`.
- Produces:

```ts
export function paraAlinhar(conf: ConferenciaNoCiclo<ItemImportavel>): { banco: ItemParaAlinhar[]; app: ItemParaAlinhar[] }  // índices = posição em faltaNoApp / soNoApp; app.estorno = type === "income"
export function aplicarAlinhamento<T extends ItemImportavel>(conf: ConferenciaNoCiclo<T>, pares: ParAlinhado[]): ConferenciaNoCiclo<T> & { daIA: Set<string> }  // daIA: ids de app casados pela IA
```

**Regras:**
- Revalida no cliente as mesmas regras do `validarPares`, para não confiar na Edge. Extraia-as para uma função pura em `alinhar.ts`, sem duplicar.
- Valor igual vai para `bate`, e valor diferente para `valorDiferente`.
- Tira os itens de `faltaNoApp` e de `soNoApp`.
- `somaBanco`, `somaApp` e `diferenca` não mudam.

- [ ] **Step 1:** Escreva os testes:
  - `move o par Gasolina 228.13 x 228.14 para valorDiferente`;
  - `valor igual vai para bate`;
  - `par inválido é ignorado`;
  - `somas não mudam`;
  - `sugerirCorrecoes vê o par como valor-diferente`;
  - `alinharFaturaComIA traduz cota e sem conexão` (com `invokeEdgeJson` mockado por `vi.mock`).
- [ ] **Step 2:** Rode `npx vitest run src/lib/fatura/alinhar.test.ts src/lib/ia/`. Esperado: FAIL.
- [ ] **Step 3:** Implemente. **Step 4:** Rode de novo. Esperado: PASS.
- [ ] **Step 5:** Commit `feat(fatura): aplicar o alinhamento da IA na conferência`.

### Task 3: Wireframe — automático quando precisa, e jornadas

**Files:**
- Modify: `src/components/wireframe/conferir-fatura-wireframe.tsx`, `src/components/wireframe/corrigir-fatura-wireframe.tsx` e `src/components/wireframe/wireframe.test.ts`.
- Modify: `docs/JORNADAS.md` (seção 6, o nó da leitura e a linha "Conferir fatura (Bloco 2)") e `docs/atlas/template.html` (o item da conferência e a data). Depois rode `python3 docs/atlas/build.py`.

**Comportamento:**
- **Reler**: depois de uma leitura de PDF com `completa === false` e sem `ia`, chama `lerComIA()` sozinho, uma vez por `leituraId`. O botão "Ler com IA" sai.
- **Alinhar**:
  - Com a conferência pronta e sobrando nos dois lados, chama `alinharFaturaComIA` uma vez por `leituraId`, com guarda em `ref`. A resposta é descartada se `pedido.current` mudou.
  - Guarde os pares no estado. A conferência mostrada é `aplicarAlinhamento(conf, pares)`, e é ela que segue para o `CorrigirFatura`, o `semDiferencas` e a aprovação automática.
- **Na tela**: "Relendo com IA…" e "Alinhando com IA…" aparecem num `role="status"`. O erro vai para `aviso` uma vez. Em "Valor diferente", o par cujo `app.id` está em `daIA` ganha " (IA)".
- **Pendências**: enquanto a IA trabalha, "Aprovar todas" e "Revisar uma por uma" ficam desabilitados, porque o `pendente` já cobre.

- [ ] **Step 1:** Escreva testes de fonte em `wireframe.test.ts`. O conferir importa `alinharFaturaComIA` e `aplicarAlinhamento` e contém "Alinhando com IA" e "Relendo com IA". O botão "Ler com IA" não existe mais. O corrigir contém "(IA)".
- [ ] **Step 2:** Rode `npx vitest run src/components/wireframe/`. Esperado: FAIL nos novos.
- [ ] **Step 3:** Implemente e atualize as jornadas e o Atlas. **Step 4:** Rode `npx vitest run src/components/wireframe/ src/lib/fatura/ src/lib/ia/`, `npx tsc --noEmit` e `npx eslint src/components/wireframe/ src/lib/fatura/ src/lib/ia/`. Esperado: PASS. Abra a página do cartão em `http://localhost:3000/credit-cards/fba50ad4-fa76-4b75-9f2e-e25a2dcd577d` **só para ler**.
- [ ] **Step 5:** Commit `feat(fatura): a conferência relê e alinha com IA quando precisa`, com `docs/` e sem `graphify-out/`.

## Depois do plano (pede o dono)

Publicar a Edge `ia-ler` em produção (`supabase functions deploy ia-ler --use-api`, fora do sandbox), junto com a migração da fatura aprovada.
