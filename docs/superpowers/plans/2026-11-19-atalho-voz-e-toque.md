# Atalho voz e toque Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar as cinco variantes do atalho por dois arquivos, voz ("Lançar gasto") e toque ("Lançar gasto rápido"), com o guia escolhendo entre eles e ensinando cada lugar do toque.

**Architecture:** O gerador assina dois arquivos na raiz de `public/atalho/`; `next.config.ts` dá a cada um o nome no download; o `GuiaDoAtalho` passa a ter as opções Voz/Toque e, no último passo, abas por lugar para o toque.

**Tech Stack:** Python + `shortcuts sign`, Next.js (`next.config.ts`), React + design system, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-19-atalho-voz-e-toque-design.md`

## Global Constraints

- Branch `finance-app-2.0`; nunca `main`. Outras sessões commitam nesta pasta: stage só por caminho explícito.
- Nomes exatos: voz = `Lançar gasto.shortcut`, toque = `Lançar gasto rápido.shortcut`, ambos em `public/atalho/`.
- Voz: `X-Atalho-Gatilho: siri`, `showresult` fora do ramo Apple Pay. Toque: `X-Atalho-Gatilho: toque`, `notification`. Ramo Apple Pay sempre `notification`.
- Comparações no atalho só com `se_igual`.
- Sem migração, sem deploy de Edge, sem mexer em `src/components/ui/` nem `globals.css`.
- Mudança de jornada: `docs/JORNADAS.md`, `docs/atlas/template.html`, `python3 docs/atlas/build.py`; o Atlas é republicado pelo controlador.
- Mensagens de commit terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- Download no iPhone com o nome certo (o `Content-Disposition` antigo forçava "Lançar gasto.shortcut" em todo `/atalho/*`) — `curl -I` no Task 1.
- Aparelho antigo com `acao`/`bloqueio`/`inicio` aparece como "Toque" e "Baixar de novo" abre em Toque — teste no Task 2.
- Voltar ao passo 1 com o código criado troca o arquivo sem criar outro código — teste existente do Task 2.
- O link "baixar também o outro" passa pelo Safari no app instalado como o botão principal — teste no Task 2.

---

### Task 1: Dois arquivos e o nome no download

**Files:**
- Modify: `scripts/atalho/gerar-atalho.py`, `next.config.ts`
- Delete: `public/atalho/{siri,acao,toque,bloqueio,inicio}/`
- Regenerate: `public/atalho/Lançar gasto.shortcut`; Create: `public/atalho/Lançar gasto rápido.shortcut`

**Interfaces:**
- Produces: `MODOS = {"voz": ("siri", "Lançar gasto"), "toque": ("toque", "Lançar gasto rápido")}` (gatilho do cabeçalho, nome do arquivo); `atalho(url, modo: str | None = None, frase_de_teste=None)`; os dois arquivos acima.

- [ ] **Step 1:** Trocar o bloco de variantes do `verificar()` por: para `modo` em `MODOS`, todo `downloadurl` tem `X-Atalho-Gatilho` igual a `MODOS[modo][0]`; voz tem 3 `showresult` e nenhum `notification` depois do fim do ramo Apple Pay, e 1 `notification` antes; toque tem 0 `showresult`. Rodar `python3 scripts/atalho/gerar-atalho.py --verificar` → falha (`MODOS` não existe).
- [ ] **Step 2:** Implementar `MODOS`; `falar = modo == "voz"`; `main()` gera só `SAIDA.parent / f"{nome}.shortcut"` para cada modo (sem pastas, sem arquivo sem cabeçalho); apagar `public/atalho/<pasta>/`. `--verificar` → `ok`; gerar com `NEXT_PUBLIC_SUPABASE_URL=https://gexvgoknthcvdnqtdukq.supabase.co` (fora do sandbox se preciso).
- [ ] **Step 3:** `next.config.ts`: trocar a regra `/atalho/:arquivo*` por uma por arquivo, cada uma com `Content-Disposition: attachment; filename="<ascii>.shortcut"; filename*=UTF-8''<nome codificado>.shortcut` (`Lancar gasto` / `Lancar gasto rapido`), mantendo `Content-Type: application/octet-stream` e `nosniff`. Conferir no dev já rodando em :3000: `curl -sI "http://localhost:3000/atalho/Lan%C3%A7ar%20gasto%20r%C3%A1pido.shortcut"` mostra `filename*=UTF-8''Lan%C3%A7ar%20gasto%20r%C3%A1pido.shortcut` e o de voz o seu (reiniciar o dev não é permitido; se o dev não recarregar o config, dizer no relatório).
- [ ] **Step 4:** Commit de `scripts/atalho/gerar-atalho.py`, `next.config.ts`, `public/atalho`.

---

### Task 2: Guia com Voz e Toque, e a lista

**Files:**
- Modify: `src/components/account/gatilhos-do-atalho.ts`, `src/components/account/guia-do-atalho.tsx`, `src/components/account/atalho-secao.tsx`, `src/components/account/conta.test.ts`

**Interfaces:**
- Consumes: os dois arquivos do Task 1.
- Produces (em `gatilhos-do-atalho.ts`): `type Modo = "voz" | "toque"`; `MODOS_DO_ATALHO: { valor: Modo; rotulo: string; descricao: string; arquivo: string; nome: string }[]` com `arquivo` `/atalho/Lan%C3%A7ar%20gasto.shortcut` e `/atalho/Lan%C3%A7ar%20gasto%20r%C3%A1pido.shortcut`, `nome` "Lançar gasto" e "Lançar gasto rápido"; `modoDoGatilho(g: CaptureToken["atalho_gatilho"]): Modo` (`siri` → `voz`, resto → `toque`); `rotuloDoGatilho(g): string | null` (`siri` → "Siri", outros quatro → "Toque", nulo → null). Sai `GATILHOS` e `arquivoDoAtalho`.

- [ ] **Step 1: Testes que falham** em `conta.test.ts`:
  - `modoDoGatilho("siri") === "voz"`, `modoDoGatilho("acao") === "toque"`, `modoDoGatilho(null) === "toque"`.
  - `rotuloDoGatilho("bloqueio") === "Toque"`, `rotuloDoGatilho("siri") === "Siri"`; `legendaDoAparelho({ ...base, atalho_gatilho: "inicio" }, "Casa") === "Casa · Toque · ainda não lançou nada"`.
  - os dois `public/atalho/<nome>.shortcut` existem; nenhuma pasta `public/atalho/siri`.
  - fonte do guia: `setModo(modoDoGatilho(substituir?.atalho_gatilho ?? null))` (ou equivalente com o mesmo resultado); `<RadioGroup` com `variant="card"` e dois itens com `icon`; o último passo do toque tem `<TabsList aria-label="Onde pôr o atalho">`; há um segundo link de download para o outro modo com o mesmo `onClick` do Safari; `if \(codigo\) return irPara\(2\)` continua.
  - Rodar `npx vitest run src/components/account/conta.test.ts` → FAIL.
- [ ] **Step 2: Implementar**
  - Passo 1 "Como você vai usar?": duas opções. Voz: rótulo "Voz", descrição "Fale o gasto pela Siri", ícone `MicrophoneIcon` de `@heroicons/react/16/solid`. Toque: rótulo "Toque", descrição "Botão de Ação, toque nas costas, Tela Bloqueada ou ícone", ícone `CursorArrowRippleIcon` 16/solid.
  - Passo 3: `href` do modo; texto cita o nome ("Lançar gasto rápido").
  - Último passo, Toque: `Tabs` (padrão do DS, `floating`) com Botão de Ação, Toque atrás, Tela bloqueada, Ícone; cada aba mostra o texto de `COMO_ABRIR` com "Lançar gasto rápido" no lugar de "Lançar gasto" e a `JanelaDoAparelho` dela. Voz: texto "Diga \"E aí Siri, Lançar gasto\". Ela pergunta e responde falando." + tela da Siri. Nos dois, embaixo: `Muted` com "Quer o outro também?" e um `Button variant="link" asChild` com `<a href={outro.arquivo} download onClick={noAppDoIphone ? baixarPeloSafari : undefined}>` "Baixar {outro.nome}" e "O mesmo código serve." 
  - Fantasmas da `CaixaDoPasso`: os seis primeiros + o último em Voz e em cada aba do Toque (altura do maior).
  - `atalho-secao.tsx`: `legendaDoAparelho` usa `rotuloDoGatilho`.
  - Rodar `npx vitest run src/components/account/conta.test.ts && npx tsc --noEmit && npm run lint && npm run ds:audit -- src/components/account/guia-do-atalho.tsx` → PASS, auditor limpo; `npm run test:unit` antes do commit.
- [ ] **Step 3:** Commit dos quatro arquivos.

---

### Task 3: Jornada e grafo

**Files:** `docs/JORNADAS.md`, `docs/atlas/template.html`, `docs/atlas/atlas-jornadas.html` (gerado), `docs/captura/atalho-iphone.md`, `graphify-out`

- [ ] **Step 1:** Trocar nos três documentos as "cinco variantes por gatilho" por: dois arquivos, voz "Lançar gasto" (`siri`, resultado falado) e toque "Lançar gasto rápido" (`toque`, notificação); o passo 1 "Como você vai usar?" (Voz/Toque); o último passo com abas por lugar no toque e a Siri na voz; o link para baixar o outro (mesmo código); a lista com "Siri"/"Toque" (gatilhos antigos contam como Toque). Mermaid com `%%{init}%%`, sem id reservado.
- [ ] **Step 2:** `python3 docs/atlas/build.py` → ok; `graphify update .`.
- [ ] **Step 3:** Commit dos arquivos listados.
