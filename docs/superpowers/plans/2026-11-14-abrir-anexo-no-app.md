# Abrir o anexo dentro do app — plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** o Abrir do anexo mostra a foto ou o PDF num visualizador dentro do app, no primeiro toque.

**Architecture:** `src/lib/anexos.ts` troca `abrirAnexo` (aba em branco + popup) por `urlsDoAnexo`, que devolve a URL de ver e a de baixar. O detalhe do lançamento abre um `VisualizadorDeAnexo` (`Dialog surface="auto"`); o wireframe das contas mostra a prévia na própria linha.

**Tech Stack:** Next 16, React 19, TanStack Query, Supabase Storage, Vitest, Tailwind v4.

**Spec:** `docs/superpowers/specs/2026-11-14-abrir-anexo-no-app-design.md`

## Global Constraints

- Só componentes de `src/components/ui/` e tokens existentes; nada novo em `ui/` nem em `globals.css`.
- Textos exatos: "Abrir em nova aba", "Baixar", "Não foi possível abrir o anexo.".
- Todo `<button>` cru declara `type`; `Button` de ação auxiliar é `type="button"`.
- Rodapé de diálogo: `tertiary` antes do `primary`.
- Ícones só Heroicons.
- O banco de dev é o de produção: nenhum teste ou verificação grava, apaga ou anexa dado.
- Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; `git add` só dos próprios arquivos (nunca `graphify-out/graph.json`); sem push; sem prettier.
- Depois de mudar código: `graphify update .`.

## Review Focus

- URL assinada falha (`null`): o visualizador mostra a mensagem de erro, não um `<img>` quebrado nem esqueleto eterno.
- Fechar e abrir outro anexo: o visualizador mostra o arquivo novo, nunca o anterior em cache errado (chave por `path`).
- PDF: `<iframe>` com `title`; foto com `alt` vindo de `descricaoDoAnexo`.
- Boleto da conta (só leitura) também abre no visualizador.
- O link "Abrir anexo" embaixo da lista não volta em nenhum estado.

---

### Task 1: `urlsDoAnexo` e o wireframe

**Files:**
- Modify: `src/lib/anexos.ts` (remove `abrirAnexo` e `AberturaDoAnexo`; adiciona `urlsDoAnexo`)
- Modify: `src/lib/anexos.test.ts` (troca o `describe("abrirAnexo")`)
- Modify: `src/components/wireframe/anexos-wireframe.tsx`

**Interfaces:**
- Produces: `export type UrlsDoAnexo = { ver: string; baixar: string }` e `export async function urlsDoAnexo(supabase: SupabaseClient, path: string): Promise<UrlsDoAnexo | null>`.

- [ ] **Step 1: Teste que falha** em `anexos.test.ts`, `describe("urlsDoAnexo")`, com um `supabase` falso cujo `createSignedUrl(path, segundos, opcoes)` grava as chamadas:
  - `it("devolve a URL de ver e a de baixar")`: com `signedUrl` `"https://x/a"` para a chamada sem opções e `"https://x/a?download="` para `{ download: true }`, espera `{ ver: "https://x/a", baixar: "https://x/a?download=" }`; espera duas chamadas, ambas com `3600` segundos, a segunda com `{ download: true }`.
  - `it("devolve null quando uma URL falha")`: `data: null` → `null`.
- [ ] **Step 2:** `npx vitest run src/lib/anexos.test.ts` → FAIL (`urlsDoAnexo` não existe).
- [ ] **Step 3:** implementar `urlsDoAnexo` (as duas `createSignedUrl` em `Promise.all`, `URL_ASSINADA_SEGUNDOS`); apagar `abrirAnexo`, `AberturaDoAnexo` e o teste antigo. `urlAssinada` fica se ainda tiver uso.
- [ ] **Step 4: Wireframe.** Em `anexos-wireframe.tsx`, o Abrir alterna uma prévia **na própria linha**: estado `aberto: { id: string; urls: UrlsDoAnexo } | null`; foto em `<img alt={descricaoDoAnexo(a)}>` contida, PDF em `<iframe title={descricaoDoAnexo(a)}>`; abaixo, `<a href={urls.ver} target="_blank" rel="noopener">Abrir em nova aba</a>`. O botão vira "Fechar" quando aberto. Falha → o erro que já existe ("Não foi possível abrir o anexo."). Sai o estado `link` e o bloco do link "Abrir anexo". Visual do wireframe (tracejado, mono, cinza), controles nativos.
- [ ] **Step 5:** `npx vitest run src/lib/anexos.test.ts src/components/wireframe && npx tsc --noEmit` → PASS (o `tsc` ainda acusa `anexos-do-lancamento.tsx` por usar `abrirAnexo`: esperado, a Task 2 conserta; nenhum outro erro).
- [ ] **Step 6: Commit** `fix(anexos): urlsDoAnexo no lugar da aba em branco; o wireframe abre na linha`.

### Task 2: `VisualizadorDeAnexo` no detalhe do lançamento

**Files:**
- Create: `src/components/transactions/visualizador-de-anexo.tsx`
- Create: `src/components/transactions/visualizador-de-anexo.test.ts` (leitura de fonte, `lerFonte`/`semComentarios` de `@/test/fonte`)
- Modify: `src/components/transactions/anexos-do-lancamento.tsx`

**Interfaces:**
- Consumes: `urlsDoAnexo`, `UrlsDoAnexo`, `descricaoDoAnexo`, `tamanhoDoAnexo` de `@/lib/anexos`.
- Produces: `export function VisualizadorDeAnexo(props: { anexo: Attachment | null; onOpenChange: (open: boolean) => void }): JSX.Element`.

- [ ] **Step 1: Teste que falha** (`visualizador-de-anexo.test.ts`), sobre a fonte sem comentários:
  - usa `<Dialog` com `surface="auto"` e `open={anexo != null}`;
  - contém `"Abrir em nova aba"`, `"Baixar"` e `"Não foi possível abrir o anexo."`;
  - o `<iframe` tem `title=` e o `<img` tem `alt=`;
  - `queryKey` contém `anexo?.path` (ou `anexo.path`);
  - em `anexos-do-lancamento.tsx`: importa `VisualizadorDeAnexo`; não contém `abrirAnexo`, `target="_blank"` nem `"Abrir anexo"`.
- [ ] **Step 2:** `npx vitest run src/components/transactions/visualizador-de-anexo.test.ts` → FAIL.
- [ ] **Step 3: O visualizador.** `Dialog surface="auto"` controlado por `anexo`; `DialogContent size="xl"`; `DialogHeader` com `DialogTitle` ("PDF"/"Foto") e `DialogDescription` (`tamanhoDoAnexo` · `formatDatePtBr(created_at)`); `DialogBody` com: `useQuery({ queryKey: ["anexo-url", anexo?.path], queryFn: () => urlsDoAnexo(supabase, anexo!.path), enabled: anexo != null, staleTime: 50 * 60 * 1000 })` — pendente: `Skeleton`; `null` ou erro: `CardMessage tone="destructive"` (ou `Alert tone="destructive"`) com "Não foi possível abrir o anexo."; foto: `<img>` contida, `rounded-row-lg`, `w-full`; PDF: `<iframe>` de largura cheia e altura alta sem valor arbitrário reprovado. `DialogFooter`: `Button variant="tertiary" asChild` → `<a href={urls.ver} target="_blank" rel="noopener">Abrir em nova aba</a>`; `Button variant="primary" asChild` → `<a href={urls.baixar}>Baixar</a>`; os dois só com as URLs prontas.
- [ ] **Step 4: O detalhe.** Em `anexos-do-lancamento.tsx`: estado `aberto: Attachment | null`; o Abrir faz `setAberto(a)`; renderiza `<VisualizadorDeAnexo anexo={aberto} onOpenChange={(o) => { if (!o) setAberto(null) }} />`; sai `abrir`, o estado `link` e o bloco `aria-live` do link. O `erro` continua para o envio.
- [ ] **Step 5:** `npx vitest run src/components/transactions src/lib/anexos.test.ts && npx tsc --noEmit && npm run lint && npm run ds:audit -- src/components/transactions/visualizador-de-anexo.tsx src/components/transactions/anexos-do-lancamento.tsx` → tudo limpo.
- [ ] **Step 6: Commit** `feat(anexos): o Abrir mostra o anexo num visualizador dentro do app`.

### Task 3: Jornada e Atlas

**Files:**
- Modify: `docs/JORNADAS.md` (nó `attachUrl`, por volta da linha 801)
- Modify: `docs/atlas/template.html` (item "Anexos", por volta da linha 653; a data da capa)
- Regenerate: `docs/atlas/atlas-jornadas.html`

- [ ] **Step 1:** `attachUrl` passa a dizer: `"Visualizador no app (diálogo; gaveta no telefone): foto ou PDF pela URL assinada de 1 h, com Abrir em nova aba e Baixar"`. Nas contas (wireframe), a prévia abre na linha — se o fluxograma das contas tiver nó de abrir anexo, ajustar igual.
- [ ] **Step 2:** no `template.html`, a frase do item "Anexos" troca "numa aba nova; com o popup bloqueado, aparece o link "Abrir anexo", e a pessoa não sai do app" por "num visualizador dentro do app (gaveta no telefone), com Abrir em nova aba e Baixar"; a capa ganha à frente da lista de datas `14 nov 2026 · o Abrir do anexo mostra a foto ou o PDF dentro do app;`.
- [ ] **Step 3:** `python3 docs/atlas/build.py` → gera sem erro.
- [ ] **Step 4: Commit** `docs(jornadas): o anexo abre num visualizador no app`. (O controlador republica o Atlas no mesmo URL.)
