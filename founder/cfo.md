# Nota do CFO (valores em R$; a ferramenta imprime "$")

- **Margem:** a R$ 14,90 por família pagante, cada família deixa **R$ 13,30**
  (89%) depois do custo variável de R$ 1,60. Esse custo inclui IA, WhatsApp,
  armazenamento, Asaas e NFS-e, mais a IA de 4 famílias grátis para cada
  pagante. Com 300 famílias pagantes, a margem é de 76%.
- **Equilíbrio:** **44 famílias pagantes** cobrem os R$ 576/mês de custo fixo.
  - A R$ 19,90, bastam 32.
  - A R$ 9,90, são precisas 69, e o ano 1 fecha no prejuízo (−R$ 479).
- **A linha a vigiar é a rampa de pagantes, não o custo da IA.**
  - Volume −20% derruba o lucro do ano 1 de R$ 3.396 para R$ 1.334.
  - Custo unitário +15% quase não mexe: R$ 3.210.
  - A IA paga barata (Gemini Flash-Lite) é segura para a margem. Responder
    todo lançamento no WhatsApp não é: ~US$ 620/mês com 1.000 usuários.
- **Caixa:** ~R$ 3.800 antes de se pagar, com retorno no mês 12 (preço de
  R$ 14,90/mês). A R$ 12,42/mês (anual de R$ 149), não há retorno no ano 1.
- **Três alavancas, medidas:**
  1. preço de R$ 19,90 no mensal: lucro do ano 1 de R$ 3.396 para R$ 7.270;
  2. contador só depois do CNPJ ter receita: −R$ 250/mês de fixo,
     equilíbrio de 44 para ~25;
  3. WhatsApp só no pago e respondendo só em erro, já embutido.
- **Validade:** os custos marcados como [estimativa] precisam de cotação
  real. Antes de mover dinheiro, confirme a estrutura, o CNPJ e os tributos
  com um contador.

# Unit economics: App de controle financeiro da família (PWA; plano Família)

Every number below comes from the input file. Nothing is looked up or guessed.

## One família pagante por mês

| line | per família pagante por mês |
| --- | ---: |
| Price | $14.90 |
| IA da família pagante (Gemini Flash-Lite + Flash na fatura) [estimativa] | -$0.14 |
| IA de 4 famílias grátis por pagante [estimativa] | -$0.22 |
| WhatsApp Cloud API, só no pago, resposta só em erro [estimativa] | -$0.19 |
| Storage e egress de anexos [estimativa] | -$0.10 |
| Asaas: cartão 2,99% + R$0,49, mix mensal/anual [estimativa] | -$0.70 |
| NFS-e Asaas R$0,49 por cobrança, mix [estimativa] | -$0.25 |
| **Contribution** (what each família pagante por mês leaves to pay the fixed costs) | **$13.30** (89%) |

## The margin that matters

Fixed costs: $576 a month (Supabase Pro (US$25) $140, Vercel Pro (US$20) $110, Domínio, e-mail transacional [estimativa] $30, Contador para CNPJ [estimativa] $250, Apple Developer (US$99/ano) rateado $46).

- **Break-even: 44 família pagante por mêss a day.** Below that you lose money every month.
- **Profit margin at your plan** (300 a day): **76%** of every sale, after every cost.
- Capacity: 1000000 a day.

## Year 1, month by month

| month | família pagante por mêss a day | revenue | profit | cumulative (after $2,140 startup) |
| ---: | ---: | ---: | ---: | ---: |
| 1 | 5 | $74 | -$510 | -$2,650 |
| 2 | 10 | $149 | -$443 | -$3,092 |
| 3 | 16 | $238 | -$363 | -$3,456 |
| 4 | 24 | $358 | -$257 | -$3,712 |
| 5 | 34 | $507 | -$124 | -$3,836 |
| 6 | 46 | $685 | $36 | -$3,800 |
| 7 | 60 | $894 | $222 | -$3,578 |
| 8 | 76 | $1,132 | $435 | -$3,144 |
| 9 | 94 | $1,401 | $674 | -$2,470 |
| 10 | 114 | $1,699 | $940 | -$1,529 |
| 11 | 136 | $2,026 | $1,233 | -$296 |
| 12 | 160 | $2,384 | $1,552 | $1,256 |

- **Year 1 operating profit: $3,396** on $11,548 of revenue.
- After the $2,140 startup spend: $1,256.
- Startup money earned back: month 12.
- Cash you need before it pays for itself: **$3,836**.

## What if

| scenario | margin at plan | break-even a day | year 1 profit |
| --- | ---: | ---: | ---: |
| Base plan | 76% | 44 | $3,396 |
| Price -10% | 74% | 49 | $2,241 |
| Volume -20% | 73% | 44 | $1,334 |
| Unit costs +15% | 75% | 45 | $3,210 |

No red flags in these numbers. They are only as good as the inputs: check every cost against a real quote.
