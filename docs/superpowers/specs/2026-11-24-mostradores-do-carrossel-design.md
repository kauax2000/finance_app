# Mostradores do carrossel de insights — design curto

**Data:** 24/11/2026 · **Tela:** detalhe da categoria, cartão de insights · **Mockup:** `docs/design/painel/insights-mostradores.html`. O dono escolheu a opção A.

## Por quê

Os mostradores de hoje têm três problemas:
- os pontos parecem soltos (8px de ponto com 24px de alvo cada, o que deixa um vão de 16px entre eles);
- o ativo só muda de cor;
- a seta da ponta (‹ no primeiro) quase não apaga: o `tertiary` desabilitado fica a 50%.

## Abordagens

- **A · Pílula ativa (escolhida).** O ativo vira pílula, e a seta sem destino apaga.
- **B · Contador "1 de 2" numa cápsula.** Descartada pelo dono.
- **C · Barras no topo.** Descartada pelo dono.
- **D · Pílula com as setas numa cápsula.** Descartada pelo dono.
- **E · Só a pílula, sem setas.** Descartada pelo dono.

## Desenho

1. **A pílula.** No `InsightsDaCategoria`, `<CarouselDots variant="pill" />`. A variant já existe no `Carousel` do design system: o ativo com 24×8, os outros com 8×8.
2. **A seta da ponta.** Fora da sobreposição (`placement="inline"`), a seta `tertiary` desabilitada passa a 30%, como as outras aparências (`disabled:opacity-30`). Ela continua visível e no lugar, sem pular. A mudança é no `carousel.tsx`, porque vale para todo carrossel com setas na barra:
   - a regra de hoje exclui o `tertiary` do `opacity-30`;
   - o `disabled:invisible` da sobreposição `inside` continua como está.
3. **O vão entre os pontos.** É de 16px por causa do alvo de 24px. Medir no navegador com a pílula.
   - Se ainda ler solto, o `CarouselDots` ganha `size="sm"`: alvo de 16px no mouse, 44 no toque, como hoje. O carrossel de insights passa a usar esse degrau.
   - Esse degrau entra com registry, página e teste (invariante 8). Senão, fica como está.

## Fora do escopo

- Contador.
- Setas agrupadas.
- Mudanças em outros carrosséis além da opacidade da seta desabilitada.

## Fica com quem constrói

- O teste de `carousel-versions.test.ts` que tranca o `disabled:opacity-30` do `tertiary` na barra.
- Se o item 3 entrar, o teste da escada do `size`.
