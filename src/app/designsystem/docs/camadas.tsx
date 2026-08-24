"use client"

import { DocNote, DocSection, Usage } from "../ds-doc"
import { Group, Spec, Stack } from "../ds-kit"

const LAYERS = [
  ["--z-base", "0", "o conteúdo da página"],
  ["--z-raised", "10", "o que se destaca sem sair do fluxo: ponto de timeline, avatar sobreposto"],
  ["--z-sticky", "20", "cabeçalho fixo, linha de cabeçalho de tabela"],
  ["--z-nav-island", "30", "a ilha de navegação do telefone"],
  ["--z-overlay", "40", "o escurecimento atrás de um modal"],
  ["--z-sheet", "50", "diálogo, folha, gaveta"],
  ["--z-popover", "60", "popover e menu — precisam abrir por cima de uma folha"],
  ["--z-toast", "100", "o toast, sempre por último"],
]

export default function CamadasDoc() {
  return (
    <>
      <Usage>
        Empilhamento é uma decisão global disfarçada de decisão local. Sem uma
        escala nomeada, cada superfície nova chuta um número que funciona na tela
        onde foi testada e quebra na primeira vez que aparece junto de outra.
      </Usage>

      <Group title="A ordem">
        <Spec title="Do conteúdo ao toast" meta="globals.css">
          <Stack className="gap-2">
            {LAYERS.map(([token, value, use]) => (
              <div key={token} className="flex items-baseline gap-3">
                <code className="w-36 shrink-0 font-mono text-2xs text-foreground">
                  {token}
                </code>
                <span className="nums w-8 shrink-0 text-right text-2xs text-muted-foreground">
                  {value}
                </span>
                <span className="text-xs text-muted-foreground">{use}</span>
              </div>
            ))}
          </Stack>
        </Spec>
      </Group>

      <DocSection
        title="Como usar"
        code={`<header className="sticky top-0 z-(--z-sticky)">…</header>`}
      >
        <div className="relative h-28 w-full overflow-hidden rounded-lg border border-border bg-muted/30">
          <span className="absolute top-4 left-4 z-(--z-base) flex size-16 items-end justify-center rounded-lg bg-secondary pb-1 text-2xs text-secondary-foreground">
            base
          </span>
          <span className="absolute top-8 left-12 z-(--z-sticky) flex size-16 items-end justify-center rounded-lg bg-info-muted pb-1 text-2xs text-info-muted-foreground">
            sticky
          </span>
          <span className="absolute top-12 left-20 z-(--z-sheet) flex size-16 items-end justify-center rounded-lg bg-primary pb-1 text-2xs text-primary-foreground">
            sheet
          </span>
        </div>
      </DocSection>

      <DocNote title="Ainda não migrado — hoje convivem três escalas">
        Esta escala existe, mas o produto ainda não a usa. Medido agora:{" "}
        <code>z-10</code> aparece 28 vezes e <code>z-50</code> 19, enquanto{" "}
        <code>z-(--z-*)</code> aparece duas vezes fora deste catálogo. E existe
        uma terceira convenção em produção que não é nenhuma das duas —{" "}
        <code>z-[70]</code> no Sheet, <code>z-[80]</code> em Popover, Dropdown e
        Select, <code>z-[100]</code> no Toaster —, documentada em comentários
        dentro dos próprios componentes.
      </DocNote>

      <DocNote title="O mapeamento pretendido">
        A migração é trocar 70 por <code>--z-sheet</code>, 80 por{" "}
        <code>--z-popover</code> e 100 por <code>--z-toast</code>, preservando a
        ordem relativa: o popover precisa abrir por cima da folha, que é
        exatamente o que os números crus codificam hoje. Está no backlog em{" "}
        <code>docs/design/CONFORMIDADE-01.md</code>. Até lá, código novo usa os
        tokens; componente existente não se altera isoladamente, porque quem
        importa é a ordem entre eles.
      </DocNote>
    </>
  )
}
