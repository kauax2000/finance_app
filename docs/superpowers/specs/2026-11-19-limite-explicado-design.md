# Limite de gasto explicado (B1) — desenho curto

Data: 19/11/2026. Escolha do dono: **B1**.

## Por quê

Na linha "Limite do mês" do formulário de categoria, os textos "Valor", "Vale para novembro de 2026" e "Repetir todo mês" não explicam duas coisas: o que é o limite e o que acontece no mês seguinte. O dono perguntou se a categoria não fica sempre pronta.

Ela fica. Quem é guardado mês a mês é o limite (`budgets`), e "repetir" copia o limite para o mês novo no dia 1.

## O que muda (só em `src/components/categories/category-form-fields.tsx`)

- **A linha recolhível** passa a se chamar `Limite de gasto` e continua com `Opcional` à direita e `underline={false}`.
- **A primeira linha do conteúdo** é uma explicação em `text-xs text-muted-foreground`: `Um teto para o que você gasta em <nome> por mês. Avisamos em 80% e ao passar dele.` `<nome>` é o nome digitado. Com o nome vazio, a frase diz `nesta categoria`.
- **O campo** continua `FormInput money` com o rótulo `Valor`. A ajuda `Vale para … de …` sai.
- **O interruptor** `FormSwitch` "Repetir todo mês" sai. No lugar dele entra um `ToggleGroup variant="segmented"` de duas opções, que ocupa a largura do cartão (`stretch`):
  - `Todo mês` grava `repeats = true`;
  - `Só em <mês>` grava `repeats = false`.

  É toggle, e não abas, porque a escolha não muda o formulário, só o texto. A regra é do dono.
- **A frase abaixo do toggle** troca com a escolha:
  - com `Todo mês`: `O mesmo valor começa sozinho todo dia 1, até você mudar.`
  - com `Só em <mês>`: `Vale só em <mês>. Em <mês seguinte>, <nome> fica sem limite.`
- O mês sai do `budget.ym` em minúscula e por extenso. O ano entra só quando o mês não é do ano corrente (a regra de `mesNaFrase` em `categorias-do-mes.tsx`; reuse a função).

## O que não muda

O que se grava (`repeats`), os três diálogos que usam o componente, o padrão `Todo mês` e o resto do formulário.

## Abordagens

1. **B1, escolhida:** toggle segmentado com uma frase que troca.
2. **A1/A2:** manter o interruptor, com uma prévia dos meses ou com a consequência escrita.
3. **B2:** chips com a prévia dos meses.
4. **C:** limite mensal por padrão, com a exceção num link.

## Na mesma mudança

- Os testes de `category-form-fields.test.ts` passam a conferir os textos novos e a ausência do `FormSwitch`.
- A seção 9 de `docs/JORNADAS.md` e `docs/atlas/template.html` trocam "Repetir todo mês" pelo toggle `Todo mês | Só em <mês>`. Depois, rodar o `build.py` e republicar o Atlas.
