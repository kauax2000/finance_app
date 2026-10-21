# Nota do CFO (versão final de 21/10; valores em R$, a ferramenta imprime "$")

**Premissas:**
- **Plano:** só anual e só cartão no lançamento, 12x de R$ 29,90. Fundadores pagam 12x de R$ 19,90.
- **Custo variável:** só o gateway (12x, ~3,99% + R$ 0,49, estimado) e a nota fiscal, ~R$ 1,49 por família-mês. IA (Groq e Cloudflare) e WhatsApp custam zero dentro das cotas.
- **Custo fixo:** ~R$ 260/mês, contando domínio e contador (estimado).

| Preço por família-mês | Contribuição | Equilíbrio | Lucro no ano 1 | Retorno |
|---|---|---|---|---|
| R$ 29,90 | R$ 28,41 | 9 pagantes | R$ 18.898 | mês 6 |
| R$ 19,90 (Fundadores) | R$ 18,41 | 14 pagantes | R$ 11.148 | mês 8 |

- **A linha a vigiar é a rampa de pagantes.** Sem plano grátis, ela depende de o teste converter.
- **O que a receita paga primeiro:**
  1. Vercel Pro, obrigatório para cobrar;
  2. Supabase Pro;
  3. IA paga.
- **Atenção:** não é conselho contábil. Confirme CNPJ e tributos com um contador.

# Unit economics: App de controle financeiro da família (PWA; plano Família)

Every number below comes from the input file. Nothing is looked up or guessed.

## One família pagante por mês

| line | per família pagante por mês |
| --- | ---: |
| Price | $29.90 |
| IA: Cloudflare Workers AI no free tier (não treina) | -$0.00 |
| WhatsApp: entrada grátis; até 1.000 respostas/mês grátis | -$0.00 |
| Asaas: cartão parcelado 12x ~3,99% + R$0,49 por cobrança, rateado por mês [estimativa] | -$1.24 |
| NFS-e Asaas R$0,49 por cobrança, mix [estimativa] | -$0.25 |
| **Contribution** (what each família pagante por mês leaves to pay the fixed costs) | **$28.41** (95%) |

## The margin that matters

Fixed costs: $260 a month (Supabase Free (até a 1ª receita) $0, Hospedagem: Cloudflare Pages Free (Vercel Hobby proíbe uso comercial) $0, Resend Free (3.000 e-mails/mês) $0, Domínio [estimativa] $10, Contador para CNPJ [estimativa] $250).

- **Break-even: 10 família pagante por mêss a day.** Below that you lose money every month.
- **Profit margin at your plan** (300 a day): **92%** of every sale, after every cost.
- Capacity: 1000000 a day.

## Year 1, month by month

| month | família pagante por mêss a day | revenue | profit | cumulative (after $2,020 startup) |
| ---: | ---: | ---: | ---: | ---: |
| 1 | 5 | $150 | -$118 | -$2,138 |
| 2 | 10 | $299 | $24 | -$2,114 |
| 3 | 16 | $478 | $195 | -$1,919 |
| 4 | 24 | $718 | $422 | -$1,497 |
| 5 | 34 | $1,017 | $706 | -$792 |
| 6 | 46 | $1,375 | $1,047 | $255 |
| 7 | 60 | $1,794 | $1,445 | $1,700 |
| 8 | 76 | $2,272 | $1,899 | $3,599 |
| 9 | 94 | $2,811 | $2,411 | $6,010 |
| 10 | 114 | $3,409 | $2,979 | $8,988 |
| 11 | 136 | $4,066 | $3,604 | $12,592 |
| 12 | 160 | $4,784 | $4,286 | $16,878 |

- **Year 1 operating profit: $18,898** on $23,172 of revenue.
- After the $2,020 startup spend: $16,878.
- Startup money earned back: month 6.
- Cash you need before it pays for itself: **$2,138**.

## What if

| scenario | margin at plan | break-even a day | year 1 profit |
| --- | ---: | ---: | ---: |
| Base plan | 92% | 10 | $18,898 |
| Price -10% | 91% | 11 | $16,580 |
| Volume -20% | 91% | 10 | $14,494 |
| Unit costs +15% | 91% | 10 | $18,725 |

No red flags in these numbers. They are only as good as the inputs: check every cost against a real quote.
