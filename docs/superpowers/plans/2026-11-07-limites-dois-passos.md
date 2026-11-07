# Limites: subtítulo solto, "Adicionar limite" em dois passos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A seção Limites de Membros mostra título e subtítulo soltos (como Pessoas), lista só quem tem limite e adiciona limite por um diálogo de dois passos: escolher a pessoa, depois o valor.

**Architecture:** Só `src/components/members/` (+ testes e docs). `LimitesSecao` volta a ser `PageSection` com `PageSectionHeader` (título + `actions` com o botão "Adicionar limite"), `PageSectionDescription` e um `Card padding="none"` com as linhas de quem tem limite. O vazio (cartão tracejado) fica quando ninguém tem limite. O diálogo novo `AdicionarLimiteDialog` (no mesmo arquivo ou em `src/components/members/adicionar-limite-dialog.tsx`) tem dois passos. O `Collapsible`, o resumo no cabeçalho e os ouvintes de `#limites` saem.

**Tech Stack:** Next.js, React, design system (`PageSection`, `EmptyState`, `Dialog` com `surface="auto"`, `DialogSteps`, `Item`, `FormInput money`), vitest.

**Spec:** pedido do dono em 07/11/2026 ("o subtítulo fora do card; ao clicar no empty state, dois passos: primeiro escolho quem, das pessoas que ainda não têm limite, depois coloco o limite; um botão Adicionar limite junto do subtítulo; sai do empty state quando houver alguém com limite e volta quando não houver"), confirmado com "sim" à leitura do controlador, que incluía: a lista mostra **só quem tem limite**; o botão some quando todos têm; o cartão recolhível sai.

## Global Constraints

- Design system do `AGENTS.md`; nada novo em `src/components/ui/` nem em `globals.css`; sem cor crua. Diálogo: `Dialog surface="auto"` (gaveta no telefone), passos com `DialogSteps` se o catálogo o tiver para o caso, e rodapé na tabela de rodapé (Cancelar/Voltar `tertiary`, ação `primary`); formulário com `Form`/`CustomForm` + `FormInput money` + `FormSubmit` (o Enter envia). A gaveta de passos mede o maior passo (memória do projeto "passo a passo na altura do maior", `CaixaDoPasso` em `src/components/account/passo-a-passo.tsx`) — usar o mesmo recurso se servir.
- Estrutura:
  - Cabeçalho sempre: `PageSectionTitle` "Limites"; `PageSectionDescription` `Defina quanto cada pessoa pode gastar por mês. A pessoa e o dono recebem um aviso ao chegar a 80% e a 100% do limite.` **fora de qualquer cartão**.
  - `indisponivel`: o estado neutro de hoje (inalterado).
  - Ninguém com limite: o vazio tracejado de hoje (dono com botão "Definir limites"; quem não é dono sem botão, frase de hoje). O título do vazio pode ficar, mas a frase de apoio já está no subtítulo: a descrição do vazio do dono vira `Escolha uma pessoa e o valor por mês.` (sem repetir o subtítulo).
  - Alguém com limite: `Card padding="none"` com `ItemGroup variant="divided"` só das pessoas **com** limite (a linha de hoje: avatar, situação, porcentagem sobre a barra, lápis `icon-lg` que abre o diálogo de editar/remover de hoje). O botão **Adicionar limite** (`Button` `secondary` `size` padrão, ícone `PlusIcon` 16/solid à esquerda) vai nas `actions` do `PageSectionHeader`, só para o dono e só se há alguém sem limite.
- Diálogo "Adicionar limite" (aberto pelo botão do cabeçalho ou pelo "Definir limites" do vazio):
  - Passo 1, título `Adicionar limite`, descrição `Escolha a pessoa.`: lista das pessoas **sem** limite (avatar + nome + `R$ X no mês`), cada linha um botão; tocar avança ao passo 2.
  - Passo 2, título `Limite de {nome}`, descrição `Quanto esta pessoa pode gastar por mês.`: `FormInput money` com rótulo `Limite mensal em R$` e foco nele; rodapé `Voltar` (tertiary, volta ao passo 1) e `Salvar` (submit, `primary`). Salvar usa `gravarLimite` e `onMudou` (como hoje), fecha o diálogo e a pessoa aparece na lista. Erro de valor: a mesma frase de hoje (`Informe um valor maior que zero, até R$ 9.999.999.999,99.`).
  - Com uma pessoa só sem limite, o diálogo abre direto no passo 2 (sem "Voltar").
- O `id="limites"` continua no contêiner da página (`page-client.tsx`) e o navegador rola até ele no hash; os ouvintes de `hashchange`/clique e o `Collapsible` saem do componente. `resumoDosLimites` deixa de ser usado na tela: remover a função e o teste dela se ninguém mais usar (`grep`).
- Jornadas: muda o caminho de Limites (botão, diálogo de dois passos, fim do recolher e do resumo) — atualizar `docs/JORNADAS.md` (linha de Membros ~397, "O destino de Ver limite" e o fluxograma da seção de limites) e `docs/atlas/template.html`, rodar `python3 docs/atlas/build.py`. Republicação do Atlas é do controlador.
- Banco de dev = produção: **não gravar nem remover limite** ao testar. A carteira ativa do dono hoje é "Viagem G4 Valley" (1 pessoa, sem limite): serve para ver o vazio e abrir o diálogo (ir até o passo 2 e **cancelar**). Não trocar a carteira ativa.
- Commit só dos arquivos da tarefa (`git add <arquivos>`, nunca `-A`); trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; sem `git stash`; `graph.json` fora.

## Review Focus

1. Uma pessoa só sem limite → o diálogo abre no passo 2, sem "Voltar". Teste.
2. Todos com limite → sem botão "Adicionar limite". Teste.
3. Quem não é dono → sem botão no cabeçalho e sem botão no vazio. Teste.
4. Fechar o diálogo no passo 2 e abrir de novo → volta ao passo 1 com o campo limpo. Teste ou navegador.
5. No telefone (375 px) o diálogo é a gaveta e não muda de altura entre os passos. Navegador.

---

### Task 1: Seção nova e diálogo de dois passos

**Files:**
- Modify: `src/components/members/limites-secao.tsx` (e Create: `src/components/members/adicionar-limite-dialog.tsx` se separar)
- Modify: `src/lib/limites/limites.ts` (+ teste) só para tirar `resumoDosLimites` se ficar sem uso
- Test: `src/components/members/limites-secao.test.ts` (+ `adicionar-limite-dialog.test.ts` se separar)
- Modify: `docs/JORNADAS.md`, `docs/atlas/template.html`, `docs/atlas/atlas-jornadas.html`

- [ ] **Step 1: Testes que falham** (fonte sem comentários): `<PageSectionDescription>` fora de `<Card`; `Adicionar limite` dentro do ramo do dono e condicionado a haver pessoa sem limite; a lista filtra `limite != null`; o diálogo tem `Escolha a pessoa.`, `Limite de `, `Voltar`, `FormInput`, `money`; não há `<Collapsible`, `hashchange`, `resumoDosLimites(`; uma pessoa sem limite → passo inicial 2 (teste da lógica: extrair `passoInicial(semLimite: number): 1 | 2` puro e testá-lo).
- [ ] **Step 2:** `npx vitest run src/components/members src/lib/limites` → FAIL.
- [ ] **Step 3: Implementar.**
- [ ] **Step 4:** testes, `npx tsc --noEmit`, `npx eslint src/components/members src/lib/limites`, `npm run ds:audit -- src/components/members`; navegador (desktop e 375 px): vazio → "Definir limites" → passo 2 direto (1 pessoa) → **Cancelar**; nada gravado.
- [ ] **Step 5: Jornadas** + `python3 docs/atlas/build.py`.
- [ ] **Step 6: Commit** — `feat(membros): Limites com subtítulo solto e adicionar em dois passos`.
