# Mobbin — concorrentes brasileiros e bancos BR

Estudo de 2026-10-28, Mobbin MCP (só `ios` e `web`).

## Cobertura

| App | Resultado | Buscas feitas |
| --- | --- | --- |
| Mobills | **não existe** | "Mobills expense tracker home screen", "Mobills" (ios) |
| Organizze | **não existe** | "Organizze home screen" (ios, vazio), "Organizze dashboard" (web) |
| Optio | **não existe** | coberto pelas buscas genéricas em português; nada voltou |
| Minhas Economias | **não existe** | idem |
| Olivia | **não existe** | "Olivia AI money assistant" (voltou X e Copilot) |
| Guiabolso | **não existe** | "Guiabolso" (voltou X e Swiggy) |
| Nubank | **não existe** | "Nubank credit card bill screen", "Nubank home screen" (vazio), "Nubank website" (web) |
| Inter | **não existe** | "Banco Inter home screen" |
| PicPay | **não existe** | "PicPay home screen" (vazio) |
| Mercado Pago | **não existe** | "Mercado Pago wallet home", "Mercado Pago" |
| C6 Bank | **não existe** | "C6 Bank home screen" (vazio) |
| Itaú | **não existe** | "Itaú home screen" (vazio) |
| **iFood** | **existe (iOS, em português)** | achado por "app in Portuguese Brazilian reais R$ balance" (deep) |

Quando a busca nomeia um app que o Mobbin tem, ela filtra para ele (Splitwise, Klarna e
Monzo voltaram só deles). Resultado vazio ou de outros apps com o nome na busca é sinal
forte de ausência. Nenhum app de finanças ou banco brasileiro está no Mobbin hoje.

O único app brasileiro achado é o **iFood**, que não é finanças, mas mostra como o
brasileiro vê **Pix, R$ e resumo de valores** num app de massa. Ficou como referência de
convenções locais.

## iFood (iOS) — convenções brasileiras de pagamento

- [Pix — aguardando pagamento](https://mobbin.com/screens/ce273e23-f973-4e95-b84a-0e191789910b):
  ilustração, título "Aguardando pagamento", instrução de usar o Pix Copia e Cola, o
  código truncado numa caixa com ícone de copiar, contagem regressiva grande ("06h 44min")
  com barra vermelha, card do item com total "R$ 3,00", aviso de que a compra é
  cancelada se o tempo esgotar, botão cheio "Copiar Código" e link "Pagar com banco
  parceiro". Variante com a ilustração inteira:
  [Pix — aguardando (topo)](https://mobbin.com/screens/e21db016-f3dd-4ec3-9b6b-0c6aed1ad0c4).
- [Formas de pagamento](https://mobbin.com/screens/dd9bacb4-51cc-4a96-8a83-6562dbffef02):
  abas "Pague pelo app / Pague na entrega", "Saldo da carteira R$ 0,00" com switch, lista
  Apple Pay · PIX (selecionado, borda vermelha) · "Nubank — Pagamento pelo app do Nubank".
  Nubank aparece como **forma de pagamento**, com logo, ao lado do Pix. Variante com
  toast "Cartão salvo com sucesso":
  [formas após salvar cartão](https://mobbin.com/screens/f9b8b705-0bf4-4098-a44d-d1d8e0ee7110).
- [Pagamentos — histórico de transação](https://mobbin.com/screens/1d3ccd69-c58a-45b3-a1ab-652c5ced7823):
  linhas com nome do estabelecimento, "Pedido nº 9393 - 19/04/2025 às 21:14" e valor à
  direita ("R$ 141,41"); uma linha é "Gorjeta para quem fez a Entrega". Topo da mesma
  tela: [saldo e formas](https://mobbin.com/screens/c57e14e0-5bc1-4296-95a4-bd462debfacb)
  (Saldo disponível R$ 0,00, "Cadastrar novo cartão", atalhos circulares "Resgatar iFood
  Card", "Habilitar Biometria", "Meus cupons", "Reembolso em Saldo"; a primeira linha do
  histórico mostra "NUBANK" como meio).
- [Sacola — resumo de valores](https://mobbin.com/screens/d301c547-08a1-4239-8953-7133c524c9f9):
  "Pagamento pelo app: PIX — Trocar", cupom aplicado, "Resumo de valores" (Subtotal, Taxa
  de entrega, Taxa de serviço com ícone de ajuda, Cupom em verde negativo "- R$ 10,00",
  Total em negrito), "CPF na nota", CTA "Revisar pedido • R$ 52,89".
- [Detalhes do pedido](https://mobbin.com/screens/d1c1b8c0-c511-4369-b9bd-c7fe898ef7dd):
  status "Pedido concluído às 21:22" com check verde, item, "Resumo de valores" com o
  desconto em verde, "Pago pelo app" com bandeira do cartão.

### Para nós

- **Copiar**: o formato de valor do brasileiro é "R$ 52,89" com vírgula decimal e data
  "19/04/2025 às 21:14" — o iFood confirma que o histórico mistura número do pedido, data
  e hora numa linha só de legenda. **julgamento**: nosso extrato pode usar a mesma
  legenda curta (origem · data às hora) sem parecer estrangeiro.
- **Copiar**: desconto como linha negativa em verde dentro do resumo, total em negrito
  embaixo. É a mesma leitura que um estorno na fatura deveria ter. **julgamento**.
- **Copiar**: Pix com código copiável + contador + CTA "Copiar código". Se um dia
  mostrarmos "pagar a fatura por Pix" ou cobrar o plano por Pix, o usuário já conhece essa
  tela.
- **Notar**: Nubank aparece como meio de pagamento pelo nome e logo. Para a pessoa, o
  "cartão" é o banco. **julgamento**: identificar cartões pelo emissor com o logo (Nubank,
  Inter…) bate com o modelo mental mais do que "Mastercard final 1234".
- **Evitar**: o vermelho de marca do iFood em tudo (CTA, seleção, barra do contador).
  Num app de dinheiro, vermelho é saída/erro; nosso design system já separa estado e
  dinheiro.
- **Lacuna do Mobbin**: fatura do Nubank, Pix de banco, onboarding de banco BR e os
  concorrentes diretos (Mobills, Organizze, Optio) não estão no Mobbin. Para eles, o
  estudo precisa de captura própria (aparelho real ou App Store/Play screenshots).

## Arquivos baixados

Pasta `brasil/`

| Arquivo | Tela |
| --- | --- |
| `pix-ifood-aguardando-ios.webp` | [Pix — aguardando](https://mobbin.com/screens/ce273e23-f973-4e95-b84a-0e191789910b) |
| `pagamento-ifood-formas-ios.webp` | [Formas de pagamento](https://mobbin.com/screens/dd9bacb4-51cc-4a96-8a83-6562dbffef02) |
| `extrato-ifood-historico-ios.webp` | [Histórico de transação](https://mobbin.com/screens/1d3ccd69-c58a-45b3-a1ab-652c5ced7823) |
| `resumo-ifood-sacola-ios.webp` | [Sacola — resumo de valores](https://mobbin.com/screens/d301c547-08a1-4239-8953-7133c524c9f9) |
