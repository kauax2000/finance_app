# Formulário de categoria (A) — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** um formulário de categoria só para os três diálogos: criar e editar em Categorias, "Nova categoria" de fora da página e "Editar categoria" do detalhe. O formulário tem prévia do ladrilho, cor livre, ícones sem repetição e o limite do mês recolhível com "Repetir todo mês". O wireframe do Bloco 5 sai.

**Architecture:**
- A aparência (amostras, cor livre, grade de ícones) continua em `category-appearance-fields.tsx`.
- Um componente novo de campos, `category-form-fields.tsx`, recebe estado e callbacks dos três diálogos. Cada diálogo mantém o próprio salvar.
- O rodapé ganha o Cancelar onde falta, e "Remover limite" vai ao `start` do `DialogFooter`.

**Tech Stack:** Next.js, React, Tailwind v4, Heroicons, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-19-formulario-de-categoria-design.md`

## Global Constraints

- **`src/components/ui/` não muda.** Use o que existe: `ColorTile`, `ToggleGroup`/`Toggle` com `variant="swatch"`, `Collapsible`, `FormSwitch`, `FormInput money`, `FormCancel`, `FormSubmit` e `DialogFooter start`. Se faltar uma variante, pare e reporte `NEEDS_CONTEXT`.
- **O tipo continua sendo o `TransactionFormTypeSegment` (Tabs).** É decisão do dono: a escolha muda o formulário.
- **A cor livre é a nona amostra, como na carteira.** O padrão está em `src/components/workspace/workspace-appearance-form-fields.tsx`, ~l.133-161: `Label` com `toggleVariants({ variant: "swatch" })`, `<input type="color" className="sr-only">` e `aria-label="Outra cor"`. Antes de escolher, mostra o `EyeDropperIcon`; depois, a cor com o `CheckIcon`. Na categoria a cor passa pelo `ColorTile`/`tileColorFor`, sem `corExataDaCarteira`.
- **Textos exatos:**
  - linha do limite: `Limite do mês`, com `Opcional` à direita;
  - campo: `Valor`;
  - ajuda do campo: `Vale para <mês por extenso> de <ano>` (ex.: `Vale para novembro de 2026`);
  - interruptor: `Repetir todo mês`;
  - ajuda do interruptor, ligado: `Vale também nos próximos meses`;
  - ajuda do interruptor, desligado: `Desligado, vale só em <mês>`;
  - ação de editar: `Remover limite`;
  - títulos: `Nova categoria` e `Editar categoria`.
- **Ícones:** só Heroicons, no conjunto certo para o tamanho. A grade não tem dois ids com o mesmo desenho.
- **O que se grava não muda:** categoria, orçamento, `repeats`, as RPCs e `upsertCategoryBudget`/`definirRepeticao`.
- **Não faça stage** de `CLAUDE.md` nem de `graphify-out/graph.json`.

## Review Focus

1. **Categoria salva com um ícone que saiu da grade** (ex.: `dog`): ela abre no editar com um ícone válido (`normalizeCategoryIcon`), e salvar sem mexer não quebra.
2. **Editar uma despesa que já tem limite:** a linha do limite abre já aberta, com o valor e o `repeats` gravados.
3. **Trocar de Despesa para Receita com o limite preenchido:** o bloco some, e salvar não grava orçamento, como hoje.
4. **Cor escolhida no seletor livre:** a prévia e o ladrilho mostram o matiz. Ao reabrir, a nona amostra aparece marcada, e nenhuma das oito.
5. **Telefone a 375px:** a gaveta não esconde o Salvar, e "Remover limite" segue a regra das três ações.

---

### Task 1: aparência sem ícone repetido e com cor livre

**Files:**
- Modify: `src/components/categories/category-appearance-fields.tsx`
  - `CATEGORY_ICONS`;
  - o mapa `categoryIconComponents`, ~l.140-165;
  - `CategoryColorSwatches`.
- Test: `src/components/categories/category-appearance-fields.test.ts` (novo).

**Interfaces:**
- Produces:
  - `CATEGORY_GRID_ICONS: readonly CategoryIconId[]`, os ids que a grade mostra, sem desenho repetido.
  - `CATEGORY_ICONS` continua com todos os ids, para a leitura.
  - `CategoryColorSwatches({ value, onChange, idPrefix? })`, igual a hoje mais a nona amostra livre.

- [ ] **Step 1: escrever os testes.**
  - `"a grade não repete desenho"`: para cada par de ids distintos em `CATEGORY_GRID_ICONS`, `categoryIconComponents[a].mini !== categoryIconComponents[b].mini`. Exporte o mapa, se preciso, ou teste pela fonte.
  - `"ids fora da grade continuam lidos"`: `normalizeCategoryIcon("dog")` devolve `"dog"`, e `CATEGORY_ICONS` contém `"dog"`.
  - `"a cor livre é a nona amostra"`: renderiza `CategoryColorSwatches` com `value="#123456"`, fora da paleta, e espera `type="color"`, `aria-label="Outra cor"` e `data-state="on"` no rótulo livre. Com uma cor da paleta, espera `data-state="off"` nele.
- [ ] **Step 2:** rodar `npx vitest run src/components/categories/category-appearance-fields.test.ts`. Esperado: FAIL.
- [ ] **Step 3: implementar.**
  - Cada id que reusa desenho ganha um glifo próprio do Heroicons que faça sentido (`paw-print`, `dog`, `cat`, `stethoscope`; confira também `heart` contra os outros). Os que não tiverem glifo bom ficam só em `CATEGORY_ICONS` e saem de `CATEGORY_GRID_ICONS`.
  - A grade (`CategoryIconGrid`) passa a mapear `CATEGORY_GRID_ICONS`. Se o valor atual estiver fora dela, a grade mostra esse ícone como primeiro item marcado, para a categoria antiga não perder o ícone ao editar.
  - A nona amostra copia o padrão da carteira (Global Constraints). Ela fica fora do `ToggleGroup`, como lá.
- [ ] **Step 4:** rodar o teste (PASS), depois `npx tsc --noEmit` e `npm run ds:audit -- src/components/categories/category-appearance-fields.tsx`.
- [ ] **Step 5:** commit `feat(categorias): ícones sem repetição e cor livre na categoria`.

### Task 2: um formulário só, nos três diálogos

**Files:**
- Create: `src/components/categories/category-form-fields.tsx`
- Create: `src/components/categories/category-form-fields.test.ts`
- Modify:
  - `src/app/(app)/categories/page-client.tsx` (`categoryFormFields`, ~l.632-690, e o rodapé do diálogo, ~l.755);
  - `src/components/categories/category-create-dialog.tsx`;
  - `src/components/categories/detail/category-detail-dialogs.tsx` (`editFields` e o rodapé);
  - quem passa props a esse último, `src/app/(app)/categories/[categoryId]/page-client.tsx`, se for preciso para o `repeats`.
- Delete: `src/components/wireframe/orcamento-repete-wireframe.tsx`
- Modify, se citarem os arquivos tocados: os testes de fonte `src/components/ui/dialog-versions.test.ts` e `src/lib/notification-producers.test.ts`.

**Interfaces:**
- Consumes (Task 1): `CategoryColorSwatches`, `CategoryIconGrid`, `CategoryIconPreview`, `normalizeCategoryIcon`.
- Produces:
  ```ts
  export function CategoryFormFields(p: {
    idPrefix: string
    name: string; onNameChange: (v: string) => void
    type: "income" | "expense"; onTypeChange: (t: "income" | "expense") => void
    color: string; onColorChange: (c: string) => void
    icon: CategoryIconId; onIconChange: (i: CategoryIconId) => void
    budget?: {                       // ausente = o diálogo não oferece limite
      ym: string                     // YYYY-MM do mês do limite
      amount: string; onAmountChange: (v: string) => void
      repeats: boolean; onRepeatsChange: (r: boolean) => void
      defaultOpen: boolean           // true ao editar quem já tem limite
    }
  }): JSX.Element
  ```

- [ ] **Step 1: escrever os testes**, de render e de fonte.
  - Render com `type="expense"` e `budget` com `defaultOpen=false`: contém `Limite do mês` e `Opcional`. Não contém `Repetir todo mês` visível: o conteúdo do `Collapsible` fechado não renderiza, ou fica `hidden`.
  - Render com `defaultOpen=true` e `ym="2026-11"`: contém `Vale para novembro de 2026`, `Repetir todo mês` e `Vale também nos próximos meses` com `repeats=true`. Com `repeats=false`, contém `Desligado, vale só em novembro`.
  - Render com `type="income"`: não contém `Limite do mês`.
  - Render: a prévia (`ColorTile`) vem antes do campo `Nome` no HTML.
  - Fonte: nenhum arquivo em `src` importa `orcamento-repete-wireframe`, e o arquivo não existe.
  - Fonte: os três diálogos importam `CategoryFormFields`. O rodapé da página tem `FormCancel`. A página e o detalhe passam `start=` ao `DialogFooter`, com `Remover limite`.
- [ ] **Step 2:** rodar `npx vitest run src/components/categories/category-form-fields.test.ts`. Esperado: FAIL.
- [ ] **Step 3: implementar `CategoryFormFields`.**
  - Linha da prévia: `ColorTile size="xl"` com `CategoryIconPreview` ao lado do `FormInput` de nome, que tem o rótulo `Nome` e o placeholder `Ex: Alimentação`.
  - Abaixo vêm o `Field` com `Tipo` e o `TransactionFormTypeSegment`, depois as amostras, depois a grade.
  - Com `type === "expense" && budget`, entra um `Collapsible` (veja a página do catálogo `/designsystem/collapsible` e use `CollapsibleRow` ou a peça indicada).
    - Dentro dele, um `FormInput money` com o rótulo `Valor` e a ajuda do período (mês por extenso com `formatMonthLongPtBr`, em minúscula).
    - Depois, um `FormSwitch` com `Repetir todo mês` e a ajuda condicional.
- [ ] **Step 4: ligar nos três diálogos.**
  - Os três apagam os blocos inline e passam o estado que já têm.
  - **Página:** `budget` só quando `type === "expense"`, com `defaultOpen = Boolean(dialogExistingBudget)`. O rodapé fica `start={dialogExistingBudget ? <Button variant="tertiary" className="text-destructive" …>Remover limite</Button> : undefined}`, com `<DialogClose asChild><FormCancel>Cancelar</FormCancel></DialogClose>` e `<FormSubmit>Salvar</FormSubmit>`. O clique continua sendo `handleDialogBudgetRemove`, e enquanto remove o rótulo é o pendente do botão: o `pending` do `Button`, se existir. Não escreva o ternário "Removendo…".
  - **`CategoryCreateDialog`:** ganha o estado `repeats` (padrão `true`), passa ao `upsertCategoryBudget` como a página já faz (confira a assinatura) e passa `defaultOpen=false`.
  - **Detalhe:** use o estado de limite e de remoção que ele já tem. Se ele não tiver `repeats`, siga a página: ler `bud.repeats` ao abrir e gravar com `definirRepeticao` quando mudar.
  - O título da página passa a `Nova categoria` / `Editar categoria`.
- [ ] **Step 5:** rodar `npx tsc --noEmit && npm run lint && npm run test:unit` e `npm run ds:audit -- src/components/categories "src/app/(app)/categories"`.
- [ ] **Step 6: jornada.**
  - **Ruling:** o "Nova categoria" de fora passa a oferecer "Repetir todo mês", e "Remover orçamento" vira "Remover limite" no rodapé. É um passo do diálogo que muda, então conta como jornada.
  - Atualize a seção 9 de `docs/JORNADAS.md`:
    - no nó do formulário, o limite recolhível com "Repetir todo mês";
    - "Remover limite" no rodapé ao editar.
  - Atualize também `docs/atlas/template.html` (a mesma explicação e a data da capa, `19 nov 2026 · o formulário de categoria é um só nos três diálogos: prévia, cor livre e limite recolhível com Repetir todo mês`).
  - Rode `python3 docs/atlas/build.py`.
- [ ] **Step 7:** `graphify update .` e commit `feat(categorias): um formulário de categoria só, com prévia e limite recolhível`.
