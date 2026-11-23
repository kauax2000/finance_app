# A aurora da Leitura do mês, mais calma — design curto

**Por quê.** O dono achou o arco-íris da Leitura do mês evidente demais (23/11/2026). Hoje a borda em degradê dá a volta inteira no cartão e há um brilho interno nas laterais; o cartão lê como uma moldura colorida, não como um insight.

**Mockup:** `docs/design/painel/leitura-arco-iris-calmo.html`, opção **M1 · A cor só em cima** (escolha do dono).

## Abordagens
- **M1 · A cor só em cima (escolhida pelo dono, 23/11/2026):** borda neutra em volta; o degradê da borda fica só no terço de cima e some antes do meio; aurora a 55% do volume de hoje; sem o brilho das laterais.
- **M2 · Um fio de luz:** a cor só num fio de 1px no topo. Era a recomendação; o dono escolheu M1.
- **M3 · Véu de uma cor:** recusada, perde a marca no cartão.
- **M4 · A luz nasce do selo:** recusada no mockup, tinge o título.

## O que muda (`@utility brand-aurora`, `Card glow="static"`)
1. **Borda neutra em volta:** o cartão passa a mostrar o fio de `--border` nos quatro lados, como o `outline`. Como o cartão `brand` tem `overflow-clip` e o degradê mora num pseudo dentro da `padding-box`, a borda neutra e o degradê precisam ocupar o mesmo anel (o degradê por cima do neutro no topo), sem linha dupla. O caminho sugerido: manter o `border-transparent` e desenhar o neutro no mesmo anel do `::before` (por exemplo, uma `box-shadow: inset 0 0 0 1px var(--border)` no cartão, que pinta sob o pseudo de `z` negativo), ou outra solução que dê um anel só.
2. **O degradê só em cima:** o `::before` continua a borda em degradê (as três cores do humor), mas a máscara da primeira camada vai de opaco no topo a 35% aos 22% da altura e a transparente aos 50% (`linear-gradient(#000 0%, rgb(0 0 0 / 0.35) 22%, transparent 50%)`), com `opacity: 0.8`. Embaixo do meio, só o neutro.
3. **O brilho interno das laterais** (`box-shadow` inset colorido) sai.
4. **A aurora** (`::after`) fica na mesma geometria e mais fraca: `--brand-aurora-opacity` vai de 1 a **0,55** no escuro e de 0,55 a **0,3** no claro. Os três humores e as paradas não mudam.
5. Contraste: rodar `scripts/tone-contrast.mjs` (a aurora só fica mais fraca; o número deve subir) e anotar o pior caso no comentário do token e no AGENTS.md.

## Registro
- Página `/designsystem/card` ("Marca acesa"): o texto que fala da borda.
- AGENTS.md: o bullet do `Card` (`glow="static"`) e o da lista de exceções do arco-íris sob texto, com o novo volume e o pior contraste.
- `brand-contour.test.ts` e `card-versions.test.ts`: trocar o que trancava a borda em degradê e o `border-transparent` pelo fio e a borda neutra.
- Rodada em `docs/design/HISTORICO-DESIGN-SYSTEM.md`.

## Fora
- O selo ✦ (os mockups G1–G5 seguem sem escolha).
- O conteúdo do cartão.
