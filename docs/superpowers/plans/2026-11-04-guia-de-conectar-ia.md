# O guia de conectar a IA — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O `ConectarIaDialog` (hoje: um título, a URL com copiar e três parágrafos) vira um guia de passos no estilo do `GuiaDoApplePay` e do `GuiaDoAtalho`: a pessoa escolhe a IA, copia o endereço, segue o caminho daquela IA, autoriza no Finance e testa.

**Architecture:** O diálogo reaproveita as peças de `src/components/account/passo-a-passo.tsx` (`CaixaDoPasso`, `PecaDoPasso`, `PontosDoPasso`, a variante `PECA`) e o rodapé Voltar / Próximo do `guia-do-apple-pay.tsx` (leia-o: é o modelo). O visual de cada passo é a capa da IA escolhida (`Capa` de `marcas-de-ia.tsx`), e não uma tela inventada: telas desenhadas do iPhone já foram recusadas pelo dono, e as do Claude e do ChatGPT não temos capturadas.

**Tech Stack:** Next/React (cliente), vitest (testes de fonte).

**Spec:** sem documento; o dono pediu "melhore a forma de conectar as IAs deixando mais instrutivo para o usuário no estilo de instalação da feature de automação de instalação pela Siri ou de instalação da parte de automação pelo Apple Pay etc. Tá muito cru." e pulou as perguntas. As decisões abaixo são do construtor.

## Decisões (do construtor)

- **Título do diálogo:** "Conectar minha IA" (o botão do vazio já diz isso); descrição: "Leva uns 2 minutos. No fim, ela já responde sobre o seu dinheiro."
- **Os passos** (5, com `PontosDoPasso`):
  1. **"Escolha sua IA"** — três cartões de escolha (`RadioGroup` com `variant="card"` do design system, ou o `ToggleGroup` se ler melhor), cada um com a `Capa` (`tamanho="media"`) e uma linha:
     - **Claude** — "Funciona em todos os planos. No gratuito, cabe um conector."
     - **ChatGPT** — "Precisa de um plano pago e do Modo desenvolvedor."
     - **Claude Code** — "No terminal, para quem programa." (capa do Claude)
  2. **"Copie o endereço do Finance"** — o `CampoDeCopiar` com a URL do MCP (`urlDoMcp` de `ias-secao.tsx`, como hoje). Para o Claude Code este passo é **"Copie o comando"**, com o comando `claude mcp add --transport http finance <url>` (como hoje).
  3. **"Cole no Claude" / "Cole no ChatGPT" / "Rode no terminal"**, o caminho da IA escolhida, numa lista numerada curta:
     - Claude: "Abra Configurações › Conectores." · "Toque em Adicionar conector personalizado." · "Dê o nome Finance e cole o endereço."
     - ChatGPT: "Abra Configurações › Conectores › Avançado e ligue o Modo desenvolvedor." · "Toque em Criar, dê o nome Finance e cole o endereço." · "Em Autenticação, escolha OAuth."
     - Claude Code: "Cole o comando no terminal e aperte Enter." · "Depois, digite /mcp e entre com a sua conta do Finance."
     Abaixo, em `Muted` pequeno: "Os nomes dos menus podem mudar um pouco conforme a versão do app."
  4. **"Autorize no Finance"** — a capa do Finance ao lado da capa da IA. Texto: "A IA abre uma página do Finance pedindo acesso. Confira o nome dela e toque em Permitir." E as três garantias do vazio, numa lista com o `ShieldCheckIcon` (as mesmas de `ias-vazio.tsx`: extraia a constante `GARANTIAS` para `marcas-de-ia.tsx` ou um arquivo pequeno e importe nos dois, sem duplicar).
  5. **"Faça a primeira pergunta"** — "Abra uma conversa nova e pergunte:" e um `CampoDeCopiar` com **"Quanto gastei este mês por categoria?"**; depois "Pronto: ela aparece aqui em IAs conectadas, e você desconecta quando quiser." O botão do último passo é **"Concluir"** (fecha o diálogo).
- **Navegação:** Voltar / Próximo como no `GuiaDoApplePay`; o Próximo do passo 1 só habilita com uma IA escolhida (comece sem escolha). Fechar descarta o progresso; ao abrir de novo, volta ao passo 1.
- **O visual de cada passo** fica no topo, centrado: no 1, as três capas lado a lado; do 2 ao 5, a capa da IA escolhida (no 4, Finance + IA com um ícone de link entre elas, `LinkIcon` 20/solid em `text-muted-foreground`).
- **Telefone:** o diálogo vira gaveta como os outros guias (`surface="auto"` ou o que o `GuiaDoApplePay` usa).

## Global Constraints

- Design system do `AGENTS.md`: só peças de `@/components/ui/*`; nada em `src/components/ui/`, `src/app/globals.css`, `src/app/designsystem/`; tokens; Heroicons pela régua do tamanho; nenhum texto "MCP", "PWA" ou "OAuth" exceto o "OAuth" que o próprio ChatGPT mostra no passo 3 do ChatGPT.
- Cores de marca só em `src/components/account/marcas-de-ia.tsx` (exceção nomeada no auditor).
- Rodapé de diálogo pela tabela do `AGENTS.md` (Voltar `tertiary`, Próximo/Concluir `primary`).
- Não rode prettier nos arquivos de `src/components/account/`. Commit só dos arquivos da tarefa, por caminho explícito.
- A jornada muda (o diálogo ganha passos): atualize a seção 19 de `docs/JORNADAS.md` e a mesma jornada em `docs/atlas/template.html`, e rode `python3 docs/atlas/build.py`; a republicação é do controlador.

## Review Focus

- O Próximo do passo 1 não avança sem escolha; trocar a IA no passo 1 depois de voltar muda os passos 2 e 3.
- Claude Code mostra o comando no passo 2 (não a URL) e não fala de "Configurações › Conectores".
- Fechar e abrir de novo volta ao passo 1 sem IA escolhida.
- A 343px (gaveta do telefone) nada estoura: o `CampoDeCopiar` corta com reticências como hoje.
- As garantias do passo 4 são as mesmas do vazio (uma constante só).

---

### Task 1: O guia de conectar a IA

**Files:**
- Modify: `src/components/account/conectar-ia-dialog.tsx` (reescrita)
- Modify: `src/components/account/ias-vazio.tsx` (importar `GARANTIAS` de onde ela passar a morar)
- Modify: `src/components/account/marcas-de-ia.tsx` (se `GARANTIAS` for para lá)
- Modify: `docs/JORNADAS.md`, `docs/atlas/template.html`; gerar `docs/atlas/atlas-jornadas.html`
- Test: `src/components/account/conta.test.ts` (um `describe` novo)

**Interfaces:**
- Consumes: `Capa`, `Marca` de `marcas-de-ia.tsx`; `CampoDeCopiar` (`rotulo`, `valor`); `urlDoMcp` de `ias-secao.tsx`; `CaixaDoPasso`, `PecaDoPasso`, `PontosDoPasso`, `PECA` de `passo-a-passo.tsx`.
- Produces: `ConectarIaDialog({ open, onOpenChange })` — mesma assinatura de hoje, para o `IasSecao` não mudar.

- [ ] **Step 1: Escrever o teste** (em `conta.test.ts`):

```ts
describe("Conectar minha IA: o guia", () => {
    it("o guia tem os cinco passos e o caminho de cada IA", () => {
        const g = semComentarios(lerFonte("src/components/account/conectar-ia-dialog.tsx")).replace(/\s+/g, " ")
        for (const t of [
            "Conectar minha IA",
            "Escolha sua IA",
            "Copie o endereço do Finance",
            "Copie o comando",
            "Autorize no Finance",
            "Faça a primeira pergunta",
            "Funciona em todos os planos. No gratuito, cabe um conector.",
            "Precisa de um plano pago e do Modo desenvolvedor.",
            "Toque em Adicionar conector personalizado.",
            "Abra Configurações › Conectores › Avançado e ligue o Modo desenvolvedor.",
            "Depois, digite /mcp e entre com a sua conta do Finance.",
            "Quanto gastei este mês por categoria?",
            "Concluir",
        ])
            expect(g).toContain(t)
        expect(g).toContain("PontosDoPasso")
        expect(g).toMatch(/<Capa marca=/)
        expect(g).toContain("GARANTIAS")
        expect(semComentarios(lerFonte("src/components/account/ias-vazio.tsx"))).not.toMatch(/const GARANTIAS = \[/)
    })
})
```

- [ ] **Step 2: Rodar e ver falhar** — `npx vitest run src/components/account/conta.test.ts -t "Conectar minha IA"` → FAIL.
- [ ] **Step 3: Implementar** o guia como nas Decisões, a partir do `guia-do-apple-pay.tsx`; mover `GARANTIAS`; atualizar a jornada 19 nos dois documentos e rodar o `build.py`.
- [ ] **Step 4: Rodar** `npx vitest run src/components/account src/components/settings && npx tsc --noEmit && npx eslint src/components/account/conectar-ia-dialog.tsx src/components/account/ias-vazio.tsx src/components/account/marcas-de-ia.tsx && npm run ds:audit -- src/components/account/conectar-ia-dialog.tsx src/components/account/ias-vazio.tsx src/components/account/marcas-de-ia.tsx` → passam, auditor sem achado.
- [ ] **Step 5: Commit**

```bash
git add src/components/account/conectar-ia-dialog.tsx src/components/account/ias-vazio.tsx src/components/account/marcas-de-ia.tsx src/components/account/conta.test.ts docs/JORNADAS.md docs/atlas/template.html docs/atlas/atlas-jornadas.html
git commit -m "feat(configuracoes): conectar a IA vira um guia de cinco passos"
```
