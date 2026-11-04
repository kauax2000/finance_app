# Atalho do iPhone com formulário — design

Data: 2026-11-03. Pedido do dono: "adicione uma feature onde eu posso escrever, usar um atalho para escrever, igual o aplicativo de referência" (YouTube Shorts `BNdO9TV-ZCE`, o SyncSpend). E: "Ele tem que servir para a versão de formulário, quando o lançamento inteligente não estiver funcionando, e para a versão do lançamento inteligente."

## A referência

O SyncSpend é um app nativo e publica no app Atalhos uma ação "Add Expense" com Título, Valor, Conta, Categoria, Forma de pagamento e Data, e "Mostrar ao executar" ligado. Ao rodar, o iPhone pergunta campo a campo, a começar por "What's the amount?" no teclado numérico. O vídeo termina ligando o atalho ao **Toque traseiro** (Ajustes › Acessibilidade › Toque › Toque traseiro › Toque triplo › Add Expense). O vídeo não tem fala.

O Finance é web: não publica ação própria no Atalhos. O mesmo efeito sai do atalho "Lançar gasto" que já existe (`scripts/atalho/gerar-atalho.py`, baixado no `GuiaDoAtalho`), com perguntas nativas (Pedir Entrada, Escolher da Lista) e listas que vêm do app.

## Intenção

Lançar um gasto em segundos pelo iPhone, de dois jeitos, no mesmo atalho:

- **Frase** (lançamento inteligente ligado): o que existe hoje, "Qual foi o gasto? Ex.: 42 mercado nubank".
- **Formulário** (lançamento inteligente desligado, ou a frase não deu certo): valor no teclado numérico, descrição, categoria da lista, forma de pagamento da lista e data.

## Decisões do dono

1. **O modo segue a preferência da conta.** O interruptor "Lançamento inteligente" hoje vale só no aparelho (`localStorage`, `src/hooks/use-lancamento-inteligente.ts`); passa a valer na conta. Ligado, o atalho pede a frase; desligado, pede o formulário. **Se a frase não for entendida, o atalho cai no formulário** na mesma execução.
2. **Campos do formulário**: valor (sempre, teclado numérico), descrição, categoria, forma de pagamento e data.
3. **Como abrir o atalho: a pessoa escolhe.** O guia mostra as formas (Siri, Botão de Ação, Toque traseiro, tela de início) e ensina a escolhida.

## O que muda

### Conta
- `user_settings.lancamento_inteligente boolean not null default true` (migração nova). O app lê e grava aí; o `localStorage` deixa de ser a fonte.
- Migração de quem já desligou: no primeiro carregamento com sessão, um `"0"` no `localStorage` grava `false` na conta e o valor local sai.
- O interruptor continua em Configurações e em Você › Neste celular, com o texto dizendo que vale na conta inteira, inclusive no atalho do iPhone. *(Decisão de onde ele mora: do construtor, sem tirar de onde está.)*

### Edge `capture`
- **`GET`** com o mesmo `Authorization: Bearer fac_…` devolve as opções do formulário, da carteira padrão do token:
  `{ modo: "frase" | "formulario", categorias: [{ id, nome }], pagamentos: [{ id, nome }] }`.
  - `categorias`: as de despesa da carteira, em ordem alfabética.
  - `pagamentos`: os cartões ativos da carteira (`id` do cartão, `nome` dele), depois `pix`, `debit_card` e `cash` com os nomes "Pix", "Débito" e "Dinheiro".
  - Erro de token, plano ou membro: o mesmo do `POST`, com `resumo` "Não lançado: …".
- **`POST`** aceita, além do contrato atual (`text`, `amount`, `merchant`, `card`, `date`, `id`, `source`), `category` (id de categoria) e `payment` (id de cartão, ou `pix`, `debit_card`, `cash`). Com `amount` e `category`, o lançamento é do formulário: entra sem "a conferir" e com a categoria e a forma escolhidas; `merchant` vira a descrição (sem descrição, o nome da categoria). Categoria ou cartão de outra carteira, ou inexistente: 422 com um `erro` em português.
- O `resumo` continua sendo o texto da notificação ("Gasto lançado: …" / "Não lançado: …").

### Atalho "Lançar gasto" (versão 2)
- Com **Entrada do atalho** (Apple Pay): igual a hoje.
- Sem entrada:
  1. `GET` das opções. Falhou (sem rede, servidor antigo): segue como **frase**.
  2. `modo = frase`: pede a frase e manda como hoje. Se a resposta for o erro de valor não entendido, **abre o formulário** com as opções já lidas.
  3. `modo = formulario`: Pedir Entrada **Número** "Qual o valor?"; Pedir Entrada Texto "Descrição (opcional)"; Escolher da Lista "Categoria" (os nomes); Escolher da Lista "Forma de pagamento"; Escolher do Menu "Data": **Hoje** / **Outro dia** (este abre Pedir Data). Manda `amount`, `merchant`, `category`, `payment`, `date`, `source: "shortcut"`.
  4. Mostra a notificação com o `resumo`.
- `gerar-atalho.py` gera e assina a versão 2; `--verificar` confere os dois caminhos.

### Guia "Conectar o iPhone" (`GuiaDoAtalho`)
- O passo da Siri vira **"Como abrir o atalho"**: a pessoa escolhe entre Siri, Botão de Ação, Toque traseiro e tela de início, e o passo mostra só as instruções da escolhida. Toque traseiro: Ajustes › Acessibilidade › Toque › Toque traseiro › Toque triplo › Lançar gasto.
- O texto do guia diz que o atalho pergunta a frase ou o formulário conforme o lançamento inteligente.

### Configurações › Lançar gastos pelo iPhone
- Na linha de cada aparelho já usado com o atalho antigo (resposta 7), a segunda linha diz "Baixe o atalho de novo para ter o formulário", e o ⋯ ganha "Baixar o atalho de novo", que abre o guia no passo de baixar.

## Fora
- Ação nativa no app Atalhos (exige app nativo).
- Receita pelo formulário (só despesa; a frase continua aceitando receita).
- Mudar o Apple Pay.

## Anti-objetivos
- Um formulário que salva sem confirmação do valor (o valor é sempre a primeira pergunta).
- Quebrar o atalho de quem não baixou a versão 2: o `POST` antigo continua aceito igual.
- Listas com dados de outra carteira ou de quem não é membro.

## Restrições
- O banco de desenvolvimento é o de produção: migração e Edge só vão ao ar com o pedido do dono na hora.
- Design system do `AGENTS.md`; funcionalidade nova de tela segue a regra do wireframe só se for tela nova (aqui são passos de um guia que já existe, no design system).
- Jornadas: `docs/JORNADAS.md`, o template do Atlas e a republicação.
- Testes: Deno para a Edge (`_shared/captura.test.ts`), vitest para o front, `gerar-atalho.py --verificar` para o atalho.

## Respostas da revisão (decisões minhas, marcadas para o dono conferir)

1. **"Frase não entendida" tem código estável**: toda resposta de erro leva `codigo` além de `error` e `resumo`; a frase sem valor é `codigo: "sem_valor"` (o `ERRO_VALOR`, também quando a IA foi chamada e não achou valor, ou falhou por cota). Só `sem_valor` abre o formulário; os outros erros só avisam na notificação.
2. **O atalho manda o nome, e a Edge resolve**: "Escolher da Lista" devolve o texto. O `GET` devolve nomes já únicos dentro da lista (repetido ganha o sufixo " (2)"), e o `POST` recebe `category` e `payment` como **nome**, resolvido contra a mesma lista. Nome que não está na lista: 422 `codigo: "opcao_invalida"`.
3. **Carteira**: o formulário lança sempre na **carteira padrão do token**; as listas do `GET` são só dela, e um nome fora dela é o 422 acima.
4. **Obrigatórios**: só o valor. A lista de categorias começa com **"Sem categoria"**, e a de pagamento, com **"Não informar"**. Descrição vazia vira o nome da categoria, ou "Gasto" sem categoria. A data vazia é hoje.
5. **`main` e a preferência na conta**: a versão 2 do atalho só sai com o 2.0 (o arquivo mora no front dele), e o `POST` antigo segue igual. A coluna entra com `default true` e não muda nada para quem usa o `main`. Aceitável até o 2.0 ir para `main`.
6. **Migração do `"0"`**: o primeiro aparelho que achar `"0"` grava `false` na conta, uma vez, e só se a conta ainda estiver no padrão (`lancamento_inteligente_em` nulo, coluna de quando foi escolhido). Depois a conta manda.
7. **Quem precisa baixar de novo**: o atalho v2 manda o cabeçalho `X-Atalho-Versao: 2`, e a Edge grava em `capture_tokens.atalho_versao` (nulo = v1) a cada uso. A linha "Baixe o atalho de novo" aparece só nos aparelhos com uso e versão nula.
8. **`GET` com erro de token, plano ou membro**: o atalho mostra a notificação com o `resumo` e para; só a falha de rede (sem resposta) segue para a frase.

## Do construtor
- Nomes de funções, a forma exata do JSON de opções além dos campos acima, o texto final das perguntas do atalho e o desenho do passo "Como abrir".
