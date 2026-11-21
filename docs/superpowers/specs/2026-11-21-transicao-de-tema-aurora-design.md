# Transição de tema: a aurora

Data: 21/11/2026 · Escopo: `ThemeToggle` (`reveal`) · Tamanho: mudança pequena

## Intenção

O dono quer que a troca de tema siga a gravação de 09/11/2026 (`Gravação de Tela 2026-11-09 às
11.22.15.mov`, 6s, sem áudio). Nela, uma **cortina de arco-íris borrada desce do topo** pela janela
inteira, com a borda ondulada. O tema novo surge atrás dela, e um brilho fica no pé até sumir. Hoje o
app abre um círculo nítido a partir da parada tocada, em 320ms e sem cor.

Quadro a quadro, a 25fps, a partir de t≈1,93s:

- 0–550ms: a borda ondulada desce do topo ao pé. Atrás dela vem a faixa de cor, borrada, em ~70% da
  altura: âmbar no topo, depois magenta e violeta, com o azul escuro na borda da frente.
- 550–1100ms: com o tema novo já inteiro, o resto do brilho fica no pé e esmaece.
- A cortina não parte do clique: cobre a largura inteira desde o primeiro quadro.

## Decisões do dono

- **Opção A, "Aurora do vídeo"** (protótipo comparado com a B, sóbria, e com a C, o círculo atual):
  ~1,1s, varredura em 60% do tempo, faixa de 75% da altura, opacidade 0,9.
- **Paleta "Curta"**: quatro paradas do arco-íris da marca, `--brand-amber` → `--brand-magenta` →
  `--brand-violet` → `--brand-blue`, interpoladas `in oklch`. Os tokens valem por tema (o escuro um
  degrau mais claro). Nada de cor nova.

## Decisões minhas (o dono pode corrigir)

- **A aurora substitui o círculo.** `reveal` segue booleano e ligado por padrão. A revelação circular
  e o `recorteDeFora` saem.
- **Sempre do topo**, como no vídeo, em qualquer lugar do seletor (desktop ou a página Você no
  telefone).
- **Movimento reduzido, `reveal={false}` ou navegador sem View Transitions**: troca na hora, como
  hoje.

## Abordagens

1. **View Transition com máscara ondulada (a escolhida).** É a mesma transição de hoje. No lugar do
   `clip-path: circle()`, o `::view-transition-new(root)` ganha um `mask-image` (um SVG com a borda
   ondulada e borrada), cuja posição desce. A faixa de cor é um elemento fixo criado dentro do
   callback, com `view-transition-name: theme-aurora` **só durante a troca**, para ser desenhada por
   cima das duas fotos. A animação dela vai no `::view-transition-new(theme-aurora)`. Prós: é fiel
   ao vídeo (o tema novo aparece de fato atrás da borda), reaproveita o `flushSync` e o vidro na
   revelação, e não deixa nada permanente. Contra: é preciso trocar o recorte do vidro no WebKit.
2. **Cortina sem View Transition**: a faixa cobre a tela, o tema troca por baixo e ela sobe.
   Funciona em qualquer navegador, mas é outro gesto: cobre e descobre, em vez de revelar atrás da
   borda. Descartada.
3. **Canvas ou WebGL**: lava de verdade, ao custo de código e de bateria, só por uma troca de 1s.
   Descartada.

## Desenho

- **`src/lib/aurora-do-tema.ts`** (novo, puro e testável):
  - `AURORA = { duracao: 1100, varredura: 0.6, faixa: 0.75, opacidade: 0.9, easing:
    "cubic-bezier(0.45, 0, 0.2, 1)" }`;
  - `mascaraDaAurora(invertida?)` devolve o `url("data:image/svg+xml,…")` da borda ondulada. A
    versão invertida guarda o que fica **abaixo** da borda, para a foto velha do vidro;
  - `quadrosDaMascara(alturaDaTela, deslocamento = 0)` e `quadrosDaFaixa(alturaDaTela)` devolvem os
    `Keyframe[]`;
  - `animarAurora(html, alturaDaTela, vidros)` anima a raiz, a faixa e cada vidro com o mesmo
    tempo;
  - `criarFaixa(doc, alturaDaTela)` cria o elemento da faixa e devolve como removê-lo.
- **`theme-toggle.tsx`**: em `trocar`, sai a conta do raio e da origem. O `ready` chama
  `animarAurora`, e a faixa nasce no callback do `startViewTransition`, junto com o `setTheme`. O
  `finished` a remove. As guardas de hoje ficam: o duplo toque e o `finally` de uma troca pulada.
- **`lib/vidro-na-revelacao.ts`**: no WebKit, `revelarVidros` passa a aplicar a máscara deslocada
  por `rect.top`. A nova vai na foto nova do vidro, e a invertida na velha. O `recorteDeFora` sai.
- **`globals.css`**, no escopo `.theme-reveal`: a `@utility theme-aurora` (posição fixa, sem
  ponteiro, o degradê das quatro paradas com `blur`, a ponta de baixo ondulada por `border-radius`)
  e o `::view-transition-group(theme-aurora) { animation: none }`.
- **Exceção nomeada ao "arco-íris sob texto"**: a aurora passa por cima do texto durante ~1s e não
  é lida. O volume mora em `AURORA.opacidade`, nunca nas paradas. Ela entra no `AGENTS.md` junto
  das outras exceções.

## Catálogo e registro

- `/designsystem/theme-toggle`: a seção "A revelação circular" vira "A aurora" (texto, exemplo,
  `PropsTable`).
- `AGENTS.md`: o bullet do `ThemeToggle` e a lista de exceções do arco-íris.
- `docs/design/HISTORICO-DESIGN-SYSTEM.md`: uma rodada.
- Testes: `aurora-do-tema.test.ts` (quadros, máscara, a faixa sem nome permanente);
  `theme-toggle.test.ts` e `vidro-na-revelacao.test.ts` ajustados.
- Nenhuma jornada muda (`JORNADAS.md` fica como está).

## Fica para quem constrói

- O desenho exato da onda do SVG e o `blur`, para casar com o protótipo
  (`scratchpad/proto/index.html`).
- A conferência na prévia: claro → escuro e escuro → claro, no desktop e a 375px (a página Você).

## Não é objetivo

- Mudar o trilho, o polegar ou os tamanhos do `ThemeToggle`.
- Animar outras trocas (carteira, idioma).
