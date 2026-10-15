# Formulário de lançamento — redesenho

**Data:** 2026-10-15 · **Aprovado pelo dono em conversa** (desenho em quatro partes)

## Objetivo

O formulário de Despesa, Compra parcelada e Receita é talvez a tela mais usada
do app. Ele deve ficar mais bonito, mais organizado e mais fácil de usar no
diálogo do desktop e na gaveta do telefone, servindo igualmente quem lança
rápido (valor e categoria) e quem preenche tudo.

**Decisões do dono:** os dois usos pesam igual (tudo à vista, o essencial em
destaque); o valor continua um campo, só mais alto e primeiro; a organização é
uma coluna em dois blocos ("Reorganizar em blocos"), com a forma de pagamento
numa lista de seleção.

## Hoje

`TransactionFormSurface` (`transaction-form-surface.tsx`) monta cabeçalho,
corpo e rodapé em três variantes (`dialog-desktop`, `dialog-mobile`,
`detail-sheet`); `TransactionFormFields` (`transaction-form-fields.tsx`) monta
os campos; `TransactionFormKindSegment` e `TransactionFormTypeSegment`
(`transaction-type-segment.tsx`) são o seletor de tipo, em cartões de rádio.

Problemas: o valor tem o peso de "Descrição"; os três cartões de tipo ocupam o
topo; o formulário não cabe e rola (a forma de pagamento, seis fichas, fica
cortada); a descrição do cabeçalho repete o título; o rodapé tem só "Salvar",
pequeno; a Parcelada soma outro seletor em cartões e dois campos; a cor da
categoria é uma bolinha pintada por `style` (o `ColorTile` é a peça certa).

## Desenho

### 1. Estrutura (os três tipos, criar e editar)

1. **Cabeçalho.** `DialogTitle` pelo tipo e pelo modo:

   | | Criar | Editar |
   |---|---|---|
   | Despesa | Nova despesa | Editar despesa |
   | Parcelada | Nova compra parcelada | Editar compra parcelada |
   | Receita | Nova receita | Editar receita |

   Na edição de uma parcela com escopo "Esta parcela", o título é o do tipo
   (Editar despesa); com escopo "Plano da compra", "Editar compra parcelada".
   A `DialogDescription` continua no DOM, `sr-only`, nas três variantes.
2. **Tipo.** `ToggleGroup type="single" variant="segmented"` com
   `stretch`, na largura toda, ícone `16/solid` mais rótulo: `Despesa |
   Parcelada | Receita` ao criar, `Despesa | Receita` ao editar. Rótulo do
   grupo: `aria-label="Tipo de lançamento"` (sem rótulo visível: o título já
   diz). O Radix anuncia o grupo `single` como rádio.
3. **Bloco do essencial**, nesta ordem:
   - **Valor** — `FormInput money` de altura `xl` (40) com o texto em
     `text-base`, primeiro campo; foco ao abrir **só no desktop**.
   - **Categoria** — o gatilho do `FormPickerPopover` mostra
     `ColorTile size="xs"` com `CategoryIconPreview` da categoria; as linhas da
     lista também. Sai a bolinha com `style={{ backgroundColor }}`.
   - **Descrição** — como hoje.
4. **Separador** `Separator` com o rótulo "Detalhes" como filho.
5. **Bloco dos detalhes:**
   - **Data e Forma de pagamento** num `FieldRow` (lado a lado no desktop,
     empilhados no telefone; o `FieldRow` já empilha).
   - **Forma de pagamento** vira `Select` com a opção de ausência
     `variant="none"` "Sem forma" (valor vazio = `null`), mais as opções de
     `paymentMethodOptions()`. Trocar para algo que não seja cartão de crédito
     limpa o cartão, como hoje.
   - **Cartão** — só com "Cartão de crédito"; a dica da fatura logo abaixo,
     como hoje. Sem cartão ativo, o `EmptyState` inline de hoje.
6. **Rodapé.** `FormCancel` (terciário) dentro de `DialogClose asChild` — o
   fechar passa pelo pedido de fechar do diálogo, que pergunta "Descartar
   alterações?" se houver rascunho — e
   `FormSubmit` "Salvar" (primário), na ordem e no degrau do `DialogFooter`.
   Sem `size` à mão.

### 2. Cada tipo

- **Despesa:** a estrutura inteira.
- **Receita:** sem Forma de pagamento e sem Cartão; nos detalhes, a Data na
  largura toda.
- **Parcelada** (criar, e editar com escopo "Plano da compra"):
  - No lugar do Valor, uma fileira `FieldRow stack={false}`: o valor (`xl`)
    e o "Nº de parcelas" (estreito). Acima do valor, junto do rótulo, um
    `ToggleGroup variant="segmented" size="sm"` `Total | Por parcela`
    (`aria-label="Como informar o valor"`); o rótulo do campo segue a escolha
    ("Valor total" / "Valor da parcela").
  - A prévia ("12 parcelas de R$ 100,00", ou "11 × … + última …") fica logo
    abaixo da fileira, ligada como descrição.
  - A Data se chama "Primeira cobrança" ao criar; na edição, "Próxima
    cobrança" com o plano ativo e o aviso de plano concluído sem ele, como hoje.
  - Na edição do plano, o aviso amarelo sobre parcelas já lançadas continua,
    como `Alert tone="warning" size="sm"` no lugar do `<p>` pintado à mão.
- **Edição de uma parcela:** "O que editar" vira o mesmo trilho segmentado
  `Esta parcela | Plano da compra`, acima do tipo.

### 3. Telefone (gaveta)

- A mesma ordem, em uma coluna; Data e Forma empilham.
- O valor não recebe foco ao abrir (o teclado cobriria a gaveta).
- O rodapé segue fixo, com Salvar na largura toda e Cancelar acima (o
  `DialogFooter` empilha ao contrário no telefone).
- Os seletores de categoria e cartão continuam modais no telefone.

## Fora do escopo

- O que é gravado, a validação e a persistência (`transaction-form-use.tsx`,
  `transaction-form-persistence.ts`) não mudam, salvo o necessário para o
  título e o foco.
- Nenhum componente de `src/components/ui/` muda; nenhum token novo.
- O painel de detalhe fora do formulário (`transaction-detail-sheet.tsx`) só
  muda no que vem do `TransactionFormSurface`.

## Testes e verificação

- `radio-group-versions.test.ts` ("a forma de pagamento é rádio"): passa a
  exigir o `Select` com a opção `variant="none"` e continua proibindo
  `aria-pressed` e `PaymentMethodChips`.
- `tabs-versions.test.ts` e `date-picker-versions.test.ts` citam os arquivos do
  formulário: continuam passando.
- Teste novo `src/components/transactions/transaction-form-layout.test.ts`
  (leitura de fonte, como os da casa): o título pelo tipo, o tipo em
  `ToggleGroup variant="segmented"`, a ordem Valor → Categoria → Descrição →
  "Detalhes" → Data/Forma → Cartão, `FormCancel` + `FormSubmit` no rodapé,
  Receita sem Forma, nenhum `style={{ backgroundColor` no formulário.
- `npx tsc --noEmit`, `npm run lint`, `npm run test:unit`,
  `npm run ds:audit -- src/components/transactions`.
- No navegador (sem salvar nada no banco de produção): os três tipos ao criar
  e a edição, no desktop (1440) e no telefone (375), claro e escuro; medir que
  o diálogo de Despesa cabe sem rolar a 900px de altura.
