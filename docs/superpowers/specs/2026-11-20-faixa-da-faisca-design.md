# A faísca na faixa de cima — desenho curto

Data: 20/11/2026. Aprovado pelo dono.

## Por quê

A faísca dos cartões de Categorias usa a altura inteira do pé do cartão. Quando o gasto cai, a linha desce até a base e, no telefone, passa por cima do botão "Ver lançamentos". O dono quer menos oscilação, com a base mais alta e o botão sempre legível dentro do gráfico.

## O que muda

- **`ChartSparkline` ganha `band?: number`** (de 0 a 1, desligado por padrão). É a fração da altura, a partir do topo, que a linha pode ocupar.
  - Com `band`, um `YAxis` escondido fixa o domínio em `[max − (max − min) / band, max]`. O mínimo da série fica na base da faixa e o máximo no topo, e embaixo dela sobra área cheia.
  - Os valores de `min` e `max` incluem a `reference` (a média), para a linha tracejada caber na faixa.
  - Se `max === min`, a linha fica reta no topo da faixa, sem divisão por zero.
  - Vale em `line` e `area`. Em `bars` é ignorado.
  - Sem `band`, nada muda nos outros gráficos do app.
- **Os cartões de despesa e de receita passam `band={0.45}`.** No telefone (104px) a linha fica nos ~47px de cima, e o botão de 44px, a 10px do pé, fica sempre sobre a área cheia. No desktop (64px) a linha fica nos ~29px de cima.
- **Registro:** um teste em `chart-versions.test.ts`, a página do `Chart` no catálogo e a linha do `ChartSparkline` no AGENTS.md. A mudança em `ui/` foi autorizada pelo dono.

## Abordagens

1. **Faixa de cima (`band`): escolhida.**
2. Só aumentar a altura: a linha continuaria descendo até o botão.
3. Pôr fundo no botão: o dono quer o botão fantasma.
