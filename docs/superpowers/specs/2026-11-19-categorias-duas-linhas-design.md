# Categorias em duas linhas — desenho curto

Data: 19/11/2026. Escolha do dono: **A**.

## Por quê

A tela de Categorias tem três linhas antes dos cartões: o título, a barra (abas e mês) e a linha "10 categorias com gasto em novembro · Maior gasto". O dono quer no máximo duas, como em Transações: o cabeçalho e a linha de baixo.

## O que muda

- **Desktop:** o cabeçalho continua igual, com o título e Nova categoria. A barra fica assim:
  - à esquerda, as abas (Despesas | Receitas) e, logo depois, a contagem curta em `muted` ("10 categorias", "1 categoria");
  - à direita, o seletor de ordem (`Select size="sm"`, "Maior gasto/Maior receita · Nome · Variação") e o mês.
- **A frase longa sai.** O mês já está à vista no seletor, então "com gasto em novembro" repetia a informação.
- **Telefone** (sem título): a linha tem as abas, a ordem e o Nova categoria. A ordem vira um botão só de ícone (`Button variant="floating" size="icon-md"`, a pele do ⋯ de Transações), com um `DropdownMenu` de rádio que oferece as mesmas três opções. A contagem não aparece no telefone. O mês continua no cabeçalho do telefone.
- **Quando somem:** a contagem e a ordem só aparecem com os números do mês prontos e com ao menos uma categoria com movimento, como a linha de hoje. No estado vazio e no esqueleto, a barra mostra só abas, mês e Nova categoria.
- **Contagem rente ao pé da linha (pedido do dono):** a contagem de categorias não fica centrada na linha. Ela desce até a base, e o pé do texto encosta no pé das abas e dos controles (`self-end`). Transações recebe o mesmo: a contagem "N lançamentos", à direita na linha da `FilterBar` (`data-slot="filter-bar-count"`, em `src/components/ui/filter-bar.tsx`), desce até a base. Como a mudança está na `FilterBar`, ela vale para toda barra que mostra contagem. A mudança em `ui/` foi pedida pelo dono.
- `CategoriasDoMesCabecalho` deixa de existir. A frase "Sem gasto em …" do rodapé (`SemMovimentoNoMes`) fica como está.

## O que não muda

Os cartões, o critério de ordem e o estado dele, o mês, o formulário e a tela de detalhe.

## Abordagens

1. **A (escolhida):** tudo na linha de baixo, com a contagem ao lado das abas. É a forma de Transações.
2. **B:** o mês sobe para o cabeçalho. A linha de baixo fica mais leve, mas o mês muda de lugar no desktop.
3. **C:** a contagem entra nas abas. Isso confundia, porque o número parecia o total de categorias e não as que tiveram movimento no mês.

## Fica com quem constrói

Os nomes das props novas do `CategoriesToolbar` e o ícone da ordem no telefone (Heroicons, `20/solid` ou o corpo que o botão pedir).
