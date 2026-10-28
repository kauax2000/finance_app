# Lançamento inteligente — o gesto e o painel aprovados (2026-10-28)

Aprovado pelo dono quadro a quadro nos protótipos
`.superpowers/brainstorm/71215-1793194303/content/gesto-inteiro-v5.html`
(telefone) e `gesto-desktop.html` (desktop). Este documento substitui a
coreografia de `2026-10-28-lancamento-inteligente-morph.md`. A lógica
(`use-leitura-do-lancamento.ts`, parser, IA, foto, `salvar()`) não muda.

## Repouso

- Telefone: a pílula da frase (48 de altura, `SearchInput` vidro `modal`, com
  o feixe `command-beam` — já no app) e, 8px à direita, a pílula redonda da
  câmera (48). A linha fica 12px acima do teclado (viewport visual), ou 12px
  acima da área segura sem teclado.
- Desktop: a mesma linha no centro alto da tela, 448 de largura somando o
  campo e a câmera.

## O gesto (t = 0 é o Enter, ou o fim da leitura da foto)

1. **Colar (0 → ~248ms).** É a busca do telefone fechando, com o código dela:
   `quadroDasBolhas(m, p)` + o desenho das bolhas, `p` de 1 a 0 na
   `VOLTA_DA_PILULA` (320ms, `[0.2, 0, 0, 1]`). `m = { lupa: campo, deX: a
   câmera colada no campo (8px à esquerda), pilula: campo, x: câmera }`. As
   duas bolhas ganham a tinta do voo (`TINTA_DO_VOO`), a câmera é puxada
   (escala da direita, aperto vertical `ACOPLAMENTO_Y`), a cintura fecha. O
   conteúdo do campo (a frase) **fica visível e parado**; o ícone da câmera sai
   por `f.icone` (desfoque 6, escala 0,7). O teclado desce no mesmo instante
   (o campo perde o foco).
   - **Enquanto o vão é zero, um vidro só**: a união de `contornoDaUniao`
     (exportada de `ui/command.tsx`), com um contorno; o campo e a câmera param
     de pintar vidro. Nada de fio na costura.
2. **Absorver (~248 → ~508ms).** Quando `p ≤ 0,02`: a câmera some e o vidro do
   campo vira uma cápsula só, alargada até a ponta da câmera (mesma tinta, mesmo
   contorno — a troca não se vê). A ponta direita recua até a do campo:
   `clip-path: inset(0 ${48·u}px 0 0 round 24px)`, `u` em 260ms na curva
   `[0.4, 0, 0.2, 1]`. Sempre redonda, nenhum canto do campo à mostra.
3. **Abrir (a partir de u ≥ 0,75, ~373ms).** O campo vira o painel de revisão:
   um vidro só, revelado por `clip-path` do retângulo do campo (C) ao do painel
   (F).
   - Altura na `MOLA` (rigidez 300, amortecimento 25), largura na
     `MOLA_PALCO` (220, 30) — dois `animate` do `motion`.
   - Telefone: a borda de baixo sai do campo e a de cima sobe; desktop: a borda
     de cima fica presa e o painel cresce para baixo.
   - Raio de 24 ao `rounded-modal` (28) acompanhando a altura.
   - A tinta do voo some quando a altura passa de 85%.
   - **A frase** (a cópia dela no lugar do campo) sai no desfoque: opacidade e
     desfoque 8px por `suave(py, [0, 0,28])`, subindo 35% do que a borda de cima
     subiu.
   - **O conteúdo anda com o vidro**: `translate(centroAgora − centroFinal,
     topoAgora − topoFinal)`, inclusive no passe da mola.
   - **As peças chegam em cascata, no lugar**: 28ms entre elas, só opacidade e
     desfoque 10 → 0 (sem subir), começando quando a altura passa de 12% (~33ms
     depois do início de abrir) e com a última terminando quando as duas molas
     assentam (~465ms). Duração de cada uma = `max(160, assenta − começa − (n−1)·28)`.

Fechar (Esc, véu, depois de Aprovar): o caminho curto de hoje (o painel recolhe
e some com `menu-unmorph`). Movimento reduzido: troca no esmaecer de
`--duration-fast`, sem viagem.

## O painel (versão A do protótipo, "lista agrupada")

De cima para baixo, com peças do design system:

- **×** num círculo no canto de cima à direita (`DialogCloseButton` ou `Button
  tertiary icon-md`).
- **O tipo** numa pílula pequena com ponto colorido: "Parcelada · por causa de
  “10x”" (`Badge` soft com `BadgeDot`).
- **O valor em destaque**: `MoneyDisplay` grande (o "R$" menor), números
  tabulares; abaixo, uma linha `muted`: "10× de R$ 300,00 no Inter" (parcelada),
  ou a descrição e a forma nos outros tipos.
- **A lista agrupada** (os campos): `ItemGroup` numa superfície
  `bg-foreground/5`, `rounded-row-lg`, linhas de 50 com divisória recuada; cada
  linha: ladrilho do ícone 28 colorido por campo (`ItemMedia variant="tile"`
  com tom), rótulo, valor `muted` à direita e `ItemChevron`. O que falta mostra
  "Escolher" no tom de aviso. Linhas: Descrição, Categoria, Cartão/Forma,
  Data (ou "Primeira cobrança" na parcelada), Parcelas (só na parcelada) e Tipo
  (pode ficar no topo como a pílula do item anterior; tocá-la edita o tipo).
- **Editar**: tocar numa linha abre o editor dela no lugar, como hoje.
- **Aprovar**: botão `primary` na largura toda (o maior degrau da escada; 44 no
  toque). Abaixo, "Formulário completo" `tertiary`.

Medidas finais: telefone, o painel com 16 de calha dos dois lados, a borda de
cima na área segura de cima + 16 no mínimo; desktop, 448 de largura.
