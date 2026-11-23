# Lançamento inteligente — linha de base (23/11/2026)

Plano: `docs/superpowers/plans/2026-11-23-lancamento-inteligente-que-aprende.md`.

## No banco (produção, últimos 60 dias, `scripts/frases/linha-de-base.sql`)

| Origem | Lançamentos | Sem categoria | A conferir | Sem forma |
| --- | ---: | ---: | ---: | ---: |
| app (formulário) | 222 | 0,0% | 0,0% | 3,2% |
| shortcut (Atalho) | 4 | 0,0% | 0,0% | 0,0% |
| quick_text (frase no app) | 4 | 0,0% | 0,0% | 0,0% |
| recurring | 4 | 0,0% | 0,0% | 0,0% |
| share | 1 | 0,0% | 0,0% | 0,0% |

**Leitura:** o banco guarda o lançamento **depois** da conferência. Os 4 do atalho já
foram corrigidos à mão, então o estado atual não mostra o que saiu em branco. O
volume baixo (4 em 60 dias, contra 222 no formulário) é o sinal: o atalho quase não
é usado. A métrica de verdade passa a ser `capture_meta->>'categoria'`, gravado no
momento da captura (Task 3 do plano): de onde veio a categoria, ou nulo quando não veio.

## No parser (o diagnóstico da seção 0 do plano)

Categorias Transporte, Alimentação, Mercado, Saúde e Carro; histórico "Posto Shell → Carro".

| Frase | Descrição lida | "Cartão" lido | Categoria no app | Categoria no atalho |
| --- | --- | --- | --- | --- |
| gastei 200 reais de abastecimento | Gastei de abastecimento | — | — | — |
| abasteci 150 no posto | Abasteci | posto | — | — |
| paguei 80 na farmácia | Paguei | farmacia | — | — |
| comprei pão 12,50 | Comprei | pao | — | — |
| Dei 30 reais pro flanelinha | Dei pro | flanelinha | — | — |
| 50 gasolina | Gasolina | — | Transporte (comum) | — |
| uber 23,90 | Uber | — | Transporte (comum) | — |
| almoço 35 no débito | Almoço | — | Alimentação (comum) | — |
| posto ipiranga 180 | Posto | ipiranga | Carro (palavra) | Carro |

Das 9 frases, o app acerta a categoria de 4 e o atalho de 1.
