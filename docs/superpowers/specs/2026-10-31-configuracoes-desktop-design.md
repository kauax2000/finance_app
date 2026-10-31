# Configurações no desktop: redesign

Data: 2026-10-31. Primeira tela da revisão de telas do desktop.

## Por quê

Configurações é uma coluna de 576px e 1.878px de altura, com dez blocos em
sequência. Ela tem cinco defeitos medidos na tela e no código:

1. **O alcance não aparece.** O que vale para a carteira e o que vale só para o
   aparelho se alternam, e "Vale só neste aparelho" se repete em cada linha.
2. **Os avisos estão em três lugares**: `NotificationPreferences`, o wireframe
   do lembrete das 20h e o wireframe de insights, todos sobre o mesmo
   `notify_*` da mesma carteira.
3. **Editar a carteira está escondido** num ⋯, e é a ação principal do bloco.
4. **Cinco wireframes** ainda ocupam a tela, e a revisão de tela é o momento de
   transformá-los em design system (AGENTS.md, "Funcionalidade nova entra em
   wireframe").
5. **As peças divergem**: `App no celular` usa `CardHeader`, as outras seções
   usam `PageSection`; `FormSwitch variant="card"` é cartão dentro de cartão; há
   rótulo em caixa alta à mão; a rota não tem `loading.tsx` nem `AdiarMontagem`.

Referência: [Square](https://mobbin.com/screens/5a28ed24-8ffd-41dc-b545-226e282f9322)
agrupa linhas com chave em cartões. O comparativo de UX (§ Configurações) mantém a
divisão Carteira × Conta: Minha conta continua separada.

## Decisões do dono

- **Página única, coluna única, linhas densas** (layout C). O menu lateral com
  abas foi construído e recusado: "comandos rápidos ficarem a um clique a mais
  de distância". Nenhum comando rápido fica atrás de clique.
- **Rápidos primeiro.** Ordem aprovada no wireframe: Este aparelho, Notificações,
  Carteira, IA e privacidade.
- **Divisão e Datas abrem em diálogo**, por `Alterar`, e Editar também.
- Largura de volta aos 576px.
- Mockups no navegador antes de decidir layout.

## Objetivos

- Toda chave e toda escolha rápida a um clique, sem abrir nada.
- Reduzir a altura de 1.878px para cerca de 1.250px.
- Dizer uma vez, no topo de cada seção, onde o ajuste vale.
- Reunir tudo de notificação em um lugar.
- Tirar os cinco wireframes da tela, com o mesmo comportamento.

## Fora do escopo

- Mudar qualquer peça de `src/components/ui/` ou `globals.css`. Se algo faltar,
  para e pergunta ao dono.
- Redesenhar o telefone. Ele herda a coluna e só não pode quebrar.
- Minha conta, Membros, ou a página `/me`.
- Mudar regras de negócio, RPCs ou o que cada ajuste grava.

## Anti-objetivos

- Abas, menu lateral, acordeão, ou qualquer coisa que esconda chave atrás de clique.
- Cartão dentro de cartão, ou texto de apoio em toda linha.
- Componente declarado em `src/app/`.
- Perder o caminho "Configurar notificações" do painel de notificações.
- Gravar dado na verificação: o dev usa o banco de produção. Só tema e busca do
  cabeçalho, que são locais, podem ser alternados.

## A tela

Wireframe aprovado: `.superpowers/brainstorm/59923-1793465332/content/layout-c-completa.html`.

```
Este aparelho                    (Vale só neste aparelho.)
  Tema                                   [sistema|claro|escuro]
  Busca no cabeçalho  (lg+)              [barra|botão]
  Lançamento inteligente                 (chave)
  App no celular                         [Como instalar]

Notificações                     (Vale para você em {carteira}.)  [Ver histórico]
  Como avisar
    E-mail · Central do app · Push no dispositivo
  Sobre o quê
    Despesas de outros membros · Alertas de orçamento · Cartões: limite e
    categorias · Cartões: fatura e vencimento · Contas a pagar · Lembrete de
    itens a conferir · Insights

Carteira                         (Vale para todos em {carteira}.)
  [ícone] {nome}                         [Editar]
  Divisão / {Pote único|Dividida}        [Alterar]
  Datas e orçamento / {resumo}           [Alterar]
  Excluir carteira | Sair da carteira    [Excluir | Sair]

IA e privacidade                 (Vale para toda a sua conta.)
  Quem lê, limite e conferência
  Política de privacidade
```

### Casca

- `page-client.tsx` monta as quatro seções em `space-y` na ordem acima, sem `Tabs`.
- `settings/layout.tsx` volta a `Container` padrão (576px).
- `loading.tsx` e `AdiarMontagem` ficam; `SettingsPageSkeleton` vira uma coluna.
- Saem `secoes.ts`, `use-tela-larga.ts` e `?secao=`.
- `NOTIFICATION_PREFERENCES_HREF` volta a `/settings#notificacoes`, e a seção de
  notificações mantém `id="notificacoes"`.
- **O `AdiarMontagem` monta a página depois da navegação**, então o navegador não
  acha a âncora. `page-client` faz, ao montar, `scrollIntoView` do elemento do
  `location.hash`. A seção leva `scroll-mt` abaixo da barra do topo. Clicado já em
  `/settings`, o link rola sozinho.

### Linhas

Toda linha tem a mesma altura de ritmo, separada por `Separator`, dentro de um
`Card padding="none"` por seção. Texto de apoio só onde muda a decisão:

| Linha | Texto de apoio |
|---|---|
| Lançamento inteligente | Só no celular. |
| Push no dispositivo | O atual para bloqueado e sem suporte; o padrão é "Desligar remove este aparelho de todas as carteiras." |
| Lembrete de itens a conferir | Às 20h. |
| Insights | No máximo 3 push por semana. |
| Divisão | Pote único, Dividida, ou Ainda não disponível (sem `Alterar`). |
| Datas e orçamento | As datas e o orçamento gravados, ou "Sem datas". |

"Vale só neste aparelho" sai das linhas e fica só no cabeçalho.

### Este aparelho

`ThemeSettings` vira a seção inteira: Tema, Busca (`max-lg:hidden`), Lançamento
inteligente e App no celular. A linha do app reúne o que `PwaSettingsSection`
mostra: `Como instalar` só no iPhone fora do modo app; instalado, o texto de
instalado; nos demais, o texto do menu do navegador como apoio; `SyncStatusChip` e
o aviso de sem conexão ficam. `LancamentoSettings` e `PwaSettingsSection` somem
como blocos soltos, se nada mais os usar.

### Notificações

Um `Card` só, com "Como avisar" e "Sobre o quê" como faixas, sem caixa alta. Linhas
`FormSwitch` planas. `notify_review` e `notify_insights` entram, e os dois
wireframes saem. O tratamento de push, as mensagens e a folha de instalação ficam
iguais. "Ver histórico" é ação do cabeçalho.

### Carteira

- O `Editar` sai do cabeçalho da seção e vai para a linha da identidade.
- **Divisão** (dono, não pessoal) e **Datas e orçamento** (dono, projeto) abrem
  diálogos, com a lógica de gravação dos wireframes, em design system: `Form`,
  `FormRadioGroup`, `FormInput` por adulto, `DatePicker`, `FormInput money`,
  `FormCancel`, `FormSubmit` no rodapé. O passo da criação em
  `project-form-dialog.tsx` usa o mesmo formulário, com "Agora não" no cancelar.
- Trocar de carteira fecha esses diálogos, como os de hoje.
- Sair ou excluir fica como última linha do mesmo cartão.

### IA e privacidade

Um cartão, com o texto do wireframe e o link da política. Sem ação de gravar.

## Limpeza

- Apagar `a-conferir-lembrete-wireframe.tsx` e `ia-configuracoes-wireframe.tsx`.
- Tirar `InsightsAvisoWireframe`, `DatasDaCarteiraProjetoWireframe` e
  `ModoEPesosDaCarteiraWireframe` dos arquivos deles, preservando os outros
  wireframes que moram lá.

## Jornada

Conta como mudança de jornada: abre diálogos novos e muda ações da carteira. Na
mesma mudança: `docs/JORNADAS.md`, `docs/atlas/template.html`,
`python3 docs/atlas/build.py` e republicar o Atlas
(https://claude.ai/artifact/1N43LFYP1YSVsWaRMaNTRL).

## Verificação

- `npm run ds:audit -- src/components/settings "src/app/(app)/settings"`
- `npx tsc --noEmit && npm run lint && npm run test:unit`
- `npm run build`
- `graphify update .`
- Na prévia (`dev-attach`), em 1280px e 1024px, claro e escuro, e 375px: medir a
  altura, abrir `/settings#notificacoes` vindo de outra rota, usar "Configurar
  notificações" já em `/settings`, abrir Editar, Alterar e cancelar. Sem clicar em
  Salvar nem em chave que grave.

## Decisões de quem escreveu (não do dono)

- Âncora por efeito ao montar, porque o `AdiarMontagem` a esconderia.
- `Alterar` com resumo do valor na linha.
- Os dois diálogos com `FormSubmit` padrão: agora cada um é a ação principal da
  sua superfície.
- O aviso sobre push e "Vale para você em {carteira}".
- `Sobre o quê` e `Como avisar` no mesmo cartão.

## Deixado para quem constrói

- Divisão em arquivos dentro de `src/components/settings/`.
- A peça exata de cada faixa e de cada linha, desde que do catálogo.
