# Atalho por gatilho Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A pessoa escolhe o gatilho (Siri, Toque atrás, Botão de Ação, Tela bloqueada, Ícone) antes de baixar; baixa o arquivo daquele gatilho; o atalho avisa o gatilho e a lista de aparelhos o mostra.

**Architecture:** O gerador Python assina cinco variantes em `public/atalho/<gatilho>/Lançar gasto.shortcut`, cada uma com o cabeçalho `X-Atalho-Gatilho`. A Edge `capture` grava o cabeçalho em `capture_tokens.atalho_gatilho` (mesmo padrão de `atalho_versao`). O `GuiaDoAtalho` ganha o passo 1 de escolha e baixa o arquivo escolhido; a `AtalhoSecao` mostra o gatilho na linha.

**Tech Stack:** Python 3 + `shortcuts sign` (macOS), Deno (Edge), Postgres (migração Supabase), Next.js/React + design system do projeto, Vitest, `deno test`.

**Spec:** `docs/superpowers/specs/2026-11-19-atalho-por-gatilho-design.md`

## Global Constraints

- Branch `finance-app-2.0`. Nada vai para `main`.
- Valores do gatilho, exatos: `siri`, `acao`, `toque`, `bloqueio`, `inicio`.
- Todo arquivo baixado importa com o nome **Lançar gasto** (`public/atalho/<gatilho>/Lançar gasto.shortcut`).
- Siri é falada (`showresult`); os outros quatro são idênticos ao atalho de hoje, só com o cabeçalho a mais.
- Comparações no atalho só com `se_igual` (dicionário + "tem qualquer valor"); nada de `WFConditionalActionString`.
- `public/atalho/Lançar gasto.shortcut` da raiz continua, sem `X-Atalho-Gatilho`.
- Banco é o de produção: migração aplicada e Edge publicada **só no Task 6, com o ok do dono**.
- UI só com o design system (`AGENTS.md`); `src/components/ui/` não muda.
- Mudança de jornada: `docs/JORNADAS.md`, `docs/atlas/template.html`, `python3 docs/atlas/build.py`, republicar o Atlas (https://claude.ai/artifact/1N43LFYP1YSVsWaRMaNTRL).
- Depois de mexer em código: `graphify update .`.

## Review Focus

- POST sem `X-Atalho-Gatilho` (automação do Apple Pay, compartilhar do Android) não apaga o gatilho gravado — teste no Task 2.
- Cabeçalho fora da lista (`Siri`, `toque2`, vazio) não grava nada; com espaços em volta (` toque `) grava `toque` — teste no Task 2.
- Na variante Siri, o ramo do Apple Pay (com Entrada) continua com `notification`: a automação roda em segundo plano, sem ninguém para ouvir — verificação no Task 1.
- Voltar ao passo 1 depois de criar o código e trocar o gatilho não cria outro código, e o passo 3 baixa o arquivo novo — teste no Task 3.
- Aparelho sem gatilho (atalho antigo) mantém a linha de hoje, sem " · " sobrando — teste no Task 4.

---

### Task 1: Gerador com cinco variantes

**Files:**
- Modify: `scripts/atalho/gerar-atalho.py`
- Create (gerados): `public/atalho/{siri,acao,toque,bloqueio,inicio}/Lançar gasto.shortcut`
- Modify (gerado): `public/atalho/Lançar gasto.shortcut`

**Interfaces:**
- Produces: `GATILHOS = ("siri", "acao", "toque", "bloqueio", "inicio")`; `atalho(url: str, gatilho: str | None = None, frase_de_teste: str | None = None) -> dict`; arquivos em `public/atalho/<gatilho>/Lançar gasto.shortcut`.

- [ ] **Step 1: Estender `verificar()` (o teste) antes do código**

No fim de `verificar()`, antes do `print("ok")`, conferir as variantes:

```python
for g in GATILHOS:
    d = atalho("https://exemplo.supabase.co/functions/v1/capture", g)
    a = d["WFWorkflowActions"]
    for p in (x["WFWorkflowActionParameters"] for x in a if _id(x) == "downloadurl"):
        cab = {_txt(i["WFKey"]): _txt(i["WFValue"]) for i in p["WFHTTPHeaders"]["Value"]["WFDictionaryFieldValueItems"]}
        assert cab["X-Atalho-Gatilho"] == g and cab["X-Atalho-Versao"] == "2", cab
    fim_entrada = next(i for i, x in enumerate(a) if _id(x) == "conditional" and x["WFWorkflowActionParameters"]["WFControlFlowMode"] == 1)
    resto = [_id(x) for x in a[fim_entrada:]]
    if g == "siri":
        assert "notification" not in resto and resto.count("showresult") == 3, resto
        assert [_id(x) for x in a[:fim_entrada]].count("notification") == 1  # Apple Pay segue notificando
    else:
        assert "showresult" not in resto
# A raiz (sem gatilho) não manda o cabeçalho.
raiz = atalho("https://exemplo.supabase.co/functions/v1/capture")
assert not any("X-Atalho-Gatilho" in str(x) for x in raiz["WFWorkflowActions"])
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `python3 scripts/atalho/gerar-atalho.py --verificar`
Expected: `NameError: name 'GATILHOS' is not defined`

- [ ] **Step 3: Implementar**

- `GATILHOS` no topo; `cabecalhos(codigo, gatilho)` acrescenta `("X-Atalho-Gatilho", texto(gatilho))` quando há gatilho; `pedido(...)` repassa.
- `notificar(de, falar=False)`: com `falar`, devolve `acao("showresult", Text=texto(VAR, {0: saida(de, "Valor do Dicionário")}))`. Em `atalho()`, os `notificar` depois do `senao(entrada_se)` usam `falar=gatilho == "siri"`; o do ramo Apple Pay nunca fala.
- `main()`: sem argumentos, gera a raiz (`gatilho=None`) em `SAIDA` e cada `g` em `SAIDA.parent / g / SAIDA.name`, assinando cada um como hoje. `--teste` segue igual (sem gatilho).

- [ ] **Step 4: Verificar e gerar**

Run: `python3 scripts/atalho/gerar-atalho.py --verificar` → `ok`
Run: `NEXT_PUBLIC_SUPABASE_URL=https://gexvgoknthcvdnqtdukq.supabase.co python3 scripts/atalho/gerar-atalho.py` → seis caminhos impressos.

- [ ] **Step 5: Commit**

```bash
git add scripts/atalho/gerar-atalho.py public/atalho
git commit -m "feat(atalho): uma variante assinada por gatilho, com X-Atalho-Gatilho"
```

---

### Task 2: Gatilho no token (Edge, migração, tipos)

**Files:**
- Create: `supabase/migrations/20261119120000_atalho_gatilho.sql`
- Modify: `supabase/functions/_shared/captura.ts:461-473` (`usoDoToken`)
- Modify: `supabase/functions/capture/index.ts:445-447` e o comentário do topo (linha ~13)
- Modify: `supabase/functions/_shared/captura.test.ts:768-775`
- Modify: `src/lib/supabase.ts:~150`, `src/types/database.ts:~581/592/603`, `src/components/account/aparelhos-de-captura.ts:8`

**Interfaces:**
- Produces: `usoDoToken(versao: string | null, gatilho: string | null, agora: string): { last_used_at: string; atalho_versao?: number; atalho_gatilho?: string }`; coluna `capture_tokens.atalho_gatilho text null` com check nos cinco valores; `CaptureToken.atalho_gatilho: "siri" | "acao" | "toque" | "bloqueio" | "inicio" | null`.

- [ ] **Step 1: Teste que falha**

Trocar o teste da linha 768 por:

```ts
Deno.test('usoDoToken: versão e gatilho só entram com cabeçalho válido; sem eles, as colunas ficam como estão', () => {
  const AGORA = '2026-04-10T15:00:00.000Z'
  assertEquals(usoDoToken('2', null, AGORA), { last_used_at: AGORA, atalho_versao: 2 })
  assertEquals(usoDoToken(' 99 ', null, AGORA), { last_used_at: AGORA, atalho_versao: 99 })
  for (const h of [null, '', '0', '100', '02', '2.5', 'v2', '-1']) assertEquals(usoDoToken(h, null, AGORA), { last_used_at: AGORA })
  assertEquals(usoDoToken('2', ' toque ', AGORA), { last_used_at: AGORA, atalho_versao: 2, atalho_gatilho: 'toque' })
  for (const g of ['siri', 'acao', 'toque', 'bloqueio', 'inicio'])
    assertEquals(usoDoToken(null, g, AGORA), { last_used_at: AGORA, atalho_gatilho: g })
  for (const g of [null, '', 'Siri', 'toque2', 'apple_pay']) assertEquals(usoDoToken(null, g, AGORA), { last_used_at: AGORA })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm run test:edge`
Expected: FAIL em `usoDoToken: versão e gatilho…`

- [ ] **Step 3: Implementar**

- `usoDoToken` com o segundo parâmetro; gatilho aceito após `trim()` só se estiver em `['siri','acao','toque','bloqueio','inicio']` (exportar a lista como `GATILHOS_DO_ATALHO`).
- `index.ts`: `usoDoToken(req.headers.get('x-atalho-versao'), req.headers.get('x-atalho-gatilho'), …)`; comentário do topo cita `X-Atalho-Gatilho` → `capture_tokens.atalho_gatilho`.
- Migração (comentário no estilo de `20261103160000_atalho_formulario.sql`):

```sql
alter table public.capture_tokens
    add column if not exists atalho_gatilho text
    check (atalho_gatilho in ('siri', 'acao', 'toque', 'bloqueio', 'inicio'));

grant select (atalho_gatilho) on public.capture_tokens to authenticated;
```

- `COLUNAS` ganha `atalho_gatilho`; o tipo `CaptureToken` e `database.ts` (Row `string | null`, Insert/Update opcionais) também.

- [ ] **Step 4: Rodar e ver passar**

Run: `npm run test:edge && npx tsc --noEmit`
Expected: PASS, sem erro de tipo.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20261119120000_atalho_gatilho.sql supabase/functions src/lib/supabase.ts src/types/database.ts src/components/account/aparelhos-de-captura.ts
git commit -m "feat(captura): o token guarda o gatilho do atalho (X-Atalho-Gatilho)"
```

---

### Task 3: Guia com o gatilho primeiro

**Files:**
- Create: `src/components/account/gatilhos-do-atalho.ts`
- Modify: `src/components/account/guia-do-atalho.tsx`
- Modify: `src/components/account/conta.test.ts:95-110`

**Interfaces:**
- Consumes: `CaptureToken.atalho_gatilho` (Task 2); arquivos do Task 1.
- Produces (em `gatilhos-do-atalho.ts`): `type Gatilho = "siri" | "acao" | "toque" | "bloqueio" | "inicio"`; `GATILHOS: { valor: Gatilho; rotulo: string; descricao: string }[]` com rótulos `Siri`, `Botão de Ação`, `Toque atrás`, `Tela bloqueada`, `Ícone`; `arquivoDoAtalho(g: Gatilho): string` → `` `/atalho/${g}/Lan%C3%A7ar%20gasto.shortcut` ``.

- [ ] **Step 1: Testes que falham** (em `conta.test.ts`, substituindo o "o atalho assinado é baixado daqui" e ajustando o do Safari)

```ts
it("o gatilho vem antes do código, e o arquivo baixado é o dele", () => {
    const g = semComentarios(lerFonte("src/components/account/guia-do-atalho.tsx"))
    expect(g).toMatch(/titulo: "Como você vai abrir\?"/)
    expect(g.indexOf('"Como você vai abrir?"')).toBeLessThan(g.indexOf('"Dê um nome a este iPhone"'))
    expect(g).toMatch(/<a href=\{arquivoDoAtalho\(gatilho\)\} download onClick=\{noAppDoIphone \? baixarPeloSafari : undefined\}>/)
    expect(g).toMatch(/<RadioGroup[^>]*variant="card"/)
    expect(g).not.toMatch(/<TabsList aria-label="Como abrir o atalho">/)
    expect(g).toMatch(/setGatilho\(substituir\?\.atalho_gatilho \?\? "siri"\)/)
})
it("o arquivo de cada gatilho mora na pasta dele, com o mesmo nome", () => {
    expect(arquivoDoAtalho("toque")).toBe("/atalho/toque/Lan%C3%A7ar%20gasto.shortcut")
    for (const { valor } of GATILHOS)
        expect(existsSync(`public/atalho/${valor}/Lançar gasto.shortcut`)).toBe(true)
})
it("trocar o gatilho com o código criado não cria outro código", () => {
    const g = semComentarios(lerFonte("src/components/account/guia-do-atalho.tsx"))
    expect(g).toMatch(/if \(codigo\) return irPara\(/)
})
```

O teste do Safari troca `ARQUIVO_DO_ATALHO` pelo caminho recebido: `x-safari-https://${host}${caminho}` e `window.location.assign(caminho)`.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/components/account/conta.test.ts`
Expected: FAIL nos três testes novos.

- [ ] **Step 3: Implementar**

- `PASSOS` vira sete: `Como você vai abrir?` (sem tela), `Dê um nome a este iPhone`, `Baixe o atalho`, `Abra o arquivo`, `Toque em Configurar Atalho`, `Cole o código`, `Ligue o gatilho`. Os índices fixos (`i === 1`, `i === 4`, `passo === 0`) andam um.
- Estado `gatilho: Gatilho` (substitui `como`), ao abrir `setGatilho(substituir?.atalho_gatilho ?? "siri")`.
- Passo 1: `RadioGroup variant="card"` com `GATILHOS` (rótulo + `description`). O envio do formulário no passo 1 só avança (`irPara(1)`); `criar()` passa a ser o envio do passo 2 (`passo === 1`), e com código já criado ele só avança (`if (codigo) return irPara(2)`).
- Passo 3: `href={arquivoDoAtalho(gatilho)}`; `baixarPeloSafari` vira `baixarPeloSafari(caminho: string)` e devolve o handler.
- Último passo: só o texto e a `JanelaDoAparelho` de `COMO_ABRIR` do gatilho escolhido (as chaves de `COMO_ABRIR` passam a ser `Gatilho`); sem `Tabs`. Texto da Siri: `Diga "E aí Siri, Lançar gasto". Ela pergunta e responde falando.`
- Fantasmas: os seis primeiros passos + o último em cada gatilho.
- Rodapé: no passo 1, `FormCancel` + `FormSubmit` "Próximo"; no passo 2, Voltar + `FormSubmit` "Criar código"/"Próximo".

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/components/account/conta.test.ts && npx tsc --noEmit && npm run lint && npm run ds:audit -- src/components/account/guia-do-atalho.tsx`
Expected: PASS; auditor sem violação nova.

- [ ] **Step 5: Conferir na prévia a 375px**

Abrir Configurações › Lançar pelo iPhone no dev (`dev-attach`), percorrer os sete passos com Toque atrás, voltar ao 1 depois de criar o código, trocar para Siri e confirmar o link do passo 3 (`read_page`). **Não criar código no banco de produção sem o dono pedir:** parar no passo 2.

- [ ] **Step 6: Commit**

```bash
git add src/components/account/gatilhos-do-atalho.ts src/components/account/guia-do-atalho.tsx src/components/account/conta.test.ts
git commit -m "feat(atalho): o guia escolhe o gatilho antes de baixar o arquivo dele"
```

---

### Task 4: O gatilho na lista de aparelhos

**Files:**
- Modify: `src/components/account/atalho-secao.tsx:~130`
- Modify: `src/components/account/conta.test.ts`

**Interfaces:**
- Consumes: `GATILHOS` (Task 3), `CaptureToken.atalho_gatilho` (Task 2).
- Produces: `legendaDoAparelho(t: CaptureToken, carteira: string, agora?: …): string` exportada de `atalho-secao.tsx`.

- [ ] **Step 1: Teste que falha**

```ts
it("a linha do aparelho diz o gatilho; sem ele, fica como antes", () => {
    const base = { last_used_at: null, atalho_gatilho: null } as CaptureToken
    expect(legendaDoAparelho(base, "Casa")).toBe("Casa · ainda não lançou nada")
    expect(legendaDoAparelho({ ...base, atalho_gatilho: "toque" }, "Casa")).toBe("Casa · Toque atrás · ainda não lançou nada")
})
```

- [ ] **Step 2: Rodar e ver falhar** — `npx vitest run src/components/account/conta.test.ts` → FAIL (`legendaDoAparelho` não existe).

- [ ] **Step 3: Implementar** `legendaDoAparelho` juntando `[carteira, rotulo do gatilho, uso]` com `" · "`, sem item vazio; o `<span>` da linha usa ela.

- [ ] **Step 4: Rodar e ver passar** — o mesmo comando, PASS; `npx tsc --noEmit`.

- [ ] **Step 5: Commit**

```bash
git add src/components/account/atalho-secao.tsx src/components/account/conta.test.ts
git commit -m "feat(atalho): a lista de aparelhos mostra o gatilho"
```

---

### Task 5: Jornada, Atlas e grafo

**Files:**
- Modify: `docs/JORNADAS.md` (linha da tabela "Tokens de captura" ~415, fluxograma ~336 e ~851)
- Modify: `docs/atlas/template.html`; gerado `docs/atlas/atlas-jornadas.html`

- [ ] **Step 1:** Atualizar o `JORNADAS.md`: o `GuiaDoAtalho` tem 7 passos (gatilho → nome → baixar o arquivo do gatilho → abrir → Configurar → colar → ligar o gatilho), cinco arquivos em `public/atalho/<gatilho>/`, `X-Atalho-Gatilho` → `capture_tokens.atalho_gatilho`, a linha da lista com o gatilho. Diagramas com `%%{init}%%` e sem id reservado.
- [ ] **Step 2:** Mesma explicação em `docs/atlas/template.html` (como funciona, data e contagens da capa).
- [ ] **Step 3:** `python3 docs/atlas/build.py` → gera sem erro.
- [ ] **Step 4:** Republicar `docs/atlas/atlas-jornadas.html` no URL do Atlas com a ferramenta Artifact.
- [ ] **Step 5:** `graphify update .`; `npx tsc --noEmit && npm run lint && npm run test:unit` → PASS.
- [ ] **Step 6: Commit e push**

```bash
git add docs/JORNADAS.md docs/atlas graphify-out
git commit -m "docs(jornadas): o guia do atalho escolhe o gatilho antes de baixar"
git pull --rebase --autostash origin finance-app-2.0 && git push origin finance-app-2.0
```

---

### Task 6: Produção (só com o ok do dono)

- [ ] **Step 1:** Perguntar ao dono antes de qualquer comando: aplicar `20261119120000_atalho_gatilho.sql` e publicar a Edge `capture` em produção.
- [ ] **Step 2 (a ordem é uma trava):** Com o ok, **primeiro** aplicar a migração e **conferir que a coluna `capture_tokens.atalho_gatilho` existe**; **só então** `supabase functions deploy capture --use-api` (CLI fora do sandbox, como em `supabase-cli-fora-do-sandbox`). Publicar a Edge antes faria o update inteiro de `capture_tokens` falhar e congelaria `last_used_at` e `atalho_versao`.
- Aviso: o front já chegou ao `origin/finance-app-2.0` antes da migração; até ela ser aplicada, a lista de aparelhos da prévia falha (42703, coluna inexistente).
- [ ] **Step 3:** Conferir: `curl -s -H "Authorization: Bearer x" https://gexvgoknthcvdnqtdukq.supabase.co/functions/v1/capture` → `{"error":"Token inválido.",…}`; a lista de aparelhos carrega sem 42501.
- [ ] **Step 4:** No iPhone (dono): instalar Toque atrás e Siri, lançar um gasto em cada; a lista mostra o gatilho e a Siri fala o resumo.
