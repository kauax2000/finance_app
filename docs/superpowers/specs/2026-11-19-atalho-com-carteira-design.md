# Atalho com carteira, um de cada modo — desenho

Data: 19/11/2026 · Branch `finance-app-2.0` · Aprovado pelo dono: abordagem A.

## Por quê

A pessoa não está conectando um iPhone: está criando um atalho (voz ou toque) que lança
numa carteira. O fluxo e a lista falam de aparelho, o nome do aparelho não serve para nada
com um atalho de cada modo, e trocar a carteira hoje exige reinstalar o atalho.

## Decidido com o dono

- Um atalho de cada modo por pessoa: voz ("Lançar gasto") e toque ("Lançar gasto rápido").
- A carteira é do atalho, escolhida no guia.
- Abordagem A: a carteira muda depois, na lista, sem baixar o arquivo de novo.
- "Adicionar atalho" no lugar de "Adicionar iPhone"; o vocabulário de aparelho sai.

## Abordagens

- **A (escolhida)**: RPC nova que troca a carteira do código; "Mudar carteira" na lista.
  Custa uma migração em produção.
- **B**: carteira só no guia; trocar = refazer o atalho e reinstalar. Sem banco.

## Desenho

- **Banco** (migração nova, aditiva, compatível com o front de `main`):
  - `create_capture_token(p_workspace_id, p_name, p_gatilho text default null)`: grava
    `atalho_gatilho` já na criação (`siri` ou `toque`). A assinatura de dois argumentos sai
    (o `default` atende quem chama sem o terceiro).
  - `set_capture_token_workspace(p_id uuid, p_workspace_id uuid)`: só o dono do token,
    ativo, e só para carteira de que ele é membro (`nao_membro`).
- **Guia** (`GuiaDoAtalho`):
  - Título "Adicionar atalho".
  - Passo 2 vira "Escolha a carteira": o seletor sempre à vista (com uma carteira só, o nome
    dela sem escolha). O campo de nome sai; o nome gravado é o do atalho do modo
    ("Lançar gasto" / "Lançar gasto rápido").
  - Um de cada modo: ao criar, se já existe atalho ativo daquele modo, o novo o substitui
    (desconecta o antigo depois de criado, como o "Baixar de novo"). O passo 2 avisa
    "Substitui o seu atalho de voz atual." quando for o caso.
- **Lista** (`AtalhoSecao`):
  - Título da seção "Atalhos"; linha "Adicionar atalho"; ícone do modo (microfone/toque).
  - Título da linha: o nome do atalho pelo gatilho; token antigo sem gatilho mostra o nome
    gravado. Legenda: carteira · último gasto.
  - Menu ⋯ ganha "Mudar carteira" (só com mais de uma carteira): diálogo com o seletor.
  - Textos: "Desconectar este atalho?", "Limite de 10 atalhos…", "Não foi possível listar os
    atalhos.", erro de nome some.
- **Voltar no topo** (pedido do dono no meio da conversa; regra de aplicar a todo componente
  igual): nos guias de passos — `GuiaDoAtalho`, `GuiaDoApplePay`, `ConectarIaDialog`,
  `InstallPwaSheet` — o rodapé fica só com a ação de seguir. O voltar vira o ‹ no canto de
  cima à esquerda (padrão do Importar: `Button tertiary icon-md` com `ChevronLeftIcon`,
  `absolute top-2.5 left-2.5 z-20`, `aria-label="Voltar"`), do segundo passo em diante. No
  desktop o "Voltar" segue no rodapé como `FormCancel` (o DS o esconde na gaveta com ✕), e o
  ‹ aparece só no telefone (`useIsMobile`). O Voltar invisível que guardava a altura do
  rodapé sai.
- **Docs**: `JORNADAS.md`, `atlas/template.html` + `build.py`, republicar o Atlas.

## Fora

- A falha da Siri ("não consegue abrir o atalho"): espera os dados do dono (frase, bloqueio,
  nome no app Atalhos, se abre tocando).
- Arquivos `.shortcut`, Edge `capture`.

## Verificação

`conta.test.ts`, `tsc`, `lint`, `ds:audit` de `src/components/account`; migração aplicada em
produção só com o ok do dono; no iPhone, o dono cria os dois atalhos e muda uma carteira.
