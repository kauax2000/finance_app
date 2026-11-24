# Leitura do mês N2 · uma frase e o número — design curto

**Por quê.** O dono achou o cartão chamativo e com visual velho (23/11/2026): moldura colorida, manchete grande, réguas longas e uma linha separando o rodapé. Quer o mesmo insight, conciso, mais moderno e orgânico.

**Mockup aprovado:** `docs/design/painel/leitura-repaginada.html`, opção **N2**.

## Abordagens
- **N1 · Sem moldura:** a leitura vira um trecho da página com um fio vertical. Recusada.
- **N2 · Uma frase e o número (escolhida):** o cartão fica, sem borda colorida, com um tom quente descendo do topo; manchete e porquê numa frase; dezembro como número à direita; motivos em pílulas.
- **N3 · O número primeiro** e **N4 · Como uma nota:** recusadas.

## O que muda
1. **Superfície (`@utility brand-aurora`, única consumidora é a Leitura):** sai a borda em degradê (`::before`) e as três luzes borradas no topo. Fica o anel neutro de `--border` e entram:
   - um tom que desce do topo: `linear-gradient(180deg, color-mix(in oklch, var(--aurora-c) 9%, var(--card)), var(--card) 70%)`;
   - uma luz borrada atrás do selo, no canto de cima à esquerda (~260×160px, `left:-60px; top:-90px`, `blur(40px)`, `--aurora-c` a 30%).
   O volume continua num token só (`--brand-aurora-opacity`, por tema), e os três humores seguem trocando `--aurora-c` (e o selo `aurora-orb` segue lendo `--aurora-l/c/r`). Remedir o contraste em `scripts/tone-contrast.mjs`.
2. **A frase:** a manchete (Ledger, ~`text-[22px]`→ usar a escada: `text-xl`/`text-2xl`, o que o mockup pede) e, na mesma frase, o porquê em `text-muted-foreground`, depois de " — ": "Suas compras do mês subiram 14% — R$ 380 acima do normal, quase tudo de Abastecimento e do Seguro carro." `leituraDoMes` passa a devolver o `apoio` nessa forma de continuação:
   - com 2 motivos cobrindo ≥70%: "R$ X acima/abaixo do normal, quase tudo de A e de B."
   - com 1 motivo cobrindo ≥70%: "R$ X acima/abaixo do normal, quase tudo de A."
   - motivos cobrindo <70%: "R$ X acima/abaixo do normal, mais por A e B." (ou "mais por A.")
   - sem motivos: "R$ X acima/abaixo do normal."
   - os casos "sem média" e "dentro do normal" mantêm o apoio de hoje (frases completas), mostrado depois do " — " também.
   O valor em reais segue `forte`.
3. **Dezembro à direita:** "dezembro, no ritmo de sempre" (`text-xs text-muted-foreground`) sobre o valor (`nums font-semibold`, ~`text-xl`). Abaixo de `sm` (ou da largura do cartão por container query) desce para baixo da frase, alinhado à esquerda. Sem sugestão, não aparece. Receita: "<mês>, no ritmo de sempre" igual.
4. **Motivos em pílulas:** uma pílula por motivo — o ponto (`ChartSwatch`, cor da categoria no variável, `--muted-foreground` no fixo), o nome, o detalhe ("novo desde set") em `text-muted-foreground` menor, e o delta em mono no tom (warning/success). Sem réguas. Use peça do DS (`Badge` ou outra do catálogo); se nenhuma servir, crie/estenda no DS seguindo a invariante 8 (autorização permanente do dono).
5. **O botão "Ver <grupo>"** vai para a mesma linha das pílulas, à direita (`secondary`, `sm`); no telefone, a linha quebra e o botão ocupa a largura.
6. **Sai:** o `Separator` e a linha do rodapé ("Com as compras no ritmo de sempre…"), as réguas `Progress` dos motivos.

## Fora
- O selo `aurora-orb` (fica, a 22px como no mockup ou nos 28px de hoje — o builder escolhe pelo mockup: 22px).
- A conta da composição.
