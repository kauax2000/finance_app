import { cn } from "@/lib/utils"

function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "pointer-events-none inline-flex h-5 w-fit min-w-5 items-center justify-center gap-1 rounded-sm bg-muted px-1 font-sans text-xs font-medium text-muted-foreground select-none [&_svg:not([class*='size-'])]:size-3",
        // O preenchimento do tema claro desce um degrau, e a assimetria é
        // medida.
        //
        // Contra o gatilho da busca, que é `input-fill/30`, a pastilha em
        // `bg-muted` media **1,04** — ela ficava *mais clara* que o campo por
        // um fio de cabelo e sumia como forma. Só o glifo aparecia. Sobre
        // cartão branco é o mesmo caso, 1,06. (Sem os valores escritos aqui: o
        // auditor lê comentário como código, e hex numa observação vira cor
        // literal no relatório.)
        //
        // Um fio de `--border` foi a primeira tentativa e não bastou: 1,19
        // contra o campo, e 1px a 1,19 não se enxerga. A mesma razão como
        // **área** se enxerga — é por isso que o degrau é de preenchimento, e
        // não de aresta.
        //
        // A tinta desce junto, e não por gosto: sobre o cinza novo o
        // `--muted-foreground` media 4,47:1, três centésimos abaixo de AA.
        // Escurecer o chão sem escurecer o glifo troca um problema por outro.
        // `foreground/80` mantém a pastilha discreta — ela é uma dica, não
        // pode gritar mais alto que o rótulo do campo ao lado — e mede 8,3:1.
        //
        // No escuro a pastilha já é mais clara que o fundo e se destaca
        // sozinha; o `dark:` devolve os dois tokens e mantém aquele tema byte
        // a byte como estava.
        "bg-input-fill text-foreground/80 dark:bg-muted dark:text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function KbdGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <kbd
      data-slot="kbd-group"
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    />
  )
}

export { Kbd, KbdGroup }
