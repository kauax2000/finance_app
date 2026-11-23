# Apple Pay que lança: plano de implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para implementar este plano tarefa por tarefa. Os passos usam caixas (`- [ ]`).

**Objetivo:** uma compra com Apple Pay vira lançamento, com valor, estabelecimento e cartão, em vez de voltar "Não lançado".

**Arquitetura:** o atalho "Lançar gasto" passa a mandar as propriedades da transação da Carteira (`amount`, `merchant`, `card`) e também o texto inteiro dela. A Edge `capture` usa as propriedades quando chegam e cai no texto quando não chegam. Uma falha do Apple Pay explica o que chegou, e assim um só teste no telefone confirma o formato. O Apple Pay nunca chama a IA.

**Stack:** Python 3 + `plistlib` + `shortcuts sign` (macOS) no gerador; Deno + `deno test` na Edge; Supabase Edge Functions.

**Especificação:** não há documento à parte. A especificação é este diagnóstico (§0), junto com a seção 4 de `docs/captura/atalho-iphone.md` e a linha "Lançar ao pagar" de `docs/JORNADAS.md`.

## 0. Diagnóstico (23/nov/2026)

- **Sintoma:** o dono pagou com Apple Pay no iPhone e recebeu a notificação "Não lançado: …". Em produção não há nenhuma linha com `source = 'apple_pay'`: o pedido falhou antes do insert. `capture_tokens.last_used_at` parou em 22/nov, porque ele só anda num uso válido.
- **Causa:** o ramo "com Entrada" de `scripts/atalho/gerar-atalho.py` (linha 148) manda `{ text: <Entrada do atalho>, source: "apple_pay" }`. Isso vale desde a primeira versão (668b99de, 3/nov). A Edge só trata um pedido como Apple Pay quando vem `amount` (`temAmount`, em `supabase/functions/_shared/captura.ts:316`). Sem ele, a transação convertida em texto vai ao parser de frase. O texto não traz valor, e a resposta é `422 sem_valor`, que o atalho mostra como "Não lançado: Não entendi o valor. Ex.: 42 mercado".
- **O que o resto já espera:** o guia manual (`docs/captura/atalho-iphone.md` §4), o fluxograma de `docs/JORNADAS.md` (`POST amount, merchant, card, source apple_pay`) e os testes da Edge já usam as três propriedades. O que destoa é só o arquivo do atalho.
- **Incerteza:** não achamos registro público do `PropertyName` que o plist usa para as propriedades da transação. A aposta é `Amount`, `Merchant` e `Card or Pass`, os nomes em inglês que o próprio guia cita (Shortcuts usa o nome em inglês como `PropertyName`). Por isso o atalho manda também o `text`, e a falha do Apple Pay ecoa o que chegou. Se a aposta errar, a notificação do teste mostra o formato, e o conserto é trocar um nome.

## Restrições globais

- `supabase/functions/_shared/frase.ts` continua sem imports.
- Produção (Supabase "Well Finance SP", `gexvgoknthcvdnqtdukq`) só com pedido explícito do dono. Antes de publicar, guarde a versão no ar da Edge em `~/Desktop/Finance App/backups-prod/2026-11-23-apple-pay/`. Publique com `supabase functions deploy capture --use-api --no-verify-jwt --project-ref gexvgoknthcvdnqtdukq`, fora do sandbox.
- Não faça push de `finance-app-2.0` para `main`.
- Toda resposta de erro mantém `resumo` (o texto da notificação) e `codigo` quando há.
- Toda condição do atalho é "tem qualquer valor" (`WFCondition` 100), nunca "é".
- Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Foco da revisão

1. **Propriedade com nome errado no iOS:** `amount` chega `""` e o texto não tem valor. Esperado: "Não lançado", pedindo para baixar o atalho de novo e mostrando o que chegou. Testado na Tarefa 1.
2. **Atalho antigo ainda instalado** (só `text`, sem `amount`): a mesma mensagem, com o eco. Testado na Tarefa 1.
3. **Valor com milhar** (`"R$ 1.234,56"`): lança 1234.56. Testado na Tarefa 1.
4. **Estorno na Carteira** (`"-R$ 10,00"`): não lança, `422 sem_valor`, com o texto de hoje. Testado na Tarefa 1.
5. **Apple Pay sem valor não chama a IA:** `precisaDeIA` devolve `false` para `source: apple_pay`. Testado na Tarefa 1.

---

### Task 1: a Edge entende o Apple Pay que vier

**Arquivos:**
- Modificar: `supabase/functions/_shared/captura.ts` (`precisaDeIA` ~L205; o retorno de `valor == null` em `montarLancamento` ~L369; uma constante nova perto de `ERRO_VALOR`, L141)
- Testar: `supabase/functions/_shared/captura.test.ts`

**Interfaces:**
- Produz: `export const ERRO_APPLE_PAY_SEM_VALOR = 'A compra chegou sem o valor. Baixe o atalho de novo em Lançar pelo iPhone.'` e `export function erroDoApplePaySemValor(texto: string | undefined): string`, que devolve a constante, ou a constante + ` Chegou: "<texto aparado, até 60 caracteres, com … se cortou>"` quando há texto.
- Consome: `montarLancamento`, `precisaDeIA` e `validarPedido` como estão.

- [ ] **Passo 1: escreva os testes que falham**, em `captura.test.ts`, no estilo dos vizinhos (`ok()`, `comCats`, `AGORA` e o contexto que eles já montam):

```ts
Deno.test('Apple Pay só com texto sem valor pede o atalho novo e mostra o que chegou', () => {
  const r = montarLancamento({ text: 'Padaria Real', source: 'apple_pay' }, comCats([]))
  assertEquals(r.ok, false)
  if (r.ok) return
  assertEquals(r.status, 422)
  assertEquals(r.codigo, 'sem_valor')
  assertEquals(r.erro, `${ERRO_APPLE_PAY_SEM_VALOR} Chegou: "Padaria Real"`)
})

Deno.test('Apple Pay com propriedades vazias lança pelo texto', () => {
  const l = ok(montarLancamento({ amount: '', merchant: '', card: '', text: 'Padaria Real 42,90', source: 'apple_pay' }, comCats([])))
  assertEquals(l.linha.amount, 42.9)
  assertEquals(l.linha.source, 'apple_pay')
})

Deno.test('Apple Pay com milhar no valor', () => {
  const l = ok(montarLancamento({ amount: 'R$ 1.234,56', merchant: 'Loja', source: 'apple_pay' }, comCats([])))
  assertEquals(l.linha.amount, 1234.56)
})

Deno.test('Apple Pay: estorno não lança', () => {
  const v = validarPedido({ amount: '-R$ 10,00', merchant: 'Loja', source: 'apple_pay' })
  assertEquals(v, { ok: false, erro: ERRO_VALOR, codigo: 'sem_valor' })
})

Deno.test('erroDoApplePaySemValor corta o eco em 60 caracteres', () => {
  assertEquals(erroDoApplePaySemValor(undefined), ERRO_APPLE_PAY_SEM_VALOR)
  assertEquals(erroDoApplePaySemValor('   '), ERRO_APPLE_PAY_SEM_VALOR)
  assertEquals(erroDoApplePaySemValor('a'.repeat(80)), `${ERRO_APPLE_PAY_SEM_VALOR} Chegou: "${'a'.repeat(60)}…"`)
})

Deno.test('precisaDeIA: o Apple Pay nunca, nem só com texto', () => {
  assertEquals(precisaDeIA({ text: 'Padaria Real', source: 'apple_pay' }, '2026-11-23', []), false)
})

Deno.test('frase do atalho sem valor continua com o erro de sempre', () => {
  const r = montarLancamento({ text: 'mercado', source: 'shortcut' }, comCats([]))
  assertEquals(r.ok === false && r.erro, ERRO_VALOR)
})
```

Se o assinante real de `montarLancamento` pedir outro contexto que não `comCats([...])`, use o mesmo que os testes vizinhos de Apple Pay (L972, L1016). As asserções não mudam.

- [ ] **Passo 2: rode e veja falhar.** `cd supabase/functions && deno test _shared/captura.test.ts`. Esperado: FAIL, porque `ERRO_APPLE_PAY_SEM_VALOR` e `erroDoApplePaySemValor` não existem.

- [ ] **Passo 3: implemente** em `captura.ts`:
  - a constante e `erroDoApplePaySemValor`, como em Interfaces;
  - em `precisaDeIA`, `if (pedido.source === 'apple_pay') return false` logo no começo; o comentário "O Apple Pay nunca" passa a valer de fato;
  - em `montarLancamento`, no `if (valor == null)`, o erro vira `pedido.source === 'apple_pay' ? erroDoApplePaySemValor(pedido.text) : ERRO_VALOR`, com o mesmo status 422 e o mesmo `codigo`.

  O texto da transação é dado da pessoa, que ela vê no próprio telefone. Não vai para log nem para `capture_meta`.

- [ ] **Passo 4: rode e veja passar.** `deno test _shared/` (a pasta toda) e `npx vitest run src/lib/captura`. Esperado: tudo verde. O `_shared` é dividido com o app, então o vitest confere que nada do lado do Node quebrou.

- [ ] **Passo 5: faça o commit.**

```bash
git add supabase/functions/_shared/captura.ts supabase/functions/_shared/captura.test.ts
git commit -m "fix(capture): o Apple Pay sem valor diz o que chegou e nunca chama a IA"
```

### Task 2: o atalho manda as propriedades da compra

**Arquivos:**
- Modificar: `scripts/atalho/gerar-atalho.py` (docstring L8–9; `cabecalhos` L96; o ramo "Com Entrada" L146–148; `verificar()` L240)
- Regenerar: `public/atalho/Lançar gasto.shortcut`

**Interfaces:**
- Produz: `propriedade(nome: str) -> dict`, que devolve `{"Type": "ExtensionInput", "Aggrandizements": [{"Type": "WFPropertyVariableAggrandizement", "PropertyName": nome}]}`.
- Consome: o contrato da Edge da Tarefa 1 (`amount`, `merchant`, `card` e `text`, com `source: apple_pay`).

- [ ] **Passo 1: o teste que falha.** Em `verificar()`, troque a asserção dos corpos e acrescente a das propriedades:

```python
assert corpos == [["amount", "merchant", "card", "text", "source"], ["text", "source"], ["amount", "merchant", "category", "payment", "source"]], corpos
pay = next(p for p in pedidos if p["WFHTTPMethod"] == "POST")
campos = {i["WFKey"]["Value"]["string"]: i["WFValue"]["Value"] for i in pay["WFJSONValues"]["Value"]["WFDictionaryFieldValueItems"]}
nomes = {k: [a["PropertyName"] for a in v["attachmentsByRange"]["{0, 1}"].get("Aggrandizements", [])] for k, v in campos.items() if k in ("amount", "merchant", "card")}
assert nomes == {"amount": ["Amount"], "merchant": ["Merchant"], "card": ["Card or Pass"]}, nomes
assert campos["text"]["attachmentsByRange"]["{0, 1}"] == ENTRADA
```

Na checagem dos cabeçalhos, a versão é `"3"`: `assert cab["X-Atalho-Versao"]["string"] == "3"`.

- [ ] **Passo 2: rode e veja falhar.** `python3 scripts/atalho/gerar-atalho.py --verificar`. Esperado: `AssertionError` na lista de corpos.

- [ ] **Passo 3: implemente.**
  - Crie `propriedade(nome)`.
  - No `pedido(r_pay, …)`, o corpo é `[("amount", texto(VAR, {0: propriedade("Amount")})), ("merchant", texto(VAR, {0: propriedade("Merchant")})), ("card", texto(VAR, {0: propriedade("Card or Pass")})), ("text", texto(VAR, {0: ENTRADA})), ("source", texto("apple_pay"))]`.
  - `X-Atalho-Versao` passa a `"3"`.
  - A docstring diz que, com Entrada, o atalho manda valor, estabelecimento e cartão da transação, mais o texto dela como reserva.

- [ ] **Passo 4: rode e veja passar.** `python3 scripts/atalho/gerar-atalho.py --verificar` imprime `ok`. Depois gere o arquivo assinado com `python3 scripts/atalho/gerar-atalho.py`, fora do sandbox, porque o `shortcuts sign` fala com a Apple. Ele imprime o caminho de `public/atalho/Lançar gasto.shortcut`. Confira que o arquivo mudou (`git status`).

- [ ] **Passo 5: faça o commit.**

```bash
git add scripts/atalho/gerar-atalho.py "public/atalho/Lançar gasto.shortcut"
git commit -m "fix(atalho): o Apple Pay manda valor, estabelecimento e cartão da compra"
```

### Task 3: a documentação e o Atlas

**Arquivos:**
- Modificar: `docs/captura/atalho-iphone.md` §4; `docs/JORNADAS.md` (a linha "Lançar ao pagar", L420, e a de "Tokens de captura", L419, onde diz `X-Atalho-Versao: 2`); `docs/atlas/template.html` (a mesma jornada, e a data da capa)
- Regenerar: `docs/atlas/atlas-jornadas.html`

- [ ] **Passo 1:** em `atalho-iphone.md` §4, escreva que o atalho baixado já manda `amount`, `merchant`, `card` e o `text` da compra, e que o passo a passo manual é para quem monta sem ele. Uma notificação "A compra chegou sem o valor…" pede baixar o atalho de novo: "Baixar o atalho de novo" no ⋯ e, na automação, escolher o atalho novo.
- [ ] **Passo 2:** em `JORNADAS.md`:
  - na linha "Lançar ao pagar", registre o corpo do pedido do atalho, a falha "A compra chegou sem o valor…" com o eco e o "nunca chama a IA";
  - na de "Tokens de captura", troque a versão para 3 e date a mudança (23/nov/2026);
  - registre a lacuna do Apple Pay que nunca lançou, aberta de 3/nov a 23/nov, como fechada na seção de fechadas.
- [ ] **Passo 3:** espelhe o mesmo em `docs/atlas/template.html`, rode `python3 docs/atlas/build.py` (ele precisa terminar sem `AssertionError`) e republique `docs/atlas/atlas-jornadas.html` no URL do Atlas (https://claude.ai/artifact/1N43LFYP1YSVsWaRMaNTRL) com a ferramenta de Artifact.
- [ ] **Passo 4: faça o commit.**

```bash
git add docs/captura/atalho-iphone.md docs/JORNADAS.md docs/atlas/template.html docs/atlas/atlas-jornadas.html
git commit -m "docs(jornadas): o Apple Pay manda as propriedades da compra"
```

### Task 4: publicar e testar no telefone

Esta tarefa toca produção e o telefone do dono. Pare e peça o ok antes do Passo 1.

- [ ] **Passo 1:** com o ok, guarde a Edge no ar com `supabase functions download capture --use-api --project-ref gexvgoknthcvdnqtdukq --workdir ~/Desktop/Finance\ App/backups-prod/2026-11-23-apple-pay/`. Depois publique a local com o comando das Restrições globais. Confira com um `curl -X POST` sem token, que deve responder `401`.
- [ ] **Passo 2:** faça o push de `finance-app-2.0`. O Vercel publica o arquivo novo do atalho.
- [ ] **Passo 3: o dono testa.**
  1. Em Você › "Lançar pelo iPhone" (no computador, Configurações), no ⋯ do atalho, toque em "Baixar o atalho de novo" e importe o arquivo.
  2. No app Atalhos, abra a automação de Transação e confira que ela roda o "Lançar gasto" novo. Se o iOS importou como "Lançar gasto 2", escolha esse.
  3. Pague algo com Apple Pay.
- [ ] **Passo 4: leia o resultado.**
  - Se lançou: com ok de leitura, confira em produção a última linha `source = 'apple_pay'` (`amount`, `description`, `payment_method`, `needs_review`).
  - Se veio "A compra chegou sem o valor… Chegou: \"…\"": o eco mostra o formato. Troque o `PropertyName` errado na Tarefa 2 (o `Card or Pass` pode ser `Card`), gere de novo e repita o Passo 3.
