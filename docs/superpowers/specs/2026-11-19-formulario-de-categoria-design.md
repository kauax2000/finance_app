# Formulário de categoria (opção A) — desenho

Data: 19/11/2026. Escolha do dono: opção **A**, "prévia no topo, limite recolhido", com cor livre.

## Por quê

O formulário de criar e editar categoria tem três problemas.

**Repetido e diferente.** Existem dois formulários quase iguais:

| Onde | O que faz | O que falta |
|---|---|---|
| Página de Categorias (`page-client.tsx`) | Cria e edita | — |
| `CategoryCreateDialog` (`global-shell-dialogs-provider`) | Abre de fora da página | "Repetir todo mês" e "Remover orçamento" |

**Longo.** O limite do mês aparece aberto para toda despesa.

**Cru.**
- O wireframe "Orçamento que se repete" (Bloco 5) ainda está dentro do formulário.
- O período aparece como "2026-11-01 a 2026-11-30".
- O rótulo diz "Valor limite (R$)".
- "Remover orçamento" é um botão vermelho cheio no meio do cartão.
- A grade de ícones repete glifos: três corações e dois rostos.
- Nada mostra como a categoria vai ficar antes de salvar.

## O que muda

### Um componente só

`CategoryFormFields` (nome livre para quem implementa, em `src/components/categories/`) serve os dois diálogos, em criar e em editar. Os dois passam a ter as mesmas peças. As regras de salvar ficam em cada diálogo, como hoje.

### Ordem, de cima para baixo

```
Nova categoria                                  ✕
[ladrilho]  [ Nome: Mercado              ]
Tipo   ( Despesa | Receita )          ← Tabs de hoje
Cor    ● ● ● ● ● ● ● ●  [conta-gotas]
Ícone  grade sem repetição
┌ Limite do mês ··············· Opcional ⌄ ┐   só despesa
│ R$ 1.500,00                               │
│ Repetir todo mês                     (●)  │
└───────────────────────────────────────────┘
[Remover limite]          Cancelar   Salvar
```

- **Prévia.** O `ColorTile` com o ícone escolhido fica à esquerda do campo de nome e muda na hora, conforme a cor e o ícone.
- **Tipo.** Fica o `TransactionFormTypeSegment` (Tabs), porque a escolha muda o formulário: com Receita, o bloco do limite some e a descrição troca. Regra do dono: escolha que muda o formulário fica em abas; escolha que não muda vira toggle.
- **Cor.** As oito amostras de hoje e uma **nona amostra de cor livre**, copiada da carteira (`workspace-appearance-form-fields.tsx`):
  - antes de escolher, é cinza com o conta-gotas;
  - o seletor nativo fica escondido dentro do `Label`;
  - depois de escolhida, a amostra mostra a cor com o tique.

  Na categoria, o ladrilho segue a regra do sistema (`tileColorFor`): fica o matiz da pessoa, e claridade e croma são do tema. A cor exata continua só na carteira.
- **Ícone.** A grade não tem glifo repetido. Os ids que usam o mesmo desenho de outro (`paw-print`, `dog`, `cat`, `stethoscope`) ganham desenho próprio do Heroicons, se houver um que sirva. Se não houver, saem da grade, mas continuam aceitos na leitura (`normalizeCategoryIcon`), para não quebrar categoria salva.
- **Limite do mês.** Aparece só com Despesa, como uma linha recolhível (`Collapsible`, "Limite do mês · Opcional").
  - **Ao criar,** começa fechada. Ao editar uma categoria que já tem limite, começa aberta com o valor.
  - **Dentro,** fica o `FormInput money` com o rótulo "Valor" e uma ajuda com o período por extenso ("Vale para novembro de 2026").
  - **Repetir todo mês** é um `FormSwitch`, que substitui o `OrcamentoRepeteWireframe`. O arquivo do wireframe é apagado.
  - **A ajuda do interruptor** diz "Desligado, vale só em novembro" ou "Vale também nos próximos meses".
- **Rodapé.**
  - O rodapé é `Cancelar` (`FormCancel`) seguido de `Salvar` (`FormSubmit`). Hoje o diálogo da página não tem o Cancelar.
  - Ao editar com limite, aparece "Remover limite" no `start` do `DialogFooter`, como ação sem fundo, com a tinta destrutiva só no texto. A regra das três ações do sistema decide o peso de cada botão.
  - A remoção continua sendo a função de hoje (`handleDialogBudgetRemove`).

### O que não muda

- Os diálogos continuam `Dialog surface="auto"`: diálogo no desktop, gaveta no telefone.
- O que se grava (categoria, orçamento e `repeats`) e as RPCs ficam iguais.
- O título continua "Nova categoria" / "Editar categoria", com a inicial maiúscula só na primeira palavra.

## Abordagens

1. **A, escolhida:** prévia no topo e limite recolhido, numa tela só.
2. **B:** cor e ícone num seletor que abre pelo ladrilho. É mais curta, mas a aparência fica escondida a um toque.
3. **C:** dois passos, a categoria e depois o limite. É mais lenta para o caso simples e para editar só o limite.

## Restrições

- Nada muda em `src/components/ui/`: as peças existem (`ColorTile`, `Toggle swatch`, `Collapsible`, `FormSwitch`, `DialogFooter start`).
- Se faltar uma variante, pare e pergunte.
- O wireframe sai de `src/components/wireframe/`. O formulário passa a usar só o design system.
- Ícones só do Heroicons, com o conjunto certo para cada tamanho.
- **Jornadas.** Hoje "Remover orçamento" é um botão dentro do cartão e passa a ser uma ação no rodapé, e o diálogo de fora ganha "Repetir" e "Remover limite". Se pela régua do AGENTS.md isso contar como mudança de passo, atualize `docs/JORNADAS.md` e o Atlas junto.

## Fica para quem implementa

- O nome e a API do componente compartilhado.
- Se o `CategoryAppearanceFields` vira parte dele ou continua separado.
- Quais ícones do Heroicons substituem os repetidos.
