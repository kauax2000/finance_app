# Promover um bloco da tela para o design system

O caminho de um `function StatCard()` declarado dentro de uma `page-client.tsx`
até `src/components/ui/stat-card.tsx`, sem quebrar a tela no meio.

## Antes: ele merece existir?

Três perguntas. Se a resposta for não para alguma, **não promova**:

1. **Tem semântica própria?** Um nome que descreve o que ele é no produto.
2. **O reuso é previsível?** Existe uma segunda tela identificável agora — não
   hipotética — que vai precisar dele.
3. **As variants vêm do uso real?** Cada variant corresponde a um caso que existe
   hoje.

Falhou alguma? O bloco fica na tela como markup composto de tokens, e o relatório
diz isso em uma linha. Não é dívida: é a resposta certa até haver evidência.

E existe um quarto caso, que não é falha nenhuma: **layout exclusivo daquela
rota**. Um cabeçalho que só aquela página tem não vira componente compartilhado
só porque é uma função. Ele fica, e o relatório diz que fica.

## A ordem que não quebra a tela

**1. Corrigir por dentro, onde ele está.** Antes de mover qualquer coisa, troque
as cores cruas por token, some o `active:` que faltava, troque o `<button>` por
`Button`. São correções locais e reversíveis, e não dependem de aprovação. Se a
promoção for recusada, elas continuam valendo.

**2. Propor.** No relatório: de onde ele veio, quais telas vão consumi-lo, e cada
variant com o caso de uso que a justifica. Espere o ok. Enquanto ele não vem, o
componente **fica exatamente onde está**.

**Esperar não é dissolver.** A tentação de "resolver" apagando a declaração e
espalhando o JSX inline é pior que o problema original: some a abstração, aparece
markup duplicado, a intenção das variants se perde, e quem aprovar amanhã terá
que extrair tudo de novo.

**3. Mover o arquivo, não reescrever.** Recorte a função para
`src/components/ui/<slug>.tsx` como ela está, e só então aplique
`references/conventions.md`: `data-slot`, `cn()` por último, `cva` se houver
variant. Reescrever do zero é como a versão nova sai diferente da que estava
testada.

**4. Trocar a declaração pelo import na tela de origem.** Uma tela por vez, com
`npx tsc --noEmit` entre elas. A tela deve ficar visualmente idêntica: se mudou
alguma coisa, a promoção introduziu uma diferença que ninguém pediu.

**5. Documentar na mesma mudança.** Registry, página de docs, `ds:docs-map`. Um
componente compartilhado que ninguém sabe que existe será reescrito pela próxima
tela, que é exatamente o problema que a promoção veio resolver.

**6. Verificar.**

```bash
npx tsc --noEmit && npm run lint && npm run test:unit
npm run ds:audit -- src/app/<a-tela-de-origem>
```

## Onde ele vai

| Natureza | Destino |
|---|---|
| Peça reutilizável, sem conhecimento do domínio | `src/components/ui/` |
| Peça com semântica financeira, mas reutilizável (`MoneyDisplay`) | `src/components/ui/` |
| Navegação e casca deste produto (`app-header`, `mobile-nav-island`) | `src/components/layout/` |
| Bloco de uma área só, com regra de negócio (`bill-pending-card`) | `src/components/<área>/` |
| Layout exclusivo de uma rota | fica em `src/app/`, e o relatório diz por quê |

Só o primeiro e o segundo cruzam a fronteira de autorização. Mover algo de
`src/app/` para `src/components/<área>/` é reorganização normal de código.
