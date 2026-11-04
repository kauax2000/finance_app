# Guia do Apple Pay passo a passo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Revisão do dono (2026-11-03, durante a execução):** "Você não precisa recriar as telas, mostre só o aplicativo Atalhos no iPhone na primeira sessão e no segundo o botão de adicionar." Só os passos 1 e 2 têm imagem nova (`atalho-8-atalhos.webp`, a tela de início real com o ícone do Atalhos, alvo {18.4, 58.6}, `baixo`; `atalho-9-automacao.webp`, alvo no + {50.0, 91.5}, `baixo`); os passos 3–6 ficam só em texto; o 7 mantém `TELA_DA_NOTIFICACAO`. As telas desenhadas e o `cenas-apple-pay.py` saíram (commit seguinte ao 88dda2b7). Onde a Task 2 abaixo fala de `gatilhos`, `cartoes`, `executar` e `escolher`, vale esta revisão.

**Goal:** O guia "Lançar ao pagar" (Configurações › Lançar gastos pelo iPhone › Lançar ao pagar com Apple Pay › Configurar) passa de 3 passos sem imagem a 7 passos, um toque por passo, cada um com a tela do iPhone e o alvo pulsando onde tocar, em linguagem para quem nunca abriu o app Atalhos.

**Architecture:** Telas novas em `src/components/account/assets/` (iPhone 17 Pro prata, 720×1488, como as do guia do Atalho), geradas por um script Python novo a partir de duas capturas reais do iOS 27 e de três telas desenhadas. O `GuiaDoApplePay` troca a lista `PASSOS` por 7 passos com `Tela` (`imagem`, `ponto`, `ancora`) e reaproveita `JanelaDoAparelho`, `CaixaDoPasso`, `PecaDoPasso` e `PontosDoPasso`.

**Tech Stack:** Python 3 + Pillow + psd-tools (venv no scratchpad), Next 16 / React 19, vitest por leitura de fonte.

**Spec:** pedido do dono em 2026-11-03: "melhorar a sessão que mostra como configurar o lançamento com o Apple Pay, colocando imagens, deixando mais claro, explicando aonde clicar no telefone, tá tudo muito confuso… imagina quem não tem [entendimento de tecnologia]". Escolha dele: **telas desenhadas** (o simulador do iOS 27 não tem o gatilho Transação).

## Global Constraints

- O caminho no iPhone (iOS 17 ou mais), um toque por passo:
  1. Abra o app **Atalhos** e toque em **Automação**. — tela: captura real `1-biblioteca.png`, alvo na linha "Automação".
  2. Toque no **+**, embaixo. — captura real `2-automacao.png`, alvo no "+".
  3. Role a lista e toque em **Transação** (o ícone da Carteira). — desenhada `gatilhos`, alvo na linha "Transação".
  4. Em **Cartão**, toque em **Escolher** e marque os cartões que você usa para pagar com o iPhone. — desenhada `transacao`, alvo em "Escolher".
  5. Marque **Executar Imediatamente** e toque em **Seguinte**, no canto de cima. — a mesma `transacao`, alvo em "Executar Imediatamente".
  6. Em **Meus Atalhos**, toque em **Lançar gasto**. Pronto: a automação está criada. — desenhada `escolher`, alvo no cartão "Lançar gasto".
  7. Pague com o iPhone e o gasto aparece: **Gasto lançado: R$ 42,90**. — `TELA_DA_NOTIFICACAO` (já existe), sem alvo.
- Cada texto tem no máximo duas frases curtas, o nome do botão em `<strong>` igual ao que está escrito na tela, e nenhuma palavra técnica ("gatilho", "token", "automação pessoal" não aparecem; "automação" só no passo 6).
- Telas desenhadas: modo escuro do iOS 27 copiando as medidas das capturas reais (fundo preto, cartões `#1C1C1E` com raio ~60px, linhas de ~156px, texto SF de ~51px, título grande em negrito de ~118px, barra de status "09:41" recortada da captura real), 1320×2868 cruas, sem logo da Apple. "Lançar gasto" (sem número) é o nome do atalho.
  - `gatilhos`: título grande "Nova Automação", campo "Buscar", um cartão com linhas de ícone colorido + rótulo: Hora do Dia, Alarme, Sono, Chegar, Sair, E-mail, Mensagem, **Transação** (ícone da Carteira), NFC, App.
  - `transacao`: "Cancelar" à esquerda e "Seguinte" à direita no topo; título "Transação"; cartão "Quando eu tocar em" com Cartão · Escolher, Categoria · Qualquer Categoria, Comerciante · Qualquer Comerciante; cartão com "Executar Após Confirmação" e "Executar Imediatamente" (este com ✓) e o interruptor "Notificar ao Executar".
  - `escolher`: voltar "‹" no topo; título "Transação"; linha "Nova Automação em Branco"; seção "Meus Atalhos" com o cartão vermelho em degradê "Lançar gasto" (varinha mágica, como na captura de Todos os Atalhos) e um segundo cartão neutro.
- Cada alvo (`ponto`, em % da imagem emoldurada) cai na parte visível da janela: `ancora: "topo"` mostra os 58% de cima, `"baixo"` os 58% de baixo.
- Assets: `atalho-8-biblioteca.webp`, `atalho-9-automacao.webp`, `atalho-10-gatilhos.webp`, `atalho-11-transacao.webp`, `atalho-12-escolher.webp`, todos 720×1488 como os existentes, pelo `scripts/atalho/moldura.py`.
- Design system: só `ui/` e tokens; nada novo em `src/components/ui/`, `globals.css` ou `src/app/designsystem/`. Nenhum `<button>` cru.
- O banco de desenvolvimento é o de produção: nenhum agente abre o app logado nem chama o Supabase.
- `docs/design/mockups/` é fora do git e não se redistribui: só as telas emolduradas entram no repositório.
- Commits só com os arquivos da tarefa. `docs/JORNADAS.md`, `docs/atlas/*` ficam sem commit.

## Review Focus

1. **Alvo fora da janela**: um `ponto` na parte cortada some. Teste: para cada passo, `ancora === "topo"` ⇒ `ponto.y <= 58`, `"baixo"` ⇒ `ponto.y >= 42`.
2. **Abrir de novo volta ao passo 1** (o reset em `open` continua).
3. **Texto técnico**: nenhum passo contém "gatilho", "token" ou "Entrada do atalho".
4. **Movimento reduzido**: a troca de passo não anima (o `entrar={!reduzido && mudou}` continua).
5. **Imagem pesada**: cada webp novo tem menos de 80 KB.

---

### Task 1: As telas do caminho no iPhone

**Files:**
- Create: `scripts/atalho/cenas-apple-pay.py`
- Create: `src/components/account/assets/atalho-8-biblioteca.webp` … `atalho-12-escolher.webp`

**Interfaces:**
- Produces: os cinco webp acima e, no relatório, o `ponto` (x, y em % da imagem emoldurada, uma casa decimal) e a `ancora` de cada um dos passos 1–6.

- [ ] **Step 1:** Monte um venv no scratchpad com `Pillow` e `psd-tools`. Do PSD `docs/design/mockups/Freebie iPhone 17 - 6 Mockups Scenes - PSD & FIG/Adobe Photoshop (PSD)/iPhone 17 Pro/01 - iPhone 17 Pro - Front.psd`, extraia `mask-screen.png` (camada `MASK SCREEN`, com alfa) e `island.png` (camada `DYNAMIC ISLAND`) para uma pasta do scratchpad. A base do aparelho é `src/components/settings/assets/iphone-17-pro-prata.webp`. Confira que o `moldura.py` reproduz um asset existente: rode-o com `scripts/atalho` sobre uma captura qualquer e compare tamanho (720×1488) com `atalho-5-siri.webp`.
- [ ] **Step 2:** Escreva `scripts/atalho/cenas-apple-pay.py <biblioteca.png> <saida-dir>`: desenha `gatilhos.png`, `transacao.png` e `escolher.png` (1320×2868) como nas Global Constraints, recortando a barra de status da captura real. Use `FONTE = "/System/Library/Fonts/SFNS.ttf"` e a função `fonte()` do `cenas.py` (copie; não importe). Docstring no topo no estilo do `cenas.py`.
- [ ] **Step 3:** Emoldure as cinco telas com `moldura.py` (as duas capturas reais estão em `/private/tmp/claude-501/-Users-kaualeandro-Desktop-Finance-App-finance-app-dev/99747a81-ad45-4463-b77c-e5f7eaaa719a/scratchpad/pay/1-biblioteca.png` e `2-automacao.png`) para os nomes dos assets.
- [ ] **Step 4:** Olhe cada webp (Read da imagem) e confira: texto legível, nada da Apple, "Lançar gasto" sem número, a altura e o raio das linhas iguais aos da captura real. Calcule o `ponto` de cada passo no centro do alvo e escolha a `ancora` que o mostra.
- [ ] **Step 5:** Cada webp < 80 KB (`ls -la`). Commit `feat(conta): as telas do caminho do Apple Pay no iPhone` com o script e os cinco webp.

### Task 2: O guia em 7 passos

**Files:**
- Modify: `src/components/account/passo-a-passo.tsx` (imports e as constantes `Tela` novas)
- Modify: `src/components/account/guia-do-apple-pay.tsx`
- Test: `src/components/account/conta.test.ts` (novo `describe("Guia do Apple Pay")`)

**Interfaces:**
- Consumes: os webp e os `ponto`/`ancora` da Task 1 (vêm no despacho).
- Produces: `export const TELAS_DO_APPLE_PAY: { biblioteca: Tela; automacao: Tela; gatilhos: Tela; cartoes: Tela; executar: Tela; escolher: Tela }` em `passo-a-passo.tsx` (`cartoes` e `executar` usam a mesma imagem, com alvos diferentes).

- [ ] **Step 1: Testes** (leitura de fonte e import):
  - `guia-do-apple-pay.tsx` tem 7 entradas em `PASSOS` (conte `titulo:`), os títulos na ordem "Abra a Automação", "Toque no +", "Escolha Transação", "Escolha os cartões", "Marque Executar Imediatamente", "Toque em Lançar gasto", "Pague com o iPhone";
  - os textos contêm `<strong>Atalhos</strong>`, `<strong>Automação</strong>`, `<strong>Transação</strong>`, `<strong>Escolher</strong>`, `<strong>Executar Imediatamente</strong>`, `<strong>Seguinte</strong>`, `<strong>Lançar gasto</strong>`; não contêm "gatilho", "token" nem "Entrada do atalho"; nenhum `// shortcut:` sobra;
  - importando `TELAS_DO_APPLE_PAY`: cada tela tem `ponto`; `ancora === "topo"` ⇒ `ponto.y <= 58`, `"baixo"` ⇒ `ponto.y >= 42`;
  - o reset em `open` e `entrar={!reduzido && mudou}` continuam.
- [ ] **Step 2:** `npx vitest run src/components/account` — falha.
- [ ] **Step 3:** Implemente. Todo passo tem `tela` (o 7º é `TELA_DA_NOTIFICACAO`). `DialogDescription`: "Siga os passos no iPhone. Leva uns dois minutos." Mantenha o resto do componente.
- [ ] **Step 4:** `npx tsc --noEmit && npx vitest run src/components/account && npx eslint src/components/account && node .claude/skills/design-system-guard/scripts/audit.mjs src/components/account` — verde, sem achado novo.
- [ ] **Step 5:** Commit `feat(conta): o guia do Apple Pay em sete toques, com a tela do iPhone em cada um`.

### Task 3: Documentos (sessão principal)

- [ ] `docs/captura/atalho-iphone.md` §4: "guia de 3 passos" → 7, e os passos de referência com os nomes da tela; commit junto da Task 2 (fora de `docs/JORNADAS.md`/atlas).
- [ ] `docs/JORNADAS.md` e `docs/atlas/template.html` (Lançar ao pagar), `python3 docs/atlas/build.py`, republicar o Atlas. Sem commit.
