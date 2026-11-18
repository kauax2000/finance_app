# Cabeçalho de Categorias — desenho

Data: 18/11/2026. Aprovado pelo dono.

## Por quê

Categorias é a tela grande que ainda abre sem `PageHeader` no desktop. O dono quer o
novo padrão do app, o mesmo de Transações e Membros.

## O que muda

**Desktop**

```
Categorias                                  [+ Nova categoria]
[Despesas | Receitas]        Este mês  ‹  [📅 novembro 2026]  ›
```

- `PageHeader collapse` com `PageHeaderTitle asChild` + `<p aria-hidden="true">Categorias</p>`
  (o `<h1>` é o da barra do topo). Ao rolar, o título sobe para a barra.
- **Nova categoria** sai da `Toolbar` e vai para `PageHeaderActions`, como o Convidar de
  Membros: `tertiary`, sem fundo como Importar e Exportar de Transações (o + Adicionar é o `primary` da tela; com fundo, brigava com as abas), ícone `PlusIcon`. Some para quem não escreve (`podeEscrever`).
- A `Toolbar` fica com Despesas | Receitas e o mês (só em Despesas). O mês no desktop mora
  na barra da tela (regra do AGENTS).

**Telefone:** nada muda. Sem título (tela de aba), mês colado à lupa, `+` recolhido na barra.

## Abordagens

1. **Escolhida:** título + Nova categoria no cabeçalho; mês e tipo na barra. Segue Membros
   (ação primária no cabeçalho) e a regra do mês na barra.
2. Mês no cabeçalho — recusada: contraria "no desktop o mês fica na barra da tela".
3. Tirar Nova categoria da tela, como o Criar de Transações — recusada: o "+ Adicionar" não
   cria categoria.

## Restrições

- Nenhum componente novo nem mudança em `src/components/ui/`.
- Mesmo padrão de decisão desktop/telefone de Transações e Membros (`isMobile ? null : <PageHeader>`).
- Não muda rota, destino nem diálogo: não é mudança de jornada.

## Fica para quem implementa

- Como a barra recebe o `onNewCategory` só no telefone (passar `undefined` no desktop é o
  caminho mais curto).
- O esqueleto (`CategoriesPageGridSkeleton`) ganha o osso do cabeçalho se o de Transações tiver.
