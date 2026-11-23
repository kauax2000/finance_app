# A aurora da Leitura do mês, mais calma — design curto

**Por quê.** O dono achou o arco-íris da Leitura do mês evidente demais (23/11/2026). Hoje a borda em degradê dá a volta inteira no cartão e há um brilho interno nas laterais; o cartão lê como uma moldura colorida, não como um insight.

**Mockup:** `docs/design/painel/leitura-arco-iris-calmo.html`, opção **M2 · Um fio de luz**.

## Abordagens
- **M1 · A cor só em cima:** borda neutra, o degradê só no terço de cima, aurora a 55%. Recusada: a borda colorida ainda desenha os cantos.
- **M2 · Um fio de luz (escolhida, por recomendação; o dono pediu o fluxo sem escolher):** borda neutra em volta; a cor vira um fio de 1px no topo, que some nas pontas; a aurora fica mais baixa e mais estreita.
- **M3 · Véu de uma cor:** recusada, perde a marca no cartão.
- **M4 · A luz nasce do selo:** recusada no mockup, tinge o título.

## O que muda (`@utility brand-aurora`, `Card glow="static"`)
1. **Borda:** o cartão volta à borda neutra do `outline` (`border` em `--border`, com `bg-clip-padding`); sai o `border-transparent` do composto `brand` + `static` em `card.tsx`.
2. **O fio:** o `::before` deixa de ser a borda em degradê e passa a ser uma linha de 1px colada ao topo de dentro, de 12% a 88% da largura, no degradê das três cores do humor (`--aurora-l`, `--aurora-c`, `--aurora-r`), sumindo para transparente nas pontas (0 → 25%, 75% → 100%), com `opacity: 0.85`.
3. **O brilho interno das laterais** (`box-shadow` inset) sai.
4. **A aurora** (`::after`) fica mais estreita, `inset: -40% 5% 50% 5%`, e mais fraca: `--brand-aurora-opacity` vai de 1 a **0,4** no escuro e de 0,55 a **0,3** no claro. Os três humores e as paradas não mudam.
5. Contraste: rodar `scripts/tone-contrast.mjs` (a aurora só fica mais fraca; o número deve subir) e anotar o pior caso no comentário do token e no AGENTS.md.

## Registro
- Página `/designsystem/card` ("Marca acesa"): o texto que fala da borda.
- AGENTS.md: o bullet do `Card` (`glow="static"`) e o da lista de exceções do arco-íris sob texto, com o novo volume e o pior contraste.
- `brand-contour.test.ts` e `card-versions.test.ts`: trocar o que trancava a borda em degradê e o `border-transparent` pelo fio e a borda neutra.
- Rodada em `docs/design/HISTORICO-DESIGN-SYSTEM.md`.

## Fora
- O selo ✦ (os mockups G1–G5 seguem sem escolha).
- O conteúdo do cartão.
