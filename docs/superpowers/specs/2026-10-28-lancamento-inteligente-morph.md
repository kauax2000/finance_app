# Lançamento inteligente — o campo vira a placa (2026-10-28)

Pedido do dono: a pessoa escreve ou fotografa **uma vez**; a animação deve ser
"extremamente orgânica e bonita", no espírito do **Liquid Glass do iOS 26**:
**o campo se transforma na placa de revisão**. No desktop a placa cresce para
baixo; no celular o campo mora **colado ao teclado** e, ao virar placa, cresce
**para cima** (para baixo ficaria atrás do teclado).

## Princípio

Um vidro só. A pílula da frase **é** a placa: não some uma e aparece outra. A
pílula da câmera é uma segunda gota que, no Enter, **se funde** à primeira
(o gesto das "duas bolhas" da busca do telefone, ao contrário). O conteúdo da
placa nunca escala: o vidro se revela por `clip-path` + `transform` (o mesmo
método do `quadroDasBolhas` em `ui/command.tsx` e de `lib/header-morph.ts`),
e as linhas chegam do desfoque, uma a uma.

## Coreografia

Tempos em ms a partir do Enter (ou do fim da leitura da foto).

| t | Telefone | Desktop |
|---|---|---|
| 0 | O teclado começa a descer (o campo perde o foco). A câmera estica na direção do campo e o "pescoço" entre as duas gotas aparece (fusão). | A câmera estica para a esquerda e se funde ao campo. |
| 0–180 | A câmera é absorvida: o vidro do campo cresce até a borda direita da linha; o ícone da câmera sai no desfoque (`quadroDaTroca`). | Igual. |
| 120–620 | O vidro sobe e cresce para cima: a borda de baixo fica presa logo acima de onde estava o teclado (acompanhando a descida dele) e a de cima corre até a área segura do topo. Durante a subida o vidro **estica** no sentido do movimento (mais alto e um pouco mais estreito, ~4%) e, ao chegar, **assenta** com um passe de mola (`SEPARACAO`). O raio vai de cápsula (`999px`) ao `rounded-surface` (22px) acompanhando a altura. | A borda de cima fica presa; o vidro cresce **para baixo** na mola **sem passe visível** (`MOLA_PALCO`), sem esticar a largura — o modal do desktop pede movimento sóbrio (memória do dono: o balanço num modal grande "lê como brinquedo"). |
| 200 | A frase vira o **cabeçalho da placa** (a mesma linha de texto, sem saltar: ela viaja junto com a borda de cima), com a câmera pequena no fim. | Igual, sem viagem (a borda de cima não se move). |
| 260→ | As linhas da revisão chegam do desfoque, de cima para baixo, 30ms entre elas (`stagger-ladder` / o `menu-content-in`). | Igual. |
| ~520 | O rodapé (Formulário completo · Aprovar) chega por último, já na posição final. | Igual. |

**Reenviar a frase** com a placa aberta não refaz a viagem: as linhas que
mudaram piscam do desfoque no lugar.

**Fechar** (Esc, véu, depois de Aprovar): o inverso curto — as linhas saem
juntas (`--duration-fast`), o vidro volta a pílula e some com o
`menu-unmorph` (210ms). Depois de **Aprovar** com sucesso o vidro encolhe
para a pílula, mostra um tique de 300ms e some (a confirmação sem toast extra
fica a cargo do construtor, se o toast atual já cobre).

**Abrir**: telefone — a linha (campo + câmera) nasce do botão "+" da barra de
baixo como uma gota que se separa em duas (a `SEPARACAO`, como o cabeçalho do
telefone faz com lupa e filtro) e pousa acima do teclado; desktop — a abertura
de hoje (mola curta).

## Teclado (telefone)

A linha mora presa ao **viewport visual** (`window.visualViewport`): a base dela
fica a 12px acima do topo do teclado e acompanha a subida e a descida dele
(o `CommandDialog` faz o mesmo internamente com `--command-search-vh`; aqui é um
hook local, fora de `ui/`). Sem teclado (foto escolhida, ou `visualViewport`
ausente), a linha fica a 12px acima da área segura de baixo.

## Movimento reduzido

Sem viagem nem estiramento: o vidro troca de forma em um esmaecer de
`--duration-fast` e as linhas aparecem juntas.

## Restrições

- Nada em `src/components/ui/` nem `globals.css` (se um keyframe novo for
  indispensável, parar e propor). Reusar `lib/spring.ts`, `lib/header-morph.ts`,
  `lib/liquid-move.ts`, `quadroDaTroca`, `menu-unmorph`.
- Um vidro animado por `motion` (`animate`), escrevendo só `transform` e
  `clip-path` (e o raio zerado no voo, como na busca) — nunca `width`/`height`
  em quadro a quadro, nunca `rAF` em laço próprio.
- O `backdrop-filter` precisa continuar valendo durante o voo: nada de
  `transform`/`opacity`/`filter` animado num **ancestral** do vidro (regra do
  AGENTS.md, "o movimento é da casca").
- Lógica, Form/Enter e testes de comportamento ficam como estão.
