"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Kbd, formatKey } from "@/components/ui/kbd"

/**
 * A sequência: teclas apertadas **uma depois da outra**, cada uma na própria
 * pastilha — o atalho de dois tempos, como o `g h` do GitHub.
 *
 * O **acorde** (`⌘K`) é outra coisa: os dedos descem juntos, e ele é uma
 * pastilha só. Mora no `Kbd`, em `keys`. Trocar um pelo outro ensina o atalho
 * errado, e é o defeito que a página do `Kbd` narra.
 *
 * ## Por que ele é molécula, e por que `keys` existe
 *
 * Ele importava **zero** componentes: os `<Kbd>` vinham de quem chamava, e uma
 * molécula que não compõe nada é o padrão fraco que este catálogo já mediu —
 * 26 das 38 moléculas importavam zero. `keys` faz a classificação virar
 * verdade: um `Kbd` por tecla, o átomo importado de fato.
 *
 * ## Por que ele é cliente
 *
 * `kbd.tsx` é módulo cliente, e **todo export de um módulo cliente vira uma
 * *client reference*** quando um componente de servidor o importa — inclusive o
 * que não é componente. Sem a diretiva, o `formatKey()` abaixo seria chamado no
 * servidor e estouraria. Desde a rodada 195 há também o `live`, que escuta o
 * teclado.
 *
 * ## Rodada 195
 *
 * - **Um passo pode ser acorde** (`["mod+k", "s"]`). Cada passo passava só por
 *   `formatKey`, que não conhece modificadora: "mod+k" sairia escrito cru.
 * - **`mode="either"`**: teclas que são **opções**, e não passos. A legenda da
 *   paleta escrevia `<Kbd>↑</Kbd><Kbd>↓</Kbd>` com o sentido de "↑ ou ↓" —
 *   pastilhas lado a lado, que é o desenho da sequência.
 * - **`separator`**: o "›" entre os passos, para quem não conhece a convenção.
 * - **`live`**: as pastilhas acendem com as teclas apertadas.
 *
 * O leitor de tela ouve "depois" entre os passos e "ou" entre as opções, com
 * ou sem o separador à vista: a diferença entre os dois gestos é o que este
 * componente existe para dizer.
 */

type KbdGroupMode = "sequence" | "either"

type KbdGroupProps = Omit<React.ComponentProps<"kbd">, "children"> & {
  /** `either`: as teclas são opções (↑ ou ↓), e um "/" fica entre elas. */
  mode?: KbdGroupMode
  /** Só na sequência: o "›" à vista entre os passos. */
  separator?: boolean
} & (
    | {
        keys: string[]
        children?: never
        /** As pastilhas acendem com as teclas apertadas. Só com `keys`. */
        live?: boolean
      }
    | { keys?: undefined; children?: React.ReactNode; live?: never }
  )

/** Um passo com modificadora precisa do `Kbd keys`, que resolve ⌘/Ctrl. */
const MODIFICADORA = /(^|\+)\s*(mod|cmd|meta|shift|alt|opt|ctrl|control)\s*(\+|$)/i

/** Os nomes da tabela do `Kbd` para os nomes do `KeyboardEvent.key`. */
const NOME_DO_EVENTO: Record<string, string> = {
  esc: "escape",
  up: "arrowup",
  down: "arrowdown",
  left: "arrowleft",
  right: "arrowright",
  del: "delete",
  return: "enter",
  space: " ",
}

/**
 * Se a tecla apertada é a de um passo. As modificadoras pedidas têm de estar
 * descidas (`mod` aceita ⌘ ou Ctrl); as que sobram não reprovam — a dica
 * acende, não valida.
 */
function casa(passo: string, e: KeyboardEvent) {
  const partes = passo.toLowerCase().split("+").map((p) => p.trim())
  const principal = partes[partes.length - 1]
  for (const mod of partes.slice(0, -1)) {
    if (["mod", "cmd", "meta"].includes(mod) && !(e.metaKey || e.ctrlKey)) return false
    if (mod === "shift" && !e.shiftKey) return false
    if ((mod === "alt" || mod === "opt") && !e.altKey) return false
    if ((mod === "ctrl" || mod === "control") && !e.ctrlKey) return false
  }
  return e.key.toLowerCase() === (NOME_DO_EVENTO[principal] ?? principal)
}

/**
 * O que está aceso. Na sequência é o **progresso**: acertou o primeiro passo,
 * ele acende; errou, volta ao começo (ou ao primeiro, se a tecla errada for o
 * primeiro passo). Completa, fica acesa um instante e apaga; parada, apaga
 * sozinha. Nas opções é a tecla que está descida agora.
 */
function useTeclasAcesas(keys: string[] | undefined, mode: KbdGroupMode, ligado: boolean) {
  const [acesas, setAcesas] = React.useState<boolean[]>([])
  const assinatura = keys?.join("\u0000") ?? ""

  React.useEffect(() => {
    if (!ligado || !keys?.length) return
    let progresso = 0
    let relogio: number | undefined
    const apagarDepois = (ms: number) => {
      window.clearTimeout(relogio)
      relogio = window.setTimeout(() => {
        progresso = 0
        setAcesas([])
      }, ms)
    }
    const desce = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (mode === "either") {
        setAcesas(keys.map((k) => casa(k, e)))
        return
      }
      if (casa(keys[progresso], e)) progresso += 1
      else progresso = casa(keys[0], e) ? 1 : 0
      setAcesas(keys.map((_, i) => i < progresso))
      if (progresso === keys.length) {
        progresso = 0
        apagarDepois(600)
      } else {
        apagarDepois(1500)
      }
    }
    const sobe = () => {
      if (mode === "either") setAcesas([])
    }
    window.addEventListener("keydown", desce)
    window.addEventListener("keyup", sobe)
    return () => {
      window.removeEventListener("keydown", desce)
      window.removeEventListener("keyup", sobe)
      window.clearTimeout(relogio)
    }
    // `assinatura` no lugar de `keys`: um array novo a cada render não é uma
    // sequência nova.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assinatura, mode, ligado])

  return acesas
}

function KbdGroup({
  keys,
  mode = "sequence",
  separator = false,
  live = false,
  className,
  children,
  ...props
}: KbdGroupProps) {
  const acesas = useTeclasAcesas(keys, mode, live)

  const pastilhas = keys
    ? keys.map((passo, i) =>
        MODIFICADORA.test(passo) || passo.includes("+") ? (
          <Kbd key={i} keys={passo} data-lit={acesas[i] || undefined} />
        ) : (
          <Kbd key={i} data-lit={acesas[i] || undefined}>
            {formatKey(passo)}
          </Kbd>
        )
      )
    : React.Children.toArray(children)

  const visivel = mode === "either" ? "/" : separator ? "›" : null
  const falado = mode === "either" ? " ou " : " depois "

  return (
    <kbd
      data-slot="kbd-group"
      data-mode={mode}
      className={cn(
        "inline-flex items-center gap-1",
        // A pastilha acesa: o seletor tem mais especificidade que o
        // `dark:bg-muted` do próprio `Kbd`, que empataria com um `data-lit:`.
        "[&>[data-slot=kbd]]:transition-colors [&>[data-slot=kbd]]:duration-(--duration-fast)",
        "[&>[data-slot=kbd][data-lit]]:bg-primary [&>[data-slot=kbd][data-lit]]:text-primary-foreground",
        className
      )}
      {...props}
    >
      {pastilhas.map((pastilha, i) => (
        <React.Fragment key={i}>
          {i > 0 ? (
            <>
              {visivel ? (
                <span aria-hidden className="text-xs text-muted-foreground">
                  {visivel}
                </span>
              ) : null}
              <span className="sr-only">{falado}</span>
            </>
          ) : null}
          {pastilha}
        </React.Fragment>
      ))}
    </kbd>
  )
}

export { KbdGroup }
