# Aurora: o acabamento

Data: 22/11/2026 · Escopo: `ThemeToggle reveal` · Tamanho: mudança pequena · Continua a
[aurora pela borda do tema](2026-11-21-aurora-pela-borda-do-tema-design.md) (rodada 411)

## Intenção

O dono pediu as sete melhorias propostas para a aurora B. Protótipo:
`scratchpad/proto/v3.html` ("Nova" × "Atual (B)"), quadros a 30% conferidos sem cabeça
(Playwright).

## O que muda

1. **A cor anda colada na borda.** A ponta da frente da faixa acompanha a borda o caminho
   inteiro (`desce`: `translateY(y - 0,92·faixa)`; `sobe`: `y - 0,08·faixa`), e depois da
   varredura ela passa 0,1 tela e some. Hoje ela fica 0,2 tela para trás.
2. **O aro aceso.** Um traço fino na própria onda, na cor clara da paleta
   (`color-mix(in oklch, <a terceira parada> 45%, white)`), com 1,5px de borrão e um halo de 6px
   na mesma cor: um elemento de 0,4 tela de altura com a onda como `mask-image` (`repeat-x`,
   `vector-effect: non-scaling-stroke`, traço 3), que anda com a borda e desliza com ela. Some
   depois da varredura.
3. ~~A página velha afunda~~ — **recusada pelo dono** (22/11): a página velha não escurece nem
   se afasta; a foto velha fica parada.
4. **Um ritmo por sentido.** `desce` (a noite cai): 1250ms, `cubic-bezier(0.55, 0, 0.15, 1)`;
   `sobe` (o sol nasce): 950ms, `cubic-bezier(0.3, 0, 0.2, 1)`. A varredura continua em 60%.
5. **A parada tocada acende.** Durante a troca a parada do destino ganha
   `view-transition-name` (só na troca) e fica por cima, viva; um anel de 3px na terceira parada e
   um halo de 18px na primeira acendem até 25% e somem. Some no fim, com o nome.
6. **Tocar de volta no meio inverte.** Se a pessoa toca a parada de onde veio enquanto a troca
   anda, o tema volta já (o DOM vivo está escondido sob a transição) e todas as animações da troca
   tocam ao contrário de onde estão; no fim, a página viva é a de antes. Tocar uma terceira
   parada (sistema) no meio segue a regra de hoje.
7. **A onda sem emenda.** O caminho ganha um período a mais de cada lado
   (`M-100 150 Q-75 144 -50 150 T0 150 … T300 150`), fechado em `-100`.
8. **Ondas curtas, não uma curva só.** Com um período por largura de tela, a borda lia como a
   quina de um cartão indo para trás (o dono, 22/11). A imagem da máscara e a do aro medem
   **2/3 da largura** (três ondas por tela, `repeat-x`), o deslize lateral anda na mesma escala
   (`-0,8` e `-1,2` metades da imagem) e a amplitude cai à metade (controle em 144, não 138).

## Decisões minhas (o dono pode corrigir)

- Os números acima são os do protótipo.
- O vidro do WebKit continua só com a máscara (sem aro): a foto dele é pequena e o
  efeito some no meio do vidro.
- Movimento reduzido, `reveal={false}` e sem API: troca na hora, como hoje.

## Abordagens

1. **Tudo na mesma View Transition (a escolhida)**: cada melhoria é mais uma animação no `ready`
   ou um elemento com nome só durante a troca. A volta (6) usa `Animation.reverse()` nas animações
   da troca, guardadas na `revelacao` do toque.
2. Canvas por cima da página: aro e faixa num canvas — mais controle, mas outra peça, outro
   custo de bateria e nada da máscara de hoje. Recusada.

## Registro

`lib/aurora-do-tema.ts`, `lib/vidro-na-revelacao.ts` (a onda nova), `theme-toggle.tsx`,
`globals.css` (o aro e o brilho da parada) e os testes; catálogo "A aurora", o bullet do
`ThemeToggle` no `AGENTS.md` e a rodada 412.

## Não é objetivo

- Partir do toque, mudar a paleta ou o sentido.
