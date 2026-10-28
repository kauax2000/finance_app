# Lançamento inteligente — design

Data: 2026-10-27 · Bloco 3 (captura) · substitui a "Frase rápida" e a "Foto do
recibo" que hoje moram, em wireframe, dentro do formulário de lançamento.

## Por quê

A frase rápida é a feature que mais diferencia o app: lançar um gasto em uma
linha, sem formulário. Hoje ela é uma caixa tracejada em cima de um formulário
de 10 campos, e a pessoa ainda tem de conferir campo a campo e apertar
"Salvar". O dono quer que ela seja a porta de entrada: **um campo só**, no
estilo da paleta de comandos, que entende tudo sozinho (despesa, receita,
parcelada, estorno, cartão, categoria, data), mostra o que entendeu num lugar de
revisão onde cada item se edita, e lança com uma aprovação. A foto do recibo
entra no mesmo campo.

## Nome

**Lançamento inteligente** (decisão do executor; o dono sugeriu "descrição
inteligente" ou outro). Cobre frase **e** foto, e diz o que faz.

## Objetivos

1. Um interruptor em **Configurações** liga e desliga o lançamento inteligente.
2. Ligado, **criar** um lançamento (o "+ Adicionar", o "Nova transação" da
   tela de transações e o da categoria) abre a paleta inteligente em vez do
   diálogo com formulário.
3. A paleta: uma pílula de texto com o feixe de marca; abaixo, a **revisão**:
   uma linha por informação entendida (tipo, valor, descrição, categoria,
   forma/cartão, data, parcelas), cada uma editável, e a ação "Lançar".
4. Decide sozinha o **tipo**: despesa, receita, parcelada ou estorno — e diz
   por quê ("Parcelada · por causa de "em 10x"").
5. **Foto do recibo** no mesmo campo: botão de câmera, colar (⌘V) e arrastar
   uma imagem. A IA lê; a foto vira anexo depois de lançar.
6. Mais inteligente que hoje (ver "Inteligência").
7. Saída sempre à mão: **"Abrir formulário completo"** leva o que foi
   entendido para o formulário clássico.
8. O formulário clássico **perde** a frase rápida e a foto do recibo (a feature
   mora só na paleta). Edição continua sempre no formulário.

## Não-objetivos

- Lançar várias transações numa frase só.
- Voz.
- Edge `capture` (atalho do iPhone/WhatsApp): só herda as melhorias do parser
  compartilhado; **não** se faz deploy de Edge nesta mudança.
- Preferência sincronizada pela conta (fica no aparelho, como o tema e a busca
  do cabeçalho; sem migração no banco de produção).

## Anti-objetivos (falha mesmo funcionando)

- Lançar algo que a pessoa não viu: **nada salva sem a revisão à vista** e um
  gesto de aprovar (Enter na ação "Lançar" ou toque nela).
- Um caminho de salvar paralelo ao do formulário: a paleta usa o **mesmo**
  `useTransactionForm` (validação, parcelado, estorno, anexo, `source`).
- Gastar a cota da IA (30/dia) enquanto a pessoa digita.

## Como fica (decidido pelo executor)

### Superfície

`CommandDialog` do design system, variante `panel` (pílula + placa + dock), com
`shouldFilter: false`. No desktop, centrada como a busca; no telefone, a barra
do topo da paleta com a placa embaixo (o comportamento que o `CommandDialog` já
tem). O feixe (`command-beam`) é a peça de marca da tela.

- **Pílula**: placeholder que diz o formato — "Ex.: 42 mercado nubank". O
  ícone da esquerda é o brilho (`SparklesIcon`); no `leading` aparece a
  miniatura da foto quando há uma.
- **Placa** (`CommandList`), de cima para baixo:
  1. Vazio (nada escrito): três exemplos tocáveis ("42 mercado nubank",
     "salário 5000 dia 5", "tv 3000 em 10x no inter") que escrevem a frase, e a
     linha "Fotografar recibo".
  2. Com frase: a **linha de ação** em destaque — "Lançar despesa · R$ 42,00"
     (o verbo e o tipo mudam: "Lançar receita", "Lançar parcelada · 10× de
     R$ 300,00", "Lançar estorno") — selecionada por padrão, para o Enter
     aprovar.
  3. O grupo **"Entendi"**: uma linha por campo (`CommandItem` com
     `CommandItemIcon`, rótulo à esquerda, valor em `CommandItemMeta`, seta
     `CommandItemArrow`). Campo com dúvida leva um `Badge` `warning`
     "Confira"; o que veio da IA leva "IA". O tipo mostra o motivo.
  4. Para parcelada, o quadro de impacto (`ImpactoDaParcela`, já existente).
  5. "Abrir formulário completo".
- **Dock** (`CommandDock`): "↵ Lançar", "↑↓ Campos", "Recibo" (câmera),
  "Esc Fechar".

### Editar um campo

Enter (ou toque) numa linha de campo abre uma **página** da paleta
(`useCommandPages`); a pílula vira o editor daquele campo, com o escopo à
esquerda (`CommandScope`, "Categoria"), e Backspace no vazio / Esc volta.

| Campo | Página |
| --- | --- |
| Tipo | lista: Despesa, Receita, Parcelada, Estorno |
| Valor | a pílula recebe o número (dinheiro em BRL); Enter confirma |
| Descrição | a pílula recebe o texto; Enter confirma |
| Categoria | lista das categorias do tipo, filtrada pelo que se digita (`commandFilter`) |
| Forma | lista: Pix, Débito, Crédito (um item por cartão ativo), Dinheiro |
| Data | lista: Hoje, Ontem, Anteontem; ou digitar "dia 5", "05/03", "sexta" (o parser de datas) |
| Parcelas | a pílula recebe o número (2–48); lista com 2, 3, 6, 10, 12 |

Uma edição feita à mão **vence** a frase: reescrever a frase não desfaz o campo
editado (o campo fica "travado" até a pessoa limpar a frase).

### Lançar

Enter na linha de ação (ou toque). Se falta algo obrigatório (valor; cartão
quando é crédito e há cartões), a ação fica desabilitada com o motivo
("Falta o valor") e o Enter vai ao campo que falta. Salvando: `Spinner` na
linha, paleta trava (`pending`). Sucesso: fecha, toast de sempre (com o
"Desfazer" se o fluxo atual tiver). Erro: fica aberta com a mensagem.

### Foto

Botão no dock, ⌘V de imagem e soltar arquivo na paleta. Comprime
(`comprimirImagem`), mostra a miniatura na pílula e uma linha "Lendo o recibo
com IA…" no lugar da revisão; ao voltar, preenche os campos (como
`camposDaIA`). O texto escrito completa a foto (regra atual). Remover a foto:
× na miniatura.

### Interruptor

Configurações › seção **"Lançamento"** (nova, abaixo de Aparência): um
`FormSwitch` "Lançamento inteligente" com a descrição "Escreva ou fotografe e o
app preenche tudo. Desligado, o + Adicionar abre o formulário." Vale **neste
aparelho** (localStorage, mesmo padrão de `useBuscaDoCabecalho`). **Padrão:
ligado** (decisão do executor; uma constante troca).

O compartilhar do Android (`?frase=` / foto) abre **sempre** a paleta, ligado
ou não: quem compartilha já escolheu a frase.

## Inteligência

Hoje: parser local (`_shared/frase.ts`) + histórico (descrição → categoria e
cartão) + categorias por nome + IA por botão quando falta valor. Muda:

1. **IA automática, nunca enquanto digita**: ao apertar Enter com o valor ou a
   descrição em dúvida, a paleta chama a IA sozinha (sem botão "Tentar com
   IA"), mostrando "Lendo com IA…". Cota esgotada ou sem rede: a mensagem
   atual e a revisão como está.
2. **Prévia ao vivo**: o parser local roda a cada tecla (é síncrono); o
   histórico carrega quando a paleta abre, não no foco.
3. **Dias da semana**: "sexta", "na segunda", "sábado passado" → a ocorrência
   mais recente até hoje (hoje, se for o dia).
4. **Mais receita**: "ganhei", "vendi", "reembolso", "rendimento",
   "dividendos", "pix de <nome>" / "pix do/da <nome>" no começo → receita.
5. **Tipo com motivo**: o parser devolve por que decidiu o tipo (a palavra que
   decidiu), e a revisão o mostra.

Corpus mínimo que tem de passar (além dos casos de `frase.test.ts`):

| Frase | Esperado |
| --- | --- |
| `sexta 30 pizza` (hoje = quarta 2026-10-28) | despesa, 30, data 2026-10-23 |
| `sábado passado 80 bar` | despesa, 80, data do sábado anterior |
| `ganhei 200 aposta` | receita, 200, "Aposta" |
| `vendi bicicleta 900` | receita, 900, "Bicicleta" |
| `reembolso 45 uber` | receita, 45, "Uber" |
| `pix do joão 150` | receita, 150, "João" |
| `rendimento 12,30` | receita, 12,30 |
| `tv 3000 em 10x no inter` | parcelada, total 3000, 10, cartão inter |
| `estorno ifood 25 nubank` | estorno, 25, cartão nubank |

## Restrições

- `AGENTS.md`: nada em `src/components/ui/` nem `globals.css` sem
  autorização. A paleta é **composição** de peças existentes num arquivo em
  `src/components/transactions/`. Se uma peça faltar (ex.: `leading` da pílula
  não aceitar a miniatura), a alternativa é sem ela (miniatura vira uma linha
  na placa), não mexer em `ui/`.
- Formulários: a paleta não é `<form>`; a ação primária é um `CommandItem`
  (o cmdk já impede o Enter nativo). O hook passa a expor `salvar()`, e o
  `handleSubmit` do formulário chama o mesmo `salvar()`.
- Mudança de jornada: `docs/JORNADAS.md`, `docs/atlas/template.html`,
  `python3 docs/atlas/build.py` e republicar o Atlas no mesmo URL.
- Banco de produção: nada grava em teste manual sem pedido; sem migração.
- Edge Functions: sem deploy.
- Wireframes: `frase-rapida-wireframe.tsx` e `foto-recibo-wireframe.tsx`
  saem; a lógica que vale (pedido numerado, foto inicial, cartão lembrado,
  `planoDaFrase`) vai para um hook `useLeituraDoLancamento` em
  `src/components/transactions/`.
- Testes que hoje exigem os wireframes no formulário
  (`frase-no-form.test.ts` L258, `form-ia.test.ts` L164) passam a exigir a
  paleta no `TransactionFormDialog` e a ausência no formulário.

## Arquitetura (decisão do executor)

- `TransactionFormDialog` chama `useTransactionForm` uma vez e escolhe a
  casca: criação + ligado (ou compartilhar) + `!usarFormulario` →
  `<LancamentoInteligente form={…} />`; senão o `Dialog` de hoje. "Abrir
  formulário completo" troca a casca **sem perder o estado** (mesmo hook).
- `useLancamentoInteligenteLigado()` em `src/hooks/` (cópia do padrão da busca).
- `useLeituraDoLancamento` (novo): frase → `CamposDaFrase` ao vivo, IA
  automática, foto, travas de campos editados à mão; aplica no hook do
  formulário por `aplicarFrase`/`aplicarFoto` e pelos setters de `fieldsProps`.
- `LancamentoInteligente` (novo): só apresentação (paleta, páginas, dock).
- Parser: `supabase/functions/_shared/frase.ts` (dias da semana, receita,
  motivo do tipo), com testes em `src/lib/captura/frase.test.ts`.

## Deixado ao construtor

Textos finos, ícones Heroicons de cada linha, a ordem exata das linhas além de
"ação primeiro", e o detalhe do arrastar-soltar.
