# Guia "Lançar sem abrir o app" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar "Novo aparelho" e "Como configurar" de Minha conta por um guia passo a passo, no estilo da folha de instalação, que uma pessoa comum termina sozinha, e dar à seção um vazio que convida.

**Architecture:** Um componente só, `GuiaDoAtalho`, numa `Sheet` de baixo no telefone e num `Dialog` no desktop (`Dialog surface="auto"`), com os passos num array e a mesma mecânica do `InstallPwaSheet` (pontos, Voltar/Próximo, troca de texto na `MOLA`, aparelho desenhado que anda). O passo 1 cria o token (a RPC de hoje); o passo 2 abre o atalho pronto por um link do iCloud e a pessoa só cola o código. Os dois diálogos antigos saem. O vazio da seção vira um `EmptyState`.

**Tech Stack:** Next 16, React 19, `motion/react`, componentes de `src/components/ui/` (`Dialog`, `DeviceFrame`, `EmptyState`, `Form*`, `Button`, `Alert`, `Collapsible`), Supabase RPC `create_capture_token`, vitest por leitura de fonte (`src/test/fonte.ts`).

**Spec:** a conversa de 2026-11-03 (o dono pulou as perguntas). As decisões dele: "como configurar" no estilo do onboarding de instalação, para a pessoa entender exatamente o que fazer; nada de mandar ao guia do GitHub; melhorar o vazio da seção. As do Claude, ditas ao dono: um guia só no lugar dos dois diálogos, e o atalho pronto por link, sem montar à mão.

## Global Constraints

- Texto em português, sem jargão: nada de "token", "endpoint", "Bearer", "header" na tela. O token se chama **"código do aparelho"**.
- Nenhum link para `github.com`; `GUIA` e o texto `docs/captura/atalho-iphone.md` saem do app.
- O código do aparelho vive só no estado do guia: sem `localStorage`, `sessionStorage`, `setQueryData(["capture_tokens"…])` nem `console.`; fechar por qualquer caminho o descarta.
- A lista lê só `COLUNAS` (sem `select('*')`: dá 42501).
- O link do atalho pronto vem de `process.env.NEXT_PUBLIC_CAPTURE_SHORTCUT_URL`; sem ele, o passo 2 mostra o `Alert tone="warning"` "O atalho pronto ainda não está disponível." e o caminho à mão (endereço + código) aberto.
- Design system: só componentes de `ui/` e tokens; ícones Heroicons pela régua do tamanho; `Button` nasce `type="button"`; o formulário do passo 1 é `CustomForm` com `FormSubmit` (Enter cria). Nenhum arquivo novo em `ui/`.
- O banco de desenvolvimento é o de produção: **nenhum agente cria token de verdade** para testar; a verificação no navegador para antes de "Criar código".
- Mudança de jornada: `docs/JORNADAS.md`, `docs/atlas/template.html`, `python3 docs/atlas/build.py` e a republicação do Atlas (feita pela sessão principal, que tem a ferramenta).
- Commits só com os arquivos de cada tarefa (`git add <arquivos>`): a árvore tem trabalho de outra mudança sem commit (o `Seal`, o `Avatar`, `globals.css`, `page-client.tsx`).

## Review Focus

1. **Fechar no meio do passo 2** (o código já criado, a pessoa ainda não colou): o código some, e a linha nova da lista diz "nunca usado"; reabrir o guia começa do passo 1, sem reaproveitar código. Teste: `setCodigo(null)` no fechar e `passo` volta a 0 ao abrir.
2. **Sem o link do atalho configurado** (o caso de hoje): o passo 2 não pode ter botão morto. Teste: o `Alert` e o caminho à mão quando `NEXT_PUBLIC_CAPTURE_SHORTCUT_URL` está vazio.
3. **A cópia automática falha** (Safari sem permissão de área de transferência): o código continua à vista no `CampoDeCopiar`, com o botão Copiar. Teste: a chamada a `navigator.clipboard.writeText` está num `try`/`.catch` e o campo é renderizado sempre que há código.
4. **Limite de 10 ou não membro**: o erro da RPC aparece no passo 1 em português e o guia não avança. Teste: `mensagemDoErroDeToken` continua chamado no erro, e `setPasso` só depois do sucesso.
5. **Pular passos para frente** antes de criar o código: "Próximo" do passo 1 é o próprio `FormSubmit` "Criar código"; não há como chegar ao passo 2 sem código. Teste: o botão do passo 1 é `FormSubmit`, e os pontos não são clicáveis.

---

### Task 1: O guia em passos

**Files:**
- Create: `src/components/account/guia-do-atalho.tsx`
- Modify: `src/components/account/atalho-secao.tsx` (abre o guia; tira os dois diálogos)
- Delete: `src/components/account/novo-aparelho-dialog.tsx`, `src/components/account/como-configurar-dialog.tsx`
- Test: `src/components/account/conta.test.ts` (o bloco `describe("tokens de captura")`)

**Interfaces:**
- Consumes: `mensagemDoErroDeToken`, `NOME_INVALIDO` de `atalho-secao.tsx`; `CampoDeCopiar` de `campo-de-copiar.tsx`; `useWorkspace()`; `useAuth()` para o nome padrão.
- Produces: `export function GuiaDoAtalho(props: { open: boolean; onOpenChange: (open: boolean) => void; aoCriar: () => void })`, `export function enderecoDeCaptura(): string` (movida para cá, mesmo corpo), `export const ATALHO_PRONTO: string | undefined` (= `process.env.NEXT_PUBLIC_CAPTURE_SHORTCUT_URL || undefined`).

Os quatro passos (título · texto · ilustração no `DeviceFrame form="phone"` recortado numa janela `h-72 w-60` com a máscara do `InstallPwaSheet`; o ponto pulsante sobre o que tocar):

| # | Título | O que a pessoa faz | Ação do passo |
|---|---|---|---|
| 1 | "Dê um nome a este iPhone" | nome (padrão `iPhone de <primeiro nome>`) e "Os gastos caem em" (a carteira, `Select`; some com uma carteira só) | `FormSubmit` "Criar código" → `create_capture_token`; no sucesso copia o código (`navigator.clipboard.writeText`, falha calada) e vai ao 2 |
| 2 | "Adicione o atalho" | "Toque no botão, depois em **Adicionar atalho**. Quando ele pedir o código, cole: já está copiado." `CampoDeCopiar rotulo="Código do aparelho"` abaixo | `Button primary` "Abrir o atalho" (`<a href={ATALHO_PRONTO} target="_blank" rel="noreferrer">` por `asChild`); um `Collapsible` "Montar à mão" com o endereço (`CampoDeCopiar rotulo="Endereço"`) |
| 3 | "Fale com a Siri" | "Diga **E aí Siri, lançar gasto** e depois o gasto: **42 mercado nubank**. Ele cai em <carteira>; o que ficar em dúvida vai para A conferir." Ilustração: `notification` do `DeviceFrame` com "Gasto lançado · R$ 42,00 · Mercado" | Próximo |
| 4 | "Lance ao pagar (opcional)" | "No app Atalhos: **Automação › + › Carteira**, escolha seus cartões, marque **Executar imediatamente** e escolha **Lançar gasto**. Cada compra com o iPhone entra sozinha." | `primary` "Pronto" fecha |

Wireframe indicativo (fora do DS de propósito, só para a forma):

```
┌───────────────────────────────┐
│ Conectar o iPhone           × │
│ Lance gastos falando com a    │
│ Siri, sem abrir o app.        │
│      ┌───────────┐            │
│      │ ▒▒ phone ▒│  ◉ toque   │
│      └───────────┘            │
│          ● ━━ ● ●             │
│ 2 · Adicione o atalho         │
│ Toque no botão, depois em …   │
│ [ Código do aparelho  ⧉ ]     │
│ ▸ Montar à mão                │
│ [Voltar]   [ Abrir o atalho ] │
│            [ Próximo ]        │
└───────────────────────────────┘
```

No passo 2 o rodapé tem Voltar (`tertiary`), "Abrir o atalho" no corpo e "Próximo" (`primary`) — um `primary` só por vez: com o link, "Abrir o atalho" é `primary` e "Próximo" é `secondary`; sem o link, "Próximo" é o `primary`.

- [ ] **Step 1: Reescrever os testes do bloco "tokens de captura"** em `conta.test.ts`, trocando as leituras de `novo-aparelho-dialog.tsx`/`como-configurar-dialog.tsx` por `guia-do-atalho.tsx`:

```ts
it("cria, revoga e mostra o código uma vez só", () => {
    const f = fonteTudo("atalho-secao.tsx", "guia-do-atalho.tsx")
    expect(f).toContain('rpc("create_capture_token"')
    expect(f).toContain('rpc("revoke_capture_token"')
    expect(f).toContain("/functions/v1/capture")
    expect(f).not.toMatch(/select\(\s*["']\*["']\s*\)/)
    expect(f).not.toMatch(/github\.com|docs\/captura/)
    // Nenhum "token" em texto de tela (entre > e <).
    expect(lerFonte("src/components/account/guia-do-atalho.tsx")).not.toMatch(/>[^<{]*\btoken\b[^<]*</i)
})
it("o código vive só no estado do guia, e fechar o descarta", () => {
    const g = lerFonte("src/components/account/guia-do-atalho.tsx")
    expect(g).toMatch(/setCodigo\(null\)/)
    expect(g).toMatch(/setPasso\(0\)/)
    expect(g).not.toMatch(/localStorage|sessionStorage|console\./)
})
it("o passo 1 cria pelo formulário, e só o sucesso avança", () => {
    const g = semComentarios(lerFonte("src/components/account/guia-do-atalho.tsx"))
    expect(g).toContain("Criar código")
    expect(g).toMatch(/<FormSubmit/)
    expect(g).toMatch(/if \(error\) return setErro\(mensagemDoErroDeToken\(error\)\)/)
})
it("sem o link do atalho, o passo 2 avisa e abre o caminho à mão", () => {
    const g = lerFonte("src/components/account/guia-do-atalho.tsx")
    expect(g).toContain("NEXT_PUBLIC_CAPTURE_SHORTCUT_URL")
    expect(g).toContain("O atalho pronto ainda não está disponível.")
    expect(g).toContain("Montar à mão")
})
it("a cópia automática não quebra sem permissão", () => {
    expect(lerFonte("src/components/account/guia-do-atalho.tsx")).toMatch(/clipboard\.writeText\([^)]*\)\.catch\(/)
})
```

Mantenha o teste `"o endereço da captura não duplica a barra do fim"`, importando de `"./guia-do-atalho"`.

- [ ] **Step 2: Rodar e ver falhar** — `npx vitest run src/components/account/conta.test.ts` → FAIL (arquivo não existe).
- [ ] **Step 3: Escrever `GuiaDoAtalho`** com a tabela acima, a mecânica do `InstallPwaSheet` (estado `passo`, reinício ao abrir pelo padrão `abertoAntes`, pontos `aria-hidden`, `aria-live="polite"` no texto, `MOLA`/`SAIDA`, movimento reduzido sem deslocamento) e `Dialog surface="auto" pending={criando}`. As ilustrações: uma mini tela por passo dentro do `DeviceFrame form="phone"` (o app Atalhos com o cartão "Lançar gasto" e "Adicionar atalho"; a Siri com a frase; a automação com "Carteira"), em tokens e peças do DS, sem `<img>`.
- [ ] **Step 4: Trocar em `atalho-secao.tsx`** os dois diálogos por `<GuiaDoAtalho open={guiaAberto} onOpenChange={setGuiaAberto} aoCriar={() => void lista.refetch()} />`; o botão do cabeçalho vira "Conectar aparelho"; a linha "Como configurar" sai. Apagar os dois arquivos antigos.
- [ ] **Step 5: Rodar** `npx tsc --noEmit && npx vitest run src/components/account && node .claude/skills/design-system-guard/scripts/audit.mjs src/components/account/guia-do-atalho.tsx src/components/account/atalho-secao.tsx` → tudo verde, "Nenhum achado".
- [ ] **Step 6: Commit** só destes arquivos: `feat(conta): guia passo a passo para conectar o iPhone`.

### Task 2: O vazio da seção

**Files:**
- Modify: `src/components/account/atalho-secao.tsx` (o ramo `tokens.length === 0`)
- Test: `src/components/account/conta.test.ts`

**Interfaces:**
- Consumes: `GuiaDoAtalho` da Task 1 (o mesmo `setGuiaAberto`).

O `CardMessage` "Nenhum aparelho conectado." vira, dentro do `Card padding="none"`:

```
EmptyState variant="plain" size="sm"
  EmptyStateIcon  → MicrophoneIcon (24/outline)
  EmptyStateTitle → "Lance gastos falando com a Siri"
  EmptyStateDescription → "Conecte o iPhone uma vez. Depois é só dizer “42 mercado” e o gasto entra sozinho."
  EmptyStateActions → Button primary "Conectar o iPhone" (abre o guia)
```

Com o vazio à vista, o botão do cabeçalho some (um `primary` por tela e sem a mesma ação duas vezes); com aparelhos, ele volta como "Conectar aparelho" `secondary`. Confira `variant`/`size` no `ds:catalog` antes: se `plain` não existir no `EmptyState`, use o que o catálogo oferecer para vazio dentro de cartão e diga qual.

- [ ] **Step 1: Teste** em `conta.test.ts`:

```ts
it("o vazio convida a conectar, e o cabeçalho não repete a ação", () => {
    const s = semComentarios(lerFonte("src/components/account/atalho-secao.tsx"))
    expect(s).toContain("Lance gastos falando com a Siri")
    expect(s).toContain("Conectar o iPhone")
    expect(s).toMatch(/<EmptyState/)
    expect(s).not.toContain("Nenhum aparelho conectado.")
    expect(s).toMatch(/tokens\.length > 0 \?[\s\S]*Conectar aparelho/)
})
```

- [ ] **Step 2: Rodar e ver falhar.**
- [ ] **Step 3: Implementar** o ramo vazio e o cabeçalho condicional (o esqueleto e o erro ficam como estão).
- [ ] **Step 4: Rodar** `npx tsc --noEmit && npx vitest run src/components/account` e o auditor no arquivo → verde.
- [ ] **Step 5: Commit** `feat(conta): o vazio de Lançar sem abrir o app convida a conectar`.

### Task 3: O atalho pronto e as jornadas

**Files:**
- Modify: `docs/captura/atalho-iphone.md` (seção nova no topo: "Para o dono: publicar o atalho pronto")
- Modify: `.env.example` (`# NEXT_PUBLIC_CAPTURE_SHORTCUT_URL=https://www.icloud.com/shortcuts/…`)
- Modify: `docs/JORNADAS.md` (linhas 771–775, 1216–1220, 1249), `docs/atlas/template.html` (linhas 822 e 1506)

**Interfaces:** nenhuma de código.

A seção do dono, em passos: montar no app Atalhos um atalho "Lançar gasto" que (1) usa a entrada do atalho se houver (a transação da Carteira: valor, comerciante, cartão) e senão pede o texto por ditado; (2) faz `Obter conteúdo de URL` em `POST <URL>` com `Authorization: Bearer` + o código e o JSON da seção 2; (3) mostra a resposta como notificação. O código entra como **Pergunta de importação** ("Cole o código do aparelho"), para cada pessoa colar o seu ao adicionar. Compartilhar › Copiar link do iCloud, e pôr o link em `NEXT_PUBLIC_CAPTURE_SHORTCUT_URL` (Vercel e `.env.local`). O resto do guia continua como referência de quem monta à mão.

Nas jornadas: "Novo aparelho" e "Como configurar" viram "Conectar aparelho / Conectar o iPhone → GuiaDoAtalho (4 passos: nome e carteira → create_capture_token; abrir o atalho pronto; a Siri; a automação do Apple Pay)"; o nó do GitHub sai; o vazio é o `EmptyState` com "Conectar o iPhone". Na tabela de regras (linha 1249), os arquivos passam a `atalho-secao.tsx` e `guia-do-atalho.tsx`.

- [ ] **Step 1: Escrever** a seção do dono e a linha do `.env.example`.
- [ ] **Step 2: Atualizar** `JORNADAS.md` e `template.html`; `python3 docs/atlas/build.py` → `ok`.
- [ ] **Step 3: Commit** `docs(captura): o atalho pronto e o guia nas jornadas` (a republicação do Atlas é da sessão principal).

### Verificação final (sessão principal)

- `npx tsc --noEmit && npm run lint && npx vitest run` → verde.
- Navegador: `/account` a 375px e no desktop, nos dois temas: o vazio e o guia, passos 1→4. **Nada chega ao banco**: antes de "Criar código", troque o `fetch` da aba (`javascript_tool`) para responder `"fac_teste"` a `/rest/v1/rpc/create_capture_token` sem sair da página, e recarregue depois (a lista não pode guardar o falso). O Enter no nome cria; o erro de limite aparece no passo 1 (responda `{"code":"P0001","message":"limite_tokens"}` com 400).
- Republicar o Atlas.
