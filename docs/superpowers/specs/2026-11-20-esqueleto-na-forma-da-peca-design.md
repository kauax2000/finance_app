# Esqueleto na forma da peça — desenho curto

Data: 20/11/2026. Abordagem escolhida pelo dono: **C**.

## Por quê

No carregamento, o esqueleto das abas e do botão do topo de Transações é um quadrado arredondado
(`rounded-row-lg`), e a peça de verdade é cápsula e círculo. O `Skeleton` nasce `rounded-md`, e
toda tela que não escreve o raio desenha um quadrado onde a peça é outra forma. O dono quer que
todo esqueleto, em toda tela, aba e componente, tenha a forma da peça que ele guarda.

## O que muda

- **`Skeleton` ganha duas formas** (`src/components/ui/skeleton.tsx`; mudança em `ui/` autorizada
  pelo dono ao escolher C):
  - `shape="control"`: cápsula (`rounded-full`) na escada de controle — `xs` 24, `sm` 28, `md` 32,
    `lg` 36 (o padrão), `xl` 40 — e, como o `Button`, `md`/`lg`/`xl` sobem a 44 no toque
    (`pointer-coarse:h-11`). A largura é de quem chama; o botão de ícone escreve `aspect-square`
    e vira círculo no mesmo degrau (inclusive nos 44 do toque).
  - `shape="surface"`: o raio do `Card` (`rounded-surface`), para cartão e painel.
- **Todas as telas e os esqueletos de `ui/`** passam a usar a forma da peça:
  - botão, campo, busca, aba, trilho de abas, `Select`, pílula de filtro → `control`
    (botão de ícone com `aspect-square`);
  - cartão, painel, tabela → `surface`;
  - avatar → `circle`; ladrilho de cor → `tile`; chip → `pill`; texto → `text`;
  - o resto continua `block`, com o degrau de raio da peça real (`rounded-row`, `rounded-row-lg`…),
    nunca um raio que a peça não tem.
  - A altura do esqueleto segue a da peça (incluindo o piso de 44 no toque) para a tela não pular
    quando o dado chega.
- **Registro**: a página do `Skeleton` no catálogo mostra as duas formas; o bullet do `Skeleton` no
  AGENTS.md cita `control` e `surface`; o `skeleton.test.ts` confere a escada da forma `control`.

## Não muda

O pulso, o `SkeletonGroup`, o padrão `block` e o desenho das peças reais.

## Abordagens

1. A — corrigir tela por tela à mão, sem forma nova: a próxima tela repetiria o erro.
2. B — formas novas + migração + teste que tranca esqueleto de controle sem cápsula.
3. **C — formas novas + migração, sem o teste-tranca: escolhida.**

## Fica com quem constrói

O mapeamento de cada esqueleto à peça real, lendo a tela pronta ao lado; os casos em que a peça
real não é óbvia ficam `block` com o raio dela, anotados no relatório.
