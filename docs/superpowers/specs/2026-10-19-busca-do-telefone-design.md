# Busca do telefone: a lupa vira a barra de pesquisa

Data: 2026-10-19. O dono pediu e delegou os detalhes ("pode decidir os detalhes
e seguir"). Tudo marcado **(decisão do Claude)** foi escolhido sem perguntar.

## Por quê

No telefone a paleta de busca (`CommandDialog`) abre numa gaveta de baixo. O
dono achou que "ficou nada a ver": a lupa fica no topo, e a busca aparece embaixo.
Ele quer o gesto do iOS: tocar na lupa do header e ela **se transformar** na
barra de pesquisa, no lugar onde está, já com o **teclado aberto**.

## O que muda

Só abaixo de `md` (o ramo `isMobile` do `CommandDialog`). O desktop não muda.

### A forma (decisão do Claude)

Uma camada de tela cheia (`fixed inset-0`, `z-(--z-modal)`), com três peças:

1. **O véu**: o `overlayClassName` (o véu com borrão do `Dialog`), que cobre o
   header, a página e a barra de baixo. Ele esmaece em `--duration-base`. É ele
   que "apaga" o sino, a carteira e o filtro enquanto a busca está aberta, sem
   que o header precise saber da busca.
2. **A linha da busca**, na altura da linha do header: o topo é a área segura
   (`env(safe-area-inset-top)`) mais 6px, porque a barra `sm` mede 56 e a pílula
   44. A calha é a do header, 16px. Na linha ficam:
   - **a pílula**: o `CommandInput` da pilha, superfície `modal`, altura de 44
     (o piso de toque);
   - à direita, **"Cancelar"**: um `Button variant="tertiary"` com texto, como o
     do iOS, que fecha a busca.
3. **A placa dos resultados**: o `CommandList` da pilha, 12px abaixo da linha,
   com calha de 16 e vidro modal. Ela ocupa a altura até o pé da tela menos a
   área segura de baixo (`--command-list-ceiling`), e as linhas entram em
   cascata pela `command-reveal` que já existe. A legenda (`CommandDock`) já some
   no toque.

### O gesto (decisão do Claude)

- **Abrir**: a pílula nasce no retângulo da lupa que foi tocada e se estica até
  a largura final.
  - O `left` e o `right` da pílula andam do retângulo da lupa (lido com
    `getBoundingClientRect`) até a posição final, na mola do sistema (`MOLA`, de
    `lib/spring`, pelo `animate` do `motion`).
  - A lupa da pílula fica à esquerda dela, então viaja junto com a borda
    esquerda: o círculo "estica para a esquerda", como no iOS.
  - O "Cancelar" e a placa entram esmaecendo depois de ~80ms.
- **Fechar**: o inverso, curto: a pílula volta ao retângulo da lupa em
  `SAIDA` (150ms, `--ease-in-out`), e o véu e a placa esmaecem. A camada segura
  a desmontagem pelo `presence-hold` (`--duration-fast`), como o `CommandDialog`
  do desktop.
- **Sem origem** (a busca do catálogo, ou uma lupa que não está na tela): a
  pílula entra no lugar, com `fade-in-0 zoom-in-95` na mola.
- **Movimento reduzido**: sem viagem, só o esmaecer.

### Teclado aberto

O campo recebe o foco no mesmo gesto do toque. Sem isso o iOS não abre o teclado.

- O toque na lupa muda o estado e o React confirma na mesma tarefa, porque o
  clique é um evento discreto.
- A camada foca o `input` no `onOpenAutoFocus` do Radix (`preventDefault` mais
  `input.focus()`), que roda no commit.
- O `autoFocus` do `CommandInput` da paleta do app continua.

### A API (decisão do Claude)

- **`CommandDialog origin`**: uma `React.RefObject<HTMLElement | null>` com o
  elemento de onde a pílula nasce no telefone. Ela é opcional; sem ela, a
  pílula entra no lugar.
- O ramo do telefone deixa de importar o `Drawer`.
- `data-slot`:
  - `command-search` na camada;
  - `command-search-bar` na linha;
  - `command-search-cancel` no "Cancelar";
  - `command-dialog-panel` continua na placa, se a pilha já o põe.
- **No `AppHeader`**: a lupa do telefone (a da ponta direita, sozinha ou na
  cápsula com o filtro) leva um `ref` (`lupaRef`). Ele vai à
  `AppCommandPalette` e de lá ao `CommandDialog` como `origin`.

### Fechar

São quatro saídas: o "Cancelar", Esc, escolher um resultado (o que a paleta já
faz) e tocar no véu fora da linha e da placa. Fechar devolve o foco à lupa,
como o Radix já faz. A busca começa vazia a cada abertura, como hoje.

## O que não muda

- O conteúdo, o ranqueamento e os escopos (`/transacoes`…) da paleta do app.
- O ⌘K e o desktop.
- As jornadas: a busca abre as mesmas telas, então não é mudança de jornada.

## Antiobjetivos

- A pílula não pode piscar nem pular no primeiro quadro, nem começar em outro
  lugar que não a lupa.
- O teclado não pode exigir um segundo toque.
- O header não pode ganhar um segundo estado ("modo busca"): a camada cobre o
  header, e ele não sabe da busca.
- Nada de `isMobile` nas telas: o ramo é do `CommandDialog`.

## Registro (mesma mudança)

- `src/components/ui/command.tsx`: o ramo do telefone e a prop `origin`.
- `src/components/ui/command-versions.test.ts`: a gaveta sai e a camada entra
  (sem `Drawer`, `origin`, "Cancelar", foco no `onOpenAutoFocus`).
- `src/app/designsystem/docs/command.tsx`: os dois textos que dizem "gaveta".
- `AGENTS.md` (`Command` e `TopBar`) e a rodada 337 em
  `docs/design/HISTORICO-DESIGN-SYSTEM.md`.

## Verificação

- Prévia a 375px:
  - a pílula nasce da lupa, nas telas com e sem filtro e nas subpáginas;
  - o foco fica no campo ao abrir;
  - o "Cancelar" e o Esc fecham;
  - escolher um resultado navega.
- Simulador iOS: o teclado aparece sem segundo toque, e o gesto vai da lupa à
  barra.
- `npx tsc --noEmit`, `npm run test:unit` e `npm run ds:audit` nos arquivos
  tocados.
