# O vazio de "IAs conectadas" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O cartão vazio de "IAs conectadas" (hoje só "Nenhuma IA conectada.") vira um convite bonito, no nível do cartão "No celular": as capas das IAs ligadas ao Finance, o que se faz com elas e o botão para conectar.

**Architecture:** Um componente de tela novo, `IasVazio`, em `src/components/account/`, desenhado só com peças do design system, e um arquivo de marcas, `marcas-de-ia.tsx`, com os logos em SVG (exceção nomeada do auditor, como `credit-card-brand-logos`). O `IasSecao` desenha o `IasVazio` quando a lista vem vazia e, nesse caso, tira o "Conectar" do cabeçalho (a regra do `AtalhoSecao`: o vazio convida, o cabeçalho não repete a ação).

**Tech Stack:** Next/React (cliente), Tailwind v4 com container query, vitest (testes de fonte).

**Spec:** sem documento; o dono pediu "Melhore o Empty State, deixando bem mais bonito, como o do Baixar App, talvez colocando as logos ou capas de app das principais IAs como ChatGPT, Claude, Grok etc., mas pense em algo bonito" e pulou as perguntas. As decisões abaixo são do construtor.

## Decisões (do construtor)

- **Só as IAs que o Finance ensina a conectar.** O `ConectarIaDialog` tem instruções para Claude, ChatGPT e Claude Code. O vazio mostra as capas do **Claude** e do **ChatGPT**; Grok e Gemini ficam de fora (não há instrução nem teste com eles); o texto cobre o resto sem sigla: **"Funciona com o Claude, o ChatGPT e outras IAs."**
- **O desenho** (`@container/ias-vazio` no `Card padding="none"`):
  - **A cena**, em cima no estreito e à direita a partir de `@xl`: três capas de app em fila, todas no mesmo degrau (`size-12`, `rounded-row-lg`), com um traço tracejado entre elas: **Claude · Finance · ChatGPT**, o Finance no meio e um pouco maior (`size-14`), como quem está no centro da conexão. A capa do Finance é a `CapaDoApp` de `src/components/settings/neste-celular-grupo.tsx` (pode ganhar uma prop de tamanho, se precisar; é arquivo de tela, não de `ui/`). Duas bolhas de pergunta saem da cena, em `Card variant="muted"` pequenos ou `Badge` grandes, à escolha: **"Quanto gastei com mercado este mês?"** e **"Lance R$ 32 de almoço no Nubank"**.
  - **O texto**: título **"Pergunte à sua IA sobre o seu dinheiro"**; frase **"Conecte o Finance ao Claude ou ao ChatGPT: a IA lê seus gastos e lança o que você pedir, sempre para você conferir."** (o `registrar_lancamento` entra com `needs_review`); a linha **"Funciona com o Claude, o ChatGPT e outras IAs."** em `Muted` pequeno.
  - **O botão**: `Button variant="primary"` **"Conectar uma IA"**, que abre o `ConectarIaDialog` (o mesmo estado `conectarAberto` do `IasSecao`, por prop `onConectar`).
- **Os logos**: os desenhos oficiais do Simple Icons (CC0), baixados de `https://cdn.jsdelivr.net/npm/simple-icons@13/icons/claude.svg` e `.../openai.svg` (o caminho `d` vai para o arquivo; o arquivo não é salvo). Se um deles não existir no pacote, a capa daquela IA vira o nome em texto sobre a cor dela, e o relatório diz qual. As capas: **Claude** em `#D97757` com o logo em branco; **ChatGPT** em preto com o logo em branco. As cores são da marca e não seguem o tema (exceção nomeada no auditor, com o motivo, como a capa do Finance).
- Os logos são `aria-hidden`: quem nomeia é o texto ao lado.

## Global Constraints

- Design system do `AGENTS.md`: só peças de `@/components/ui/*`; **nada em `src/components/ui/`, `src/app/globals.css`, `src/app/designsystem/`**; tokens fora das marcas; Heroicons 16/solid se houver ícone de interface; raio pela escala (`rounded-row-lg`, `rounded-full`), nunca `rounded-[…]`.
- As cores literais e os `<svg>` desenhados moram só em `src/components/account/marcas-de-ia.tsx`, que entra em `RUNTIME_COLOR_FILES` e `DRAWN_SVG_FILES` de `.claude/skills/design-system-guard/scripts/audit.mjs`, cada um com um comentário do motivo, no estilo das entradas vizinhas.
- Não rode prettier nos arquivos de `src/components/account/`. Commit só dos arquivos da tarefa, por caminho explícito.

## Review Focus

- Com a lista vazia o cabeçalho não mostra o "Conectar"; com IAs conectadas ele volta, e o vazio não aparece.
- Carregando e erro continuam como hoje (esqueleto e "Não foi possível carregar as conexões.").
- A 343px (telefone de 375) a cena não estoura a largura do cartão e as bolhas não cobrem o texto.
- Nos dois temas a capa do Finance e a do ChatGPT (as duas pretas) não somem no fundo escuro: o anel `ring-1 ring-foreground/10` da `CapaDoApp` vale para as capas novas também.
- Nenhum texto promete IA que o diálogo não ensina a conectar (Grok, Gemini).

---

### Task 1: O vazio com as capas das IAs

**Files:**
- Create: `src/components/account/marcas-de-ia.tsx` (`LogoDoClaude`, `LogoDoChatGPT`, `CapaDaIa`)
- Create: `src/components/account/ias-vazio.tsx` (`IasVazio`)
- Modify: `src/components/account/ias-secao.tsx` (o ramo `Nenhuma IA conectada.` e o `actions` do cabeçalho)
- Modify: `src/components/settings/neste-celular-grupo.tsx` (só se a `CapaDoApp` precisar de tamanho)
- Modify: `.claude/skills/design-system-guard/scripts/audit.mjs` (as duas exceções)
- Test: `src/components/account/conta.test.ts` (um `describe` novo)

**Interfaces:**
- Produces:
  - `export function CapaDaIa({ ia }: { ia: "claude" | "chatgpt" }): JSX.Element` — a capa `size-12 rounded-row-lg` com o logo.
  - `export function IasVazio({ onConectar }: { onConectar: () => void }): JSX.Element`.
- Consumes: `CapaDoApp` (`@/components/settings/neste-celular-grupo`); `ConectarIaDialog` continua no `IasSecao`.

- [ ] **Step 1: Escrever o teste** (em `conta.test.ts`, com `lerFonte`/`semComentarios` já importados ali):

```ts
describe("IAs conectadas: o vazio", () => {
    it("o vazio convida com as capas das IAs, e o cabeçalho não repete a ação", () => {
        const v = semComentarios(lerFonte("src/components/account/ias-vazio.tsx"))
        for (const t of [
            "Pergunte à sua IA sobre o seu dinheiro",
            "Conecte o Finance ao Claude ou ao ChatGPT: a IA lê seus gastos e lança o que você pedir, sempre para você conferir.",
            "Funciona com o Claude, o ChatGPT e outras IAs.",
            "Quanto gastei com mercado este mês?",
            "Lance R$ 32 de almoço no Nubank",
            "Conectar uma IA",
        ])
            expect(v).toContain(t)
        expect(v).toMatch(/<CapaDaIa ia="claude"/)
        expect(v).toMatch(/<CapaDaIa ia="chatgpt"/)
        expect(v).toContain("<CapaDoApp")
        expect(v).not.toMatch(/Grok|Gemini|MCP/)
        const s = semComentarios(lerFonte("src/components/account/ias-secao.tsx"))
        expect(s).toContain("<IasVazio")
        expect(s).not.toContain("Nenhuma IA conectada.")
        // Sem IA, o "Conectar" do cabeçalho some: quem convida é o vazio.
        expect(s).toMatch(/actions=\{[^}]*grants\.length/)
        const a = lerFonte(".claude/skills/design-system-guard/scripts/audit.mjs")
        expect(a.match(/"marcas-de-ia"/g)).toHaveLength(2)
    })
})
```

(Se o teste do vazio de hoje em `conta.test.ts` — por volta da linha 339, `const ias = …` — assertar "Nenhuma IA conectada.", troque pela nova regra.)

- [ ] **Step 2: Rodar e ver falhar** — `npx vitest run src/components/account/conta.test.ts -t "IAs conectadas: o vazio"` → FAIL.
- [ ] **Step 3: Implementar** os dois arquivos novos, a troca no `IasSecao` (o vazio no lugar do `CardMessage`; o `actions` só com `grants.length > 0`, sem mudar carregando e erro) e as exceções do auditor, como nas Decisões. Responsivo por container query do próprio cartão.
- [ ] **Step 4: Rodar** `npx vitest run src/components/account src/components/settings && npx tsc --noEmit && npx eslint src/components/account/ias-vazio.tsx src/components/account/marcas-de-ia.tsx src/components/account/ias-secao.tsx && npm run ds:audit -- src/components/account/ias-vazio.tsx src/components/account/marcas-de-ia.tsx src/components/account/ias-secao.tsx` → passam, auditor sem achado.
- [ ] **Step 5: Commit**

```bash
git add src/components/account/marcas-de-ia.tsx src/components/account/ias-vazio.tsx src/components/account/ias-secao.tsx src/components/account/conta.test.ts .claude/skills/design-system-guard/scripts/audit.mjs
git commit -m "feat(configuracoes): o vazio de IAs conectadas com as capas do Claude e do ChatGPT"
```

(Inclua `src/components/settings/neste-celular-grupo.tsx` se a `CapaDoApp` mudou.)
