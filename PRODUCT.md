# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Pessoas no Brasil cuidando do próprio dinheiro e do dinheiro da casa. O uso é
diário e curto — lançar uma despesa no caixa do mercado, conferir quanto falta
para a fatura fechar — com sessões longas pontuais (fechar o mês, montar
orçamento). O app é compartilhado: uma carteira pode ter mais de uma pessoa,
por convite, e quem convida costuma ser quem organiza as contas da família.

O aparelho principal é o telefone, muitas vezes em movimento e com rede ruim.

## Product Purpose

Juntar num lugar só as quatro coisas que hoje moram em aplicativos e planilhas
diferentes: os lançamentos da carteira, as faturas dos cartões de crédito, as
contas a pagar e as assinaturas. Sucesso é a pessoa saber, sem fazer conta,
quanto entrou, quanto saiu e o que ainda vai sair neste mês.

## Positioning

A fatura de cartão de crédito no modelo brasileiro é cidadã de primeira classe:
ciclo com estados **Aberta**, **Fechada** e **Anterior**, compra parcelada que
cai nas faturas certas, e a fatura fechada virando conta a pagar. Conta paga,
assinatura cobrada e parcela viram lançamento sozinhas — o dinheiro entra na
carteira pelo caminho que ele realmente percorre, e não por digitação dupla.

Carteira compartilhada por convite, com papéis, é o outro eixo: a maioria dos
concorrentes é de uma pessoa só.

## Operating Context

- Português do Brasil e Real (BRL) em toda a interface e em todo dado.
- PWA: instalável, offline-first. Cache de consultas em IndexedDB (Dexie), fila
  de escrita offline, notificações push.
- Supabase: o navegador fala direto com o banco. A segurança real dos dados é a
  RLS; regras de negócio moram em triggers, RPCs e Edge Functions.
- Tema claro e escuro, escolhidos pela pessoa, com paridade obrigatória.
- Onze jornadas mapeadas em `docs/JORNADAS.md`, publicadas como o Atlas de
  Jornadas. Mudou o caminho de uma tela, o documento muda junto.

## Capabilities and Constraints

- **Não há gate no servidor.** Sem `middleware.ts`, sem rotas de API, sem
  cliente Supabase de servidor. Quem decide acesso é o `AuthGuard`, no
  navegador; o que protege dado é a RLS.
- Conta nova dispara o trigger `handle_new_user`, que cria perfil, a carteira
  pessoal e 12 categorias (7 de despesa, 5 de receita).
- Sessão é por aparelho e pode ser revogada de outro aparelho; o app confere na
  abertura e a cada renovação do token.
- Design system fechado: 79 componentes em `src/components/ui/`, tokens em
  `src/app/globals.css`, catálogo vivo em `/designsystem`. Zero literal de cor
  ou medida na tela. Ícones só do Heroicons.
- Autenticação é e-mail e senha. **Login social foi retirado** em set/2026.
- O template de e-mail do Supabase (código ou link de recuperação) é
  configurado fora deste repositório e não está sob controle de versão.

## Brand Commitments

- O nome escrito é **Finance**. O lockup é o `AppWordmark`; o símbolo sozinho é
  o `AppLogo`.
- A marca é preta e branca: `--primary` é a tecla preta (branca no escuro) e
  `--primary-accent` coincide com `--foreground`. A única cor da marca é o
  arco-íris (`--brand-rainbow`), e ele mora só nas peças de marca — o
  wordmark, o campo de marca e as variantes `brand` —, uma por tela.
- Tipografia: Inter (`--font-sans`), Ledger (`--font-display`, restrita a
  `.page-title` e `.wordmark`), Geist Mono (`--font-mono`).
- Não existe logo, símbolo, ilustração ou cor de marca além disso. O que uma
  tela precisar a mais se autora com os tokens existentes.

## Evidence on Hand

Nenhum depoimento, estudo de caso, número de clientes, benchmark, preço ou
imprensa existe. **Nada disso pode ser inventado.** Dado de demonstração numa
superfície pública é permitido, autorado com fidelidade e rotulado como
exemplo; alegação comercial, não.

A prova genuína disponível é o produto em si: as telas reais e os componentes
do design system.

## Product Principles

1. **O dinheiro chega pelo caminho que percorreu.** Conta paga, assinatura e
   parcela viram lançamento; a pessoa não digita a mesma despesa duas vezes.
2. **A carteira é de mais de uma pessoa.** Toda tela precisa continuar
   verdadeira quando duas pessoas mexem na mesma carteira.
3. **O telefone é o aparelho, não a versão reduzida.** Área de toque, área
   segura e rede ruim são o caso normal.
4. **O design system é a régua.** Divergência entre tela e sistema, vence o
   sistema; melhoria aprovada vira componente ou token, nunca estilo solto.
5. **Caminho mudou, mapa muda junto.** `docs/JORNADAS.md` e o Atlas fazem parte
   da mudança, não do depois.

## Accessibility & Inclusion

WCAG AA como piso medido, não declarado: contraste de texto conferido nos dois
temas, foco visível em todo controle, alvo de toque de 44px em apontador
grosso, e movimento reduzido respeitado.

Uma divergência consciente e documentada: o contorno de campo identifica o
controle a 1,3:1, contra os 3:1 da 1.4.11. A decisão e o caminho de volta estão
no `AGENTS.md` e no ladrilho `--input` de `/designsystem/colors`.
