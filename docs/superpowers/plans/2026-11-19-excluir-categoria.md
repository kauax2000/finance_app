# Excluir categoria como excluir lançamento — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** a confirmação "Excluir categoria?" vira o `ExcluirCategoriaDialog`, com o título com o nome, um cartão com a linha da categoria e uma nota, espelhando o `ExcluirLancamentosDialog`.

**Architecture:** um componente novo em `src/components/categories/excluir-categoria-dialog.tsx`, que a grade (`src/app/(app)/categories/page-client.tsx`) e o detalhe (`src/components/categories/detail/category-detail-dialogs.tsx`) usam. O `category-delete-alert-body.tsx` sai.

**Tech Stack:** React 19, Radix AlertDialog (`@/components/ui/alert-dialog`), Vitest.

**Spec:** `docs/superpowers/specs/2026-11-19-excluir-categoria-design.md`

## Global Constraints

- **Molde:** `src/components/transactions/excluir-lancamentos-dialog.tsx`. Copie a estrutura: `AlertDialog pending`, o cabeçalho, `Card padding="none"` > `ItemGroup variant="divided"` > `Item variant="flush" size="md"` com `ColorTile size="md"` e `CategoryIconPreview`, e a nota em `Muted className="text-sm"`.
- **Textos exatos:**
  - título: `Excluir ${nome}?`;
  - descrição: "Sai da carteira e não dá para desfazer.";
  - detalhe do item: "Despesa" ou "Receita", mais ` · limite de ${currencyBRL(limite)}` quando houver limite;
  - nota: `Os lançamentos com ${nome} ficam no extrato, sem categoria, até você escolher outra.`, mais ` O limite dela sai junto.` quando houver limite;
  - rodapé: `AlertDialogCancel` "Cancelar" e `AlertDialogAction` "Excluir", com `onClick` que faz `preventDefault` e chama `onConfirm`.
- **Interface:** `ExcluirCategoriaDialog({ categoria, limite, open, pending, onConfirm, onOpenChange })`.
  - `categoria: Pick<Category, "id" | "name" | "type" | "color" | "icon"> | null`;
  - `limite: number | null`, o valor do mês, ou `null` sem limite.
- **Ao fechar:** o componente guarda a última categoria em estado (o mesmo padrão do `mostradas` do molde), para o texto não sumir na animação de saída.
- **Não muda:** o que a exclusão faz, o toast, e a navegação de quem chama.
- **Commits:** só os seus arquivos, com `git commit <caminhos>`. Outras sessões têm arquivos não commitados nesta árvore. Sem push, sem stash e sem reset. A mensagem termina com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Fechar e cancelar:** o título e o cartão não somem nem piscam durante a saída.
2. **Categoria de receita:** o detalhe diz "Receita", e sem limite a nota não fala dele.
3. **Excluindo (`pending`):** os botões travam e o Esc não fecha.
4. **No detalhe:** depois de excluir, a navegação de volta continua.
5. **Nome longo:** o título quebra a linha sem estourar a largura.

---

### Task 1: o `ExcluirCategoriaDialog` e as duas chamadas

**Files:**
- Create: `src/components/categories/excluir-categoria-dialog.tsx`
- Create: `src/components/categories/excluir-categoria-dialog.test.ts`
- Modify: `src/app/(app)/categories/page-client.tsx`
  - `pendingDelete` passa a guardar a categoria inteira;
  - o limite vem do `budgetForCategory` já existente, e é `null` para receita;
  - o `AlertDialog` atual dá lugar ao componente.
- Modify: `src/components/categories/detail/category-detail-dialogs.tsx`, onde o `AlertDialog` de excluir dá lugar ao componente, com o `budget` já recebido.
- Delete: `src/components/categories/category-delete-alert-body.tsx`, e o teste dele, se existir.
- Tests a ajustar: quem procurar `CategoryDeleteAlertBody` ou "Esta ação não pode ser desfeita" nos testes de Categorias.

- [ ] **Step 1: testes de render** (`renderToStaticMarkup` com o diálogo aberto; se o portal impedir, use teste de fonte).
  - Uma despesa "Carro" com `limite: 800` mostra:
    - "Excluir Carro?";
    - "Sai da carteira e não dá para desfazer.";
    - "Despesa · limite de R$ 800,00";
    - "Os lançamentos com Carro ficam no extrato, sem categoria, até você escolher outra. O limite dela sai junto."
  - Uma receita sem limite mostra "Receita" e não contém "limite".
  - Fonte: `page-client.tsx` e `category-detail-dialogs.tsx` não contêm `CategoryDeleteAlertBody` e usam `<ExcluirCategoriaDialog`.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** implementar.
- [ ] **Step 4:** PASS. Rodar `npx vitest run src/components/categories "src/app/(app)/categories"`, `npx tsc --noEmit`, `npm run lint` e `npm run ds:audit -- src/components/categories "src/app/(app)/categories"`.
- [ ] **Step 5:** `graphify update .` e commit `feat(categorias): excluir categoria mostra a linha dela, como excluir lançamento`.
