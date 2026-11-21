# Aurora pela borda do tema

Data: 21/11/2026 · Escopo: `ThemeToggle reveal` · Tamanho: mudança pequena · Parte da
[aurora](2026-11-21-transicao-de-tema-aurora-design.md) (rodada 410)

## Intenção

O dono pediu as cinco melhorias propostas para a aurora e, comparando no protótipo
(`scratchpad/proto/v2.html`: A abre do toque, B da borda pelo tema, C a atual, D onda circular),
escolheu a **B**: a direção carrega sentido, a borda é viva, a paleta segue o destino e a faixa
pesa menos.

## O que muda

- **Direção pelo destino**: indo ao **escuro**, a borda **cai do topo** (a noite cai); indo ao
  **claro**, **sobe do pé** (o sol nasce). Tema "sistema" segue o tema que resulta.
- **Paleta pelo destino**, só tokens da marca: ao claro, quente (`--brand-amber` →
  `--brand-coral` → `--brand-magenta`); ao escuro, fria (`--brand-violet` → `--brand-indigo` →
  `--brand-blue`). `in oklch` por `@supports`, sRGB antes.
- **Borda viva**: a onda é periódica (dois períodos na largura da imagem, `repeat-x`) e anda de lado
  enquanto a borda desce ou sobe: `-0,8 · largura` no fim da varredura, `-1,2 · largura` no fim.
- **Mais leve**: a faixa cai de 75% para **60% da altura**, o borrão de 36px para **24px**, a
  opacidade de 0,9 para **0,85**.
- Tempo igual: 1100ms, varredura em 60%, a mesma curva.

## Decisões minhas (o dono pode corrigir)

- **A onda do toque (melhoria 1) sai**: a B não parte do seletor, por escolha do dono.
- **A imagem da máscara mede 3 alturas**, com a borda no meio, para cobrir a janela inteira no
  começo e no fim nos dois sentidos (a lição da rodada 410: imagem curta deixa a foto velha
  aparecer na ponta).
- **O vidro do WebKit** recebe a mesma máscara, deslocada pela caixa dele; a foto velha recebe a
  imagem do lado oposto (`acima` ↔ `abaixo`), que é o complemento exato na mesma geometria — o
  truque das 4,8 alturas sai.
- O que fica da rodada 410: o nome só durante a troca, a faixa que sai 50ms antes do fim, as
  guardas do toque duplo, a troca na hora com movimento reduzido, a exceção ao "arco-íris sob
  texto".

## Abordagens

1. **B · da borda pelo tema (a escolhida)**: uma borda, sentido pelo destino.
2. A · duas bordas do toque: liga o gesto ao dedo, mas briga com o sentido (as duas bordas
   andam). Recusada no protótipo.
3. D · onda circular do toque: perde o sentido (círculo não sobe nem desce). Recusada no protótipo.

## Registro

- `src/lib/aurora-do-tema.ts`, `src/lib/vidro-na-revelacao.ts`, `theme-toggle.tsx`, `globals.css`
  e os testes deles.
- Catálogo `/designsystem/theme-toggle` (seção "A aurora"), o bullet do `ThemeToggle` no
  `AGENTS.md` e a rodada 411 no histórico.
- Conferir no navegador: claro → escuro (cai do topo, fria) e escuro → claro (sobe do pé, quente).

## Não é objetivo

- Partir do toque, mudar o seletor, mudar a duração.
