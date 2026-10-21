# Nota do CFO (revisão de 21/10; valores em R$, a ferramenta imprime "$")

**O que mudou na revisão:**
- não há plano grátis;
- o preço subiu para R$ 29,90/mês ou R$ 239/ano;
- IA, WhatsApp e infraestrutura ficam nos planos gratuitos até a primeira receita.

**Números:**
- **Custo variável:** só o gateway e a nota, ~R$ 1,30 por cobrança. IA (Cloudflare) e WhatsApp custam zero dentro das cotas.
- **Custo fixo:** ~R$ 260/mês, contando domínio e um contador estimado. Supabase, hospedagem e Resend ficam no Free.

| Preço por família | Contribuição | Equilíbrio | Lucro no ano 1 | Retorno |
|---|---|---|---|---|
| R$ 19,92 (anual) | R$ 18,62 | 14 pagantes | R$ 11.311 | mês 8 |
| R$ 24,90 | R$ 23,60 | 11 pagantes | R$ 15.170 | mês 7 |
| R$ 29,90 (mensal) | R$ 28,60 | 9 pagantes | R$ 19.045 | mês 6 |

**A linha a vigiar continua sendo a rampa de pagantes.** A rampa supõe crescimento por indicação, e sem plano grátis o funil depende do teste converter.

**Upgrades que a receita paga primeiro:**
1. Vercel Pro (US$ 20), ou migrar para Cloudflare, **obrigatório ao começar a cobrar**: a Hobby proíbe uso comercial.
2. Supabase Pro (US$ 25), pelo backup e pelo fim da pausa.
3. A IA paga (Gemini Flash-Lite, ~US$ 0,01 por usuário).

Cada um custa ~R$ 110–140/mês, ou seja, de 4 a 5 assinaturas.

**Atenção:** este cálculo não é conselho contábil. Confirme CNPJ e tributos com um contador.

# Unit economics: App de controle financeiro da família (PWA; plano Família)

Every number below comes from the input file. Nothing is looked up or guessed.

## One família pagante por mês

| line | per família pagante por mês |
| --- | ---: |
| Price | $24.90 |
| IA: Cloudflare Workers AI no free tier (não treina) | -$0.00 |
| WhatsApp: entrada grátis; até 1.000 respostas/mês grátis | -$0.00 |
| Asaas: cartão 2,99% + R$0,49, mix mensal/anual [estimativa] | -$1.05 |
| NFS-e Asaas R$0,49 por cobrança, mix [estimativa] | -$0.25 |
| **Contribution** (what each família pagante por mês leaves to pay the fixed costs) | **$23.60** (95%) |

## The margin that matters

Fixed costs: $260 a month (Supabase Free (até a 1ª receita) $0, Hospedagem: Cloudflare Pages Free (Vercel Hobby proíbe uso comercial) $0, Resend Free (3.000 e-mails/mês) $0, Domínio [estimativa] $10, Contador para CNPJ [estimativa] $250).

- **Break-even: 12 família pagante por mêss a day.** Below that you lose money every month.
- **Profit margin at your plan** (300 a day): **91%** of every sale, after every cost.
- Capacity: 1000000 a day.

## Year 1, month by month

| month | família pagante por mêss a day | revenue | profit | cumulative (after $2,020 startup) |
| ---: | ---: | ---: | ---: | ---: |
| 1 | 5 | $124 | -$142 | -$2,162 |
| 2 | 10 | $249 | -$24 | -$2,186 |
| 3 | 16 | $398 | $118 | -$2,068 |
| 4 | 24 | $598 | $306 | -$1,762 |
| 5 | 34 | $847 | $542 | -$1,220 |
| 6 | 46 | $1,145 | $826 | -$394 |
| 7 | 60 | $1,494 | $1,156 | $762 |
| 8 | 76 | $1,892 | $1,534 | $2,296 |
| 9 | 94 | $2,341 | $1,958 | $4,254 |
| 10 | 114 | $2,839 | $2,430 | $6,684 |
| 11 | 136 | $3,386 | $2,950 | $9,634 |
| 12 | 160 | $3,984 | $3,516 | $13,150 |

- **Year 1 operating profit: $15,170** on $19,298 of revenue.
- After the $2,020 startup spend: $13,150.
- Startup money earned back: month 7.
- Cash you need before it pays for itself: **$2,186**.

## What if

| scenario | margin at plan | break-even a day | year 1 profit |
| --- | ---: | ---: | ---: |
| Base plan | 91% | 12 | $15,170 |
| Price -10% | 90% | 13 | $13,240 |
| Volume -20% | 90% | 12 | $11,512 |
| Unit costs +15% | 91% | 12 | $15,019 |

No red flags in these numbers. They are only as good as the inputs: check every cost against a real quote.
