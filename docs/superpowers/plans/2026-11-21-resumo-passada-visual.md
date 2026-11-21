# Aba Resumo — passada visual contra o mockup

Data: 21/11/2026. Referência: `.superpowers/brainstorm/75919-1795230631/content/resumo-v2.html` (aprovado). Tela real: `/categories/fdc3a58a-7d80-4cc6-a0ee-a92148f53820?type=expense&month=2026-11` (Carro), blocos em `src/components/categories/detail/resumo/`.

**Autorização permanente do dono (AGENTS.md, invariante 6):** altere e melhore o design system onde for preciso para chegar ao mockup, registrando a mudança completa (registry/docs/teste do componente). A tela real não pode sair mais pobre que o mockup.

## Diferenças medidas (real × mockup) e o que fazer

1. **Frase de resumo** — real: cartão chapado, ícone cinza pequeno, texto `text-lg` comprido em cinza. Mockup: cartão com leve degradê, ícone num ladrilho na cor da categoria, texto maior e os números em destaque brancos.
   → Ladrilho do ícone na cor da categoria (`ColorTile tint="soft"` com `categories.color`), texto `text-xl` (telefone `text-base`) com `text-pretty`, partes fortes em `text-foreground font-semibold` e o resto em `text-muted-foreground`. Superfície do cartão: se o `Card` não tiver uma superfície de destaque sutil, crie uma variant (ex.: `variant="tinted"`) no design system.
2. **Gráficos com eixo Y poluindo** — real: "R$ 3,8 mil / R$ 2,85 mil / …" em todos. Mockup: sem eixo Y, só a média rotulada.
   → Tire o eixo Y dos cinco gráficos (o valor vai no tooltip); mantenha o eixo X curto.
3. **Últimos 12 meses** — real: área barrenta e opaca, 5 meses zerados achatando a curva. Mockup: área com degradê que some até a base, ponto no último mês.
   → Degradê vertical da cor da categoria (opacidade ~0,45 → 0); comece a série no primeiro mês com gasto (no mínimo 3 meses); ponto marcado no mês aberto. Se o `ChartArea` não faz degradê, acrescente no design system.
4. **Ritmo do mês** — real: linha em degraus, eixo Y. Mockup: linhas suaves; novembro sólido na cor da categoria com ponto no fim; outubro tracejado cinza.
   → Curva `monotone`, sem eixo Y, ponto no último dia com dado.
5. **Dias da semana e Tamanho das compras** — real: barras verdes (`--chart-1` é verde, e verde lê como "entrada"). Mockup: barras cinza e a maior na cor da categoria.
   → Barras em `--muted` (ou equivalente neutro) e a barra de destaque (`selected`) na cor da categoria. Atualize a regra de cor no AGENTS: a cor da categoria vale em traço, área **e no destaque de barra** desta tela.
6. **Como foi pago** — real: rosca grande sem números e legenda solta embaixo. Mockup: rosca menor ao lado de uma legenda com nome, valor e %.
   → Rosca ~96px com o total no centro (`ChartDonutCenter`) e, ao lado, a lista (cor, nome, valor, %), mesmo no cartão de 1/3. Se a legenda `list` do `ChartDonut` quebra por olhar a janela e não o cartão, conserte no design system com container query.
7. **Cartões do gasto** — real: ícone pequeno cinza e rótulo em MAIÚSCULAS (`StatCardLabel` eyebrow). Mockup: ladrilho de 36px colorido (cada cartão um tom) e rótulo em frase normal.
   → Ladrilho colorido por cartão (laranja da categoria, azul, roxo, verde da paleta de ladrilhos `TILE_PALETTE`/`ColorTile`), rótulo em frase normal. Se o `StatCard` não deixa escolher o tom do ícone por cartão nem o rótulo sem eyebrow, acrescente as props no design system.
8. **Insights** — real: ladrilhos neutros/apagados. Mockup: verde (boa notícia), âmbar (atenção), azul (informação).
   → Acrescente o tom `success` ao `ItemMedia variant="tile"` no design system e use os três tons.
9. **Parcelas e O que se repete** — real: o trilho de passos cinza. Mockup: passos na cor da categoria.
   → Passos feitos na cor da categoria (via `Progress` com cor por variável, se o componente permitir; senão acrescente).

## Como terminar
- Checks: `npm run ds:audit`, `npx tsc --noEmit && npm run lint && npm run test:unit`.
- Screenshot da tela real a 1440px e 375px ao lado do mockup; listar o que ainda difere e corrigir.
- Commits separados: design system (com docs/teste) e tela.
