# Estratégia de produto

Data: 2026-10-21. Esta estratégia vem de quatro fontes:
- o dossiê de ICP ([`2026-10-20-icp.md`](2026-10-20-icp.md));
- as pesquisas de 21/10 sobre IA, WhatsApp, Android, monetização e anexos;
- as founder skills, com o painel de compradores simulados, o preço, o CFO e a oferta, em [`founder/`](../../founder);
- os 15 pontos de melhoria trazidos pelo dono em 21/10.

O desenho funcional que implementa esta estratégia está em
[`docs/superpowers/specs/2026-10-20-proposta-funcional-design.md`](../superpowers/specs/2026-10-20-proposta-funcional-design.md).

## 1. Posicionamento

**"O dinheiro da família no controle, sem conectar o banco."**

- **Não conectar o banco é o diferencial, não a falta de um recurso** (ponto 13).
  - O ICP tem medo de conectar o banco: 16% de quem teve o celular roubado teve a conta mexida.
  - Os apps que conectam colecionam 1 estrela, porque a sincronização falha ou o cartão não aparece.
  - Nós cobrimos o mesmo trabalho por outros caminhos, que a pessoa entende e controla: captura automática pelo próprio celular e conferência da fatura pelo PDF.
- **A fatura que bate é a promessa nº 1** (pontos 7 e 10).
  - "A fatura não bate" é o motivo nº 1 de raiva com os apps "automáticos".
  - O número que a gente mostra tem de bater com o do banco, e quando não bate o app diz exatamente onde está a diferença.
- **Premium transparente** (pontos 14 e 15).
  - Tudo o que o app faz sozinho fica à vista, com desfazer.
  - A cobrança é honesta: preço na porta, teste sem cartão, cancelar em 1 toque.
  - O acabamento visual é de primeira; o dono considera o visual o ponto-chave dos apps de sucesso.

## 2. Entregas de valor, em ordem de importância (ponto 11)

| # | Entrega | Dor que resolve | Crença ou valor que respeita | Evidência |
|---|---|---|---|---|
| 1 | **A fatura que bate.** Parcelas e estornos certos; o PDF da fatura conferido contra o que foi lançado, com a diferença apontada. | "O total nunca bate com o banco"; o cartão é um buraco negro. | "Número errado é pior que nenhum." | ICP §2.1; 46–77% de 1 estrela nos concorrentes; painel P012/P016. |
| 2 | **Lançar sem esforço.** WhatsApp (texto, áudio, foto), Siri, Apple Pay automático, compartilhar comprovante no Android, frase livre no app, caixa "a conferir". | "Anotar cansa e eu largo no 2º mês." | "Tecnologia tem que poupar trabalho." | ICP §2.2; 13 de 18 "não" do painel são por hábito. |
| 3 | **Saber quanto ainda dá para gastar.** "Seguro para gastar" no ciclo, previsão de 6 meses, impacto da parcela no momento do lançamento. | "O salário some antes do dia 20"; a parcela esquecida. | "Quero previsibilidade, não planilha." | 48% do valor no cartão é parcelado (BCB). |
| 4 | **Avisar antes do problema e explicar depois.** Fatura alta antes de fechar, conta vencendo, resumo da fatura ao fechar, relatório do mês, sugestões. | "A fatura chegou e eu só descobri no dia." | "Me ajude a decidir, sem sermão." | Ponto 8 do dono; painel P009. |
| 5 | **A família no mesmo número, com privacidade.** Cônjuge vê tudo ou só o total do pessoal; filhos só lançam; quem pagou; carteira dividida com acerto; carteiras com propósito (casa e viagem). | Briga por gasto que um não sabia; "não quero que veja cada compra". | Autonomia entre adultos; proteção dos filhos. | ICP §2.6; 40% omitem gastos; painel P002/P011/P015/P017. |
| 6 | **Seus dados são seus.** Sem senha de banco; dados no Brasil; exportar e apagar em 1 toque; anexos privados; "Cofre aberto". | "E se o app fechar e eu perder tudo?"; medo de golpe. | Segurança e controle. | Guiabolso e Olivia fechados; painel P001/P007/P009/P013/P018. |
| 7 | **Premium que se prova.** Piloto Automático visível, relatório de valor do mês, cobrança honesta, visual de primeira, apps nativos depois do PWA. | "Pago e não sinto diferença"; cobrança surpresa. | "Quero sentir que vale." | ICP §2.5; ponto 15 do dono. |

## 3. Planos (ponto 4) — detalhe em [`founder/pricing.md`](../../founder/pricing.md)

**Grátis, para sempre:**
- lançamento manual sem limite;
- frase livre no app;
- cartões e faturas;
- exportar CSV;
- 1 pessoa convidada;
- até 50 anexos.

**Família (até 6 pessoas): R$ 19,90/mês ou R$ 149/ano.**
- Tudo do Grátis.
- Captura automática (WhatsApp, Siri, Apple Pay, compartilhar).
- Conferência da fatura por PDF.
- Previsão e inteligência.
- Papéis e privacidade.
- Carteira dividida.
- Anexos até 5 GB.

**Oferta de lançamento: Fundadores** — R$ 119 no 1º ano até 31/01/2027, preço mantido enquanto a assinatura estiver ativa.

**Teste reverso:** toda casa nova entra no Família por 14 dias, sem cartão, e volta ao Grátis sem perder nada.

**Garantias:**
- "Bateu ou devolvemos" no 1º mês pago;
- 7 dias de arrependimento (CDC art. 49);
- aviso 7 dias antes de renovar;
- cancelar em 1 toque.

**Princípio:** nunca cobrar pelo ato de lançar. Cobra-se pela automação e pela família, que é o que a planilha não faz.

**Cobrança:** Asaas, que faz cartão recorrente, Pix, boleto e NFS-e automática.
- O Pix Automático só entra quando o CNPJ tiver 6 meses.
- A Stripe não faz Pix Automático para empresa brasileira.

**Economia, pelo CFO** ([`founder/cfo.md`](../../founder/cfo.md)):
- O custo variável é de ~R$ 1,60 por família pagante, contando IA, WhatsApp, armazenamento, gateway e nota, e incluindo a IA dos usuários grátis.
- O ponto de equilíbrio fica entre 32 e 53 famílias pagantes, conforme o mix mensal/anual.
- A linha a vigiar é a rampa de pagantes, não o custo da IA.

## 4. A oferta e a jornada pós-compra (pontos 14 e 15) — detalhe em [`founder/offer.md`](../../founder/offer.md)

Ao assinar, ou ao começar o teste, a pessoa passa por 4 passos. Cada passo mostra o que vai acontecer sozinho e deixa ligar e testar ali mesmo:

1. **"O que eu lanço por você"**: canais de captura, com o primeiro lançamento feito na hora.
2. **"Como eu decido"**: a categoria pelo histórico; na dúvida, o lançamento vai para "a conferir".
3. **"O que eu aviso"**: os alertas ligados e a data do próximo de cada um.
4. **"Quem vê o quê"**: papéis e convites.

Depois disso:
- O **Piloto Automático** fica a um toque. É o registro do que o app fez sozinho, com origem e desfazer.
- O **Cofre aberto** explica o que guardamos, onde fica e quem vê.

## 5. O que o painel simulado ensinou (limites ditos)

São 20 compradores simulados. Servem para achar objeções, não para prever conversão, e a taxa de compra é um teto.

- **Pitch v1:** 2 compram e 18 passam (10%).
  - 13 dos 18 "não" foram por **hábito**: a planilha funciona, ou já largaram outro app.
  - Os demais foram preço, confiança e privacidade no casal.
- **O que viraria um "não":**
  - exportar sempre;
  - ver as parcelas certas no Grátis;
  - gasto privado no casal;
  - o cônjuge lançando sozinho;
  - a conferência do PDF provada na própria fatura;
  - estar na loja oficial ou ter alguém conhecido que usa.
- **Pitch v2 (a oferta):** o resultado está em [`founder/offer.md`](../../founder/offer.md) §7.

**Antes de gastar com marketing, confirmar com gente real:** lista de espera com preço e pré-venda anual reembolsável (`founder/pricing.md` §4).

## 6. Roteiro (alto nível)

1. **PWA completo**, nos blocos do desenho funcional.
2. **Apps nativos iOS e Android logo depois do PWA** (decisão do dono).
   - O direito de uso mora no banco, por casa, e aceita `asaas | apple | google`.
   - A assinatura feita na web vale no app.
   - No iOS, IAP ao lado do link externo (regra da Apple no Brasil desde 18/06/2026).
   - O RevenueCat entra só quando houver app nativo.
   - Captura nativa no Android: ler a notificação do banco (`NotificationListenerService`).
