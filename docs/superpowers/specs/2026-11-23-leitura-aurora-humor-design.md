# Leitura do mês: a aurora que diz o humor do mês — design curto

**Por quê.** O dono achou o véu de hoje (`brand-wash`) sujo. É o arco-íris inteiro borrado, e no escuro coral, âmbar e verde viram um marrom-oliva atrás do texto. Ele também achou que o anel de arco-íris completo não conversa com o fundo. Em 23/11/2026 ele escolheu o **P1c** de `docs/design/painel/leitura-do-mes-v4.html`, que se apoia no P1a da mesma página. Nessa versão, a borda e o fundo são a mesma luz, e a paleta segue a notícia.

## Abordagens
- **P1c · Humor (escolhida).** A borda e a aurora mudam de paleta pela manchete.
- **P1a sozinho.** É a mesma luz com uma paleta fixa. Fica como o caso neutro do P1c.
- **P1d (grão), P1e (luz no ✦) e P1f (vidro).** Não escolhidas.
- **P1b (o arco-íris inteiro vazando) e o véu de hoje.** Recusadas.

## O desenho (o mockup manda)
Hoje o `Card variant="brand" glow="static"` é o anel do `brand-glow` com piso, o arco que segue o ponteiro e o `brand-wash`. Isso é **substituído** por uma superfície de aurora com três camadas, todas atrás do conteúdo:
1. **Aurora.** Três luzes radiais borradas nascem do topo (esquerda, centro e direita) e se apagam antes do meio do cartão.
2. **Borda.** Um fio de cerca de 1,5px com um degradê horizontal das **mesmas três cores** (esquerda → centro → direita). É forte em cima e some para baixo, ficando em ~12% no pé.
3. **Brilho interno.** A cor da borda vaza alguns pixels para dentro: no topo, a cor do centro; nas laterais, as cores das pontas.

**Humor** (a nova prop `mood` no `Card`, que só vale com `glow="static"`):

| mood | esquerda | centro | direita | quando |
| --- | --- | --- | --- | --- |
| `warm` | `--brand-magenta` | `--brand-coral` | `--brand-amber` | o tom do insight é `warning` (o gasto subiu ou a entrada caiu) |
| `cool` | `--brand-teal` | `--brand-green` | `--brand-blue` | o tom é `success` |
| `neutral` (padrão) | `--brand-violet` | `--brand-blue` | `--brand-magenta` | o tom é `info` (normal ou sem média) |

- **Sem arco que segue o ponteiro** no `glow="static"`: a luz fica parada. O `useBrandGlow` fica desligado nesse modo, e o `sempreAceso`, o `--brand-glow-floor` e o `brand-wash` saem se ficarem sem uso. Se `--brand-glow-floor` não tiver outro uso, remova a variável e volte o teste do triângulo. O `glow="pointer"` padrão não muda.
- **Volume:** um token por tema, `--brand-aurora-opacity` (no claro mais baixo que no escuro). Não mexa nas paradas.
- **Exceção nomeada** ao arco-íris sob texto: troque a menção ao `brand-wash` no AGENTS.md pela `brand-aurora` e meça o contraste do texto sobre o pior ponto da aurora nos dois temas, se o `scripts/tone-contrast.mjs` permitir. Se não permitir, diga no relatório.
- **O ✦ da Leitura do mês** é escrito com a cor do arco-íris (texto recortado, `brand-rainbow`, só no glifo).
- **A tela** passa `mood` a partir de `leitura.tom`: `warning` vira `warm`, `success` vira `cool` e `info` vira `neutral`.

## Fora
O layout, o texto e os dados não mudam. Nenhum caminho de navegação muda.
