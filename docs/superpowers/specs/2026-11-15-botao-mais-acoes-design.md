# Transações no telefone: o ⋯ com a pele das abas — design curto

**Pedido (15/11/2026):** no telefone, o botão ⋯ (Mais ações: Importar extrato,
Exportar CSV) ao lado das abas Todas · Despesas · Receitas destoa delas: é um
botão terciário, sem fundo nem contorno. O dono quer que combine com as abas.
Comparativo: https://claude.ai/artifact/KZaj2T8WSBU8fi42XFhJSB

## Abordagens

- **A · ⋯ dentro da cápsula das abas**, pelo slot `end` do `TabsList`.
- **B · ⋯ num círculo ao lado com a pele das abas** — **escolhida pelo dono**:
  o `Button variant="floating"` que já existe (`bg-popover`, anel de 1px, como
  a moldura das abas), com a `shadow-sm` dele, que as abas não têm (tirá-la
  mudaria o design system).

## O que muda

- `MenuMaisAcoes` (`src/components/transactions/transacoes-toolbar.tsx`) ganha
  a prop `variant?: "tertiary" | "floating"` (padrão `"tertiary"`), repassada
  ao `Button` do gatilho. A barra do telefone (`TransacoesToolbar`) passa
  `variant="floating"`; o ⋯ do cabeçalho do desktop (`page-client.tsx`) segue
  terciário.
- O tamanho segue `icon-md`: 44 no toque, a altura da moldura das abas.
- Teste de fonte em `page-client.test.ts` tranca `variant="floating"` no ⋯ da
  barra do telefone.

## Não metas

- Mudar `src/components/ui/` (o `floating` fica como está, com a sombra).
- O "+" ao lado das abas de Categorias (outra peça, com fundo próprio).
- O desktop.

## Conferir

A 375px em Transações: o ⋯ redondo, de 44, com o mesmo fundo e contorno das
abas; tocar abre Importar extrato e Exportar CSV. No desktop o ⋯ do cabeçalho
segue sem fundo.
