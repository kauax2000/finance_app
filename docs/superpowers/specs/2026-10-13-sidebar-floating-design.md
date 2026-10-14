# A barra lateral do app flutua

Data: 2026-10-13 · Rodada 261 do design system

## Intenção

A barra lateral do app, no desktop, deixa de ser rente (`variant="sidebar"`,
com `border-r`) e passa a ser a placa solta do design system
(`variant="floating"`): raio modal (28), `--sidebar` chapado, anel de 1px e
`shadow-lg`, a 8px da borda. O `floating` é o padrão do `Sidebar` desde a
rodada 221. O app tinha ficado rente por decisão do dono, e essa decisão agora
se inverte.

## Decisões do dono (2026-10-13)

- **A barra do topo é a que o DS já prevê ao lado do `floating`.** A `TopBar`
  continua larga, sem fundo em repouso, e vira vidro quando a tela rola
  (`surface="scroll"`). Ela não vira `TopBar variant="floating"`.
- **Recolhida, a barra fica em ícones, como hoje** (`collapsible="icon"`). O
  gatilho entra na placa, sob o `SidebarHeader`, e não há `peek`.

## O que muda

### 1. A troca

Em `src/components/layout/app-sidebar.tsx`,
`<Sidebar collapsible="icon" variant="sidebar">` passa a ser
`<Sidebar collapsible="icon" variant="floating">`.

O componente já faz o resto sozinho, pelos seletores de irmão do
`SidebarInset` (`src/components/ui/sidebar.tsx`):

- a placa fica a 8px da borda (`py-2 pl-2`);
- a `TopBar` não pinta em repouso, e o vidro do `scroll` rolado continua;
- o fio de baixo da `TopBar` vai a 0 (`--sidebar-inset-rule`);
- o `SidebarTrigger` vira uma pílula da mesma placa, a 8px dela
  (`SIDEBAR_TRIGGER_GAP`);
- recolhida em ícone, o gatilho viaja para dentro da placa, sob o
  `WorkspaceSwitcher`, que já monta o `SidebarHeader`.

### 2. A conferência do que o app escreve em volta

Cada item é medido no navegador antes de qualquer edição. Só um defeito
visível justifica mudar alguma coisa, e a mudança fica no arquivo da tela,
nunca em `src/components/ui/`.

- O `-ml-2` do `SidebarTrigger` em `app-header.tsx`. O catálogo usa o mesmo
  `-ml-2`, e o `-ml-4` do `floating` aberto vem de um seletor mais
  específico. A medida esperada é o gatilho a 8px da placa.
- O recuo do conteúdo em `sidebar-app-shell.tsx` (`md:p-6`) ao lado da placa.
- O "+ Adicionar" (`QuickActionButton variant="sidebar"`), o seletor de
  carteira e o perfil, com a barra aberta e recolhida.
- Os dois temas. O `--sidebar` é `oklch(0.97 0 0)` sobre `--background`
  `oklch(0.985 0 0)` no claro e `oklch(0.205 0 0)` sobre `oklch(0.145 0 0)`
  no escuro. Separam a placa o anel e a sombra.

Se algo exigir mudança em `src/components/ui/` ou em `globals.css`, o
trabalho para e a proposta vai ao dono (invariante 6 do `AGENTS.md`).

### 3. A trava e a documentação

- `src/components/ui/sidebar-versions.test.ts`: o caso "o app fica rente"
  passa a exigir `<Sidebar collapsible="icon" variant="floating">` e muda de
  nome. O arquivo fica em `ui/` e o harness pede confirmação.
- `AGENTS.md`, em `Sidebar`: "`sidebar` (a do app)" sai, e o `floating`
  passa a ser descrito como o do app.
- `docs/design/HISTORICO-DESIGN-SYSTEM.md`: a rodada 261 registra a
  inversão, as duas decisões e o que a conferência mediu. A frase "O app
  continua rente" da rodada 221 é histórico e fica onde está.
- O Atlas e o `docs/JORNADAS.md` não mudam. Nenhuma rota, destino nem passo
  muda, então isto não conta como mudança de jornada.

## Fora do escopo

- O telefone. O app não abre a barra lateral lá: a navegação é a
  `BottomBar`, e nada chama `setOpenMobile`. O `floating` viraria
  `Sheet variant="floating"`, mas ninguém chega a ele.
- A cor da placa (`--sidebar`), a `TopBar floating` e o `peek`.
- A página do `Sidebar` no catálogo, que já mostra o `floating` como padrão.

## Cuidado com a árvore de trabalho

Outra sessão trabalha no `Showcase` neste mesmo repositório e commita em
paralelo, e pode sujar `AGENTS.md` e `HISTORICO-DESIGN-SYSTEM.md` a qualquer
momento. Os commits deste trabalho incluem só os trechos dele. Se o arquivo
já tiver trechos de outra pessoa, o patch é montado com `git diff` e aplicado
com `git apply --cached`, sem `git add` do arquivo inteiro. O número da
rodada é o próximo livre no histórico na hora de escrever: 261 se ninguém o
tomou antes.

## Verificação

- `npx tsc --noEmit && npm run lint && npm run test:unit`.
- `npm run ds:audit -- src/components/layout/app-sidebar.tsx`, e também nos
  arquivos de `layout/` que forem tocados.
- No app, em 1440×900: aberta, recolhida e rolada (para ver o vidro), nos
  temas claro e escuro. As medidas, lidas por `getComputedStyle` e
  `getBoundingClientRect`, são a calha de 8px, o gatilho a 8px da placa, a
  `TopBar` transparente em repouso e o fio a 0. O painel do navegador
  precisa estar visível para as capturas. Só se navega e lê: o banco é o de
  produção.

## Critério de pronto

No desktop, a barra lateral do app é a placa flutuante, aberta e recolhida,
nos dois temas, sem sobreposição nem calha dupla. A barra do topo segue a
regra do `floating`. Os testes passam e a trava exige o `floating`.
