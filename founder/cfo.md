# Nota do CFO (revisão 2 de 21/10: só anual; valores em R$, a ferramenta imprime "$")

**O que mudou:**
- **o plano é só anual:** R$ 239/ano, que dá R$ 19,92 por mês, em até 12x no cartão;
- não há plano grátis;
- IA, WhatsApp e infraestrutura ficam nos planos gratuitos até a primeira receita.

**Custos:**
- **Variável:** o gateway (cartão em 12x, estimado em ~3,99% + R$ 0,49) e a nota fiscal dão ~R$ 1,09 por família-mês. IA e WhatsApp custam zero dentro das cotas.
- **Fixo:** ~R$ 260/mês, entre domínio e um contador estimado.

| Preço por família-mês | Contribuição | Equilíbrio | Lucro no ano 1 | Retorno |
|---|---|---|---|---|
| R$ 19,92 (R$ 239/ano) | R$ 18,83 | 14 pagantes | ver tabela abaixo | mês 8 |
| R$ 16,58 (Fundadores, R$ 199/ano) | R$ 15,49 | 17 pagantes | — | — |

**O anual ajuda o caixa.** No Pix à vista, ou com antecipação do parcelado, o ano entra todo de uma vez. A antecipação tem custo, e o Asaas cobra à parte.

**A linha a vigiar é a rampa de pagantes.** Ao começar a cobrar, a receita paga primeiro:
1. Vercel Pro, obrigatório porque a Hobby proíbe uso comercial;
2. Supabase Pro;
3. IA paga.

**Atenção:** este cálculo não é conselho contábil. Confirme CNPJ e tributos com um contador.

# Unit economics: App de controle financeiro da família (PWA; plano Família)

Every number below comes from the input file. Nothing is looked up or guessed.

## One família pagante por mês

| line | per família pagante por mês |
| --- | ---: |
| Price | $19.92 |
| IA: Cloudflare Workers AI no free tier (não treina) | -$0.00 |
| WhatsApp: entrada grátis; até 1.000 respostas/mês grátis | -$0.00 |
| Asaas: cartão parcelado 12x ~3,99% + R$0,49 por cobrança, rateado por mês [estimativa] | -$0.84 |
| NFS-e Asaas R$0,49 por cobrança, mix [estimativa] | -$0.25 |
| **Contribution** (what each família pagante por mês leaves to pay the fixed costs) | **$18.83** (95%) |

## The margin that matters

Fixed costs: $260 a month (Supabase Free (até a 1ª receita) $0, Hospedagem: Cloudflare Pages Free (Vercel Hobby proíbe uso comercial) $0, Resend Free (3.000 e-mails/mês) $0, Domínio [estimativa] $10, Contador para CNPJ [estimativa] $250).

- **Break-even: 14 família pagante por mêss a day.** Below that you lose money every month.
- **Profit margin at your plan** (300 a day): **90%** of every sale, after every cost.
- Capacity: 1000000 a day.

## Year 1, month by month

| month | família pagante por mêss a day | revenue | profit | cumulative (after $2,020 startup) |
| ---: | ---: | ---: | ---: | ---: |
| 1 | 5 | $100 | -$166 | -$2,186 |
| 2 | 10 | $199 | -$72 | -$2,258 |
| 3 | 16 | $319 | $41 | -$2,216 |
| 4 | 24 | $478 | $192 | -$2,024 |
| 5 | 34 | $677 | $380 | -$1,644 |
| 6 | 46 | $916 | $606 | -$1,038 |
| 7 | 60 | $1,195 | $870 | -$168 |
| 8 | 76 | $1,514 | $1,171 | $1,003 |
| 9 | 94 | $1,872 | $1,510 | $2,513 |
| 10 | 114 | $2,271 | $1,887 | $4,400 |
| 11 | 136 | $2,709 | $2,301 | $6,700 |
| 12 | 160 | $3,187 | $2,753 | $9,453 |

- **Year 1 operating profit: $11,473** on $15,438 of revenue.
- After the $2,020 startup spend: $9,453.
- Startup money earned back: month 8.
- Cash you need before it pays for itself: **$2,258**.

## What if

| scenario | margin at plan | break-even a day | year 1 profit |
| --- | ---: | ---: | ---: |
| Base plan | 90% | 14 | $11,473 |
| Price -10% | 89% | 16 | $9,929 |
| Volume -20% | 89% | 14 | $8,555 |
| Unit costs +15% | 89% | 14 | $11,347 |

No red flags in these numbers. They are only as good as the inputs: check every cost against a real quote.
