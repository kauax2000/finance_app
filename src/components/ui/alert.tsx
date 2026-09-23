"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { animate } from "motion/react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * O aviso que mora dentro do conteúdo.
 *
 * A versão anterior tinha **um eixo com o nome errado e nenhum dos dois que
 * faltavam**. O eixo era `variant`, e carregava as cinco cores semânticas —
 * mas neste projeto essas cinco cores se chamam `tone` em todo lugar
 * (`StatCard`, `Progress`, `Timeline`, `AnnouncementBar`), e o `Alert` era o
 * único que dizia `variant`. Trocar de componente exigia reabrir o fonte para
 * lembrar qual das duas palavras valia — que é exatamente o motivo pelo qual o
 * `neutral` do `StatCard` virou `default` numa rodada anterior.
 *
 * O que faltava, e que as telas escreviam à mão:
 *
 * - **um tamanho**: o alerta compacto do formulário de cartão vem com
 *   `className="gap-2 px-3 py-2.5"`, título em `text-xs` e descrição em
 *   `text-2xs`, tudo escrito na tela;
 * - **uma forma sem moldura**: quatro formulários de autenticação desenham
 *   `bg-*-muted p-3 rounded-md` sem borda, porque ali já há molduras demais;
 * - **um lugar para a ação**: o dashboard põe um `Button` dentro do
 *   `AlertDescription` com cinco classes de cor escritas à mão
 *   (`border-destructive/40 bg-transparent text-destructive-muted-foreground
 *   hover:bg-destructive/10`), e sem o par `active:` que o toque exige.
 *
 * Onze avisos tonais do app são feitos à mão contra quatro que usam este
 * componente. Isso não é desleixo das telas: é o componente não tendo as peças.
 *
 * ## A marca fala aqui, e por um fio
 *
 * `variant="brand"` é a caixa neutra com o arco-íris de 2px na aresta
 * inline-start. Ela existe porque este componente e a `AnnouncementBar` são as
 * duas superfícies onde o produto fala sobre **si mesmo**, e nenhuma das duas
 * tinha voz: um "temos novidade" só podia sair de `tone="info"`, o azul da
 * rampa de **estado**. `info` é fato sobre o dinheiro da pessoa; a novidade não
 * é um estado dela. A mecânica e as medições estão no valor `brand` do eixo
 * `variant`, abaixo. **Nasce sem consumidor no app**, por decisão do dono: só
 * catálogo, como o `Stepper` já está.
 */
const alertVariants = cva(
  [
    "group/alert relative grid w-full items-start gap-y-0.5",
    // A coluna do ícone deixou de ser um número fixo (`calc(var(--spacing)*4)`)
    // e virou a mesma medida que o ícone: uma variável, declarada pelo `size`,
    // que a grade e o `svg` leem. Antes, mudar o corpo do ícone exigia lembrar
    // de mudar a largura da coluna no outro extremo da string.
    "has-[>svg]:grid-cols-[var(--alert-icon)_1fr]",
    // O raio é do **componente**, não da variante: `variant` decide a moldura
    // (ter borda ou não), e canto não é moldura. Ele estava dentro dela, e o
    // resultado era medível — `soft` saía 14px e `plain` 10px, dois alertas
    // lado a lado com cantos diferentes. E ele também não desce com o `size`,
    // pela mesma razão que o `data-[size=sm]:rounded-md` saiu do
    // `NativeSelect`: raio diferente por degrau é desvio, e nenhum outro
    // controle do sistema o faz.
    "rounded-xl",
    // O deslocamento do ícone **é por degrau**, e a conta é `(entrelinha −
    // ícone) / 2`: no `md`, (20 − 16) / 2 = 2px; no `sm`, (16 − 14) / 2 = 1px.
    // Ele vivia aqui cravado em 2px e servia só o `md` — medido, todo alerta
    // `sm` saía com o ícone 1px abaixo do centro da primeira linha.
    "[&>svg]:size-(--alert-icon) [&>svg]:shrink-0 [&>svg]:text-current",
  ],
  {
    variants: {
      /**
       * A cor, e ela agora chega ao **texto**, não só ao ícone.
       *
       * Antes o tom pintava a superfície e a borda, e aí o `AlertTitle`
       * carimbava `text-foreground` e o `AlertDescription` carimbava
       * `text-muted-foreground` por cima — de modo que a tinta do tom só
       * alcançava o `svg`. Um alerta destrutivo tinha três cores de texto e
       * nenhuma delas era a do alerta.
       *
       * Medido: cinza sobre o tingido dá 5,1–5,7:1 (passa na norma, e por isso
       * não era um defeito de acessibilidade); a tinta tonal dá 6,9–10,8:1. O
       * problema era de coerência, não de contraste — cinza sobre superfície
       * colorida lê como texto que caiu ali por acidente.
       */
      tone: {
        default: "border-border bg-card text-card-foreground",
        info: "border-info/30 bg-info-muted text-info-muted-foreground",
        success:
          "border-success/30 bg-success-muted text-success-muted-foreground",
        warning:
          "border-warning/30 bg-warning-muted text-warning-muted-foreground",
        destructive:
          "border-destructive/35 bg-destructive-muted text-destructive-muted-foreground",
      },
      /**
       * A forma. `soft` é o aviso com moldura própria — o padrão, e o que se
       * usa solto no conteúdo. `plain` é o mesmo tingido sem borda, para dentro
       * de um formulário ou de um diálogo, onde a moldura já é de outro e mais
       * uma só acrescenta um retângulo. `brand` é a caixa neutra com a régua de
       * arco-íris na aresta, para quando quem fala é o produto e não o dado —
       * e por isso ela não aceita `tone`.
       */
      variant: {
        soft: "border",
        plain: "border-0",
        /**
         * **O brilho de marca**: a caixa neutra em repouso, e o arco-íris
         * acendendo num arco da borda conforme o ponteiro passa pela tela, com
         * um leve borrão. A referência é o `GlowingEffect` da Aceternity, e os
         * números são do dono: blur 2, spread 40, proximity 24, borda 2, zona
         * morta 0,01.
         *
         * **Isto não é o giro da rodada 100.** Lá o degradê rodava sozinho,
         * num laço de 12s/6s, e o dono o recusou inteiro ("péssimo, feio e
         * horrível"); aqui nada se move sem o ponteiro se mover — a forma que
         * a rodada 98 sancionou, a cor ancorada na ponta do mouse.
         *
         * **Ele substituiu a régua de 2px que esta variante tinha.** O custo
         * está dito e é real: sem ponteiro não há brilho, então no telefone o
         * `brand` fica visualmente igual ao `soft` de `tone="default"`.
         * Devolver a régua como repouso é uma linha, se isso incomodar.
         *
         * A mecânica e as quatro medições que a desenharam moram em
         * `@utility alert-glow`, no `globals.css`. As duas que se veem daqui:
         * **`isolate` é obrigatório** (sem ele o pseudo de `z` negativo cai
         * atrás do fundo de um ancestral e some, medido), e o núcleo chapado
         * em `padding-box` é o que impede o degradê de cobrir o texto, já que
         * numa raiz de empilhamento o filho de `z` negativo pinta **por cima**
         * do fundo do elemento.
         */
        brand: [
          "brand-rainbow-image alert-glow isolate",
          "border border-border bg-card text-card-foreground",
        ].join(" "),
      },
      size: {
        sm: "px-3 py-2 text-xs [--alert-icon:--spacing(3.5)] has-[>svg]:gap-x-2 [&>svg]:translate-y-px",
        md: "px-4 py-3 text-sm [--alert-icon:--spacing(4)] has-[>svg]:gap-x-3 [&>svg]:translate-y-0.5",
      },
    },
    defaultVariants: {
      tone: "default",
      variant: "soft",
      size: "md",
    },
  }
)

/**
 * O `role` sai do tom em vez de ser sempre `"alert"`.
 *
 * `role="alert"` é uma região viva **assertiva**: o leitor de tela interrompe o
 * que estiver dizendo para anunciar o conteúdo. Isso é certo para um erro que
 * acabou de acontecer e errado para um painel explicativo que já estava na
 * página — e o catálogo usa exatamente esse painel em 87 páginas, o que fazia o
 * leitor interromper a cada carga. `status` é a região viva educada.
 *
 * Continua sobrescrevível: `{...props}` vem depois.
 */
/** A zona morta no centro, e a folga em volta da caixa. Números do dono. */
const GLOW_ZONA_MORTA = 0.01
/**
 * A folga em volta da caixa em que o brilho acende. A referência usa 64 e o
 * dono pediu 50 na primeira passada; depois de ver funcionando, pediu **mais
 * perto** — o alvo grande acendia o aviso antes de o ponteiro ter intenção de
 * chegar nele. 24 é menos da metade, e ainda dá o gesto de aproximação.
 */
const GLOW_PROXIMIDADE = 24

/**
 * O movimento, com os números da referência: `movementDuration` 2 e a ease
 * `[0.16, 1, 0.3, 1]` — que por acaso é o `--ease-out` desta casa, mas fica
 * escrita aqui porque quem interpola é o tween e não o CSS.
 */
const GLOW_DURACAO = 2
const GLOW_EASE = [0.16, 1, 0.3, 1] as const

/** Junta o ref da medição com o que o consumidor passou. */
function composeRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node)
      else if (ref) (ref as React.RefObject<T | null>).current = node
    }
  }
}

/**
 * O ponteiro do brilho de marca.
 *
 * **Este é o único listener em `document` do design system, e a razão é o
 * `proximity`.** O `Button` segue o ponteiro com handlers no próprio elemento
 * (`onPointerMove`), porque a lava dele só existe sob o cursor. Aqui o aviso
 * tem de acender com o mouse **perto, não em cima** — 24px de folga —, e um
 * handler local nunca vê o que acontece fora da caixa. O custo é contido: o
 * listener só monta com `variant="brand"`, e "uma por tela" o mantém em um.
 *
 * **Sem ponteiro fino, não monta nada.** A pergunta é `(hover: hover)`, a
 * mesma que o Tailwind faz nos `hover:` — num telefone o efeito não existe e
 * também não custa. É por isso que não há par `active:`: não há o que mostrar
 * no toque, ao contrário de um realce de botão.
 *
 * **A rolagem recalcula o estado, e não só a geometria.** Rolar move a caixa
 * sem mover o ponteiro: sem guardar a última posição e refazer a conta, o
 * aviso fica aceso apontando para onde o mouse não está mais. Medido antes do
 * conserto — 260px de rolagem com o ponteiro parado, a caixa saindo de
 * `top 255` para `-5`, e `--alert-glow-active` teimando em `1`. É a mecânica
 * da referência (`handleScroll = () => handleMove()`), com `capture: true` a
 * mais, para pegar rolagem dentro de container.
 *
 * **O trabalho é coalescido num `requestAnimationFrame`**, cancelado no
 * unmount. Isso não é o `rAF` em laço que esta casa proíbe — aquele se
 * re-agenda para fazer polling; este agenda um quadro por rajada. E é o que
 * torna barato ler `getBoundingClientRect()` a cada quadro em vez de cachear:
 * o cache só se invalidava em `scroll` e `resize`, e a caixa também se move
 * por reflow, por acordeão abrindo, por imagem carregando.
 *
 * **O ângulo acumula em vez de saltar.** Ao cruzar 180° o valor cru pula de
 * 179 para -179, e uma transição interpolaria o caminho longo — o arco daria a
 * volta pelo lado errado. A conta envolve a diferença em [-180, 180) com o
 * módulo duplo, porque o `%` do JavaScript preserva o sinal (a referência erra
 * isto: `((alvo - atual + 180) % 360) - 180` devolve valores abaixo de -180
 * quando a diferença é bem negativa).
 *
 * Nada de estado React: a posição vai para o CSS por `setProperty`, sem
 * re-render, como o `Button` e o marcador do `Tabs` já fazem.
 */
function useAlertGlow(ativo: boolean) {
  const ref = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (!ativo) return
    if (!window.matchMedia("(hover: hover)").matches) return
    const el = ref.current
    if (!el) return

    // **Movimento reduzido tem de ser perguntado à mão aqui.** O bloco global
    // de `prefers-reduced-motion` encurta *transição* de CSS, e um tween de JS
    // escapa dele — é o precedente que a rodada do `ThemeToggle` registrou ao
    // trocar transição por WAAPI. Com a preferência ligada o arco vai direto
    // para o ângulo, sem percurso: seguir o ponteiro não é animação e continua.
    const semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches

    // A última posição conhecida do ponteiro. **Ela é o que faz a rolagem
    // funcionar**: quando a página rola, o mouse não se mexeu, mas a caixa sim
    // — e o estado do brilho tem de ser recalculado a partir daqui. Sem isso o
    // aviso fica aceso apontando para onde o ponteiro não está mais. Medido
    // antes do conserto: rolando 260px com o ponteiro parado, a caixa ia de
    // `top 255` para `-5` e `--alert-glow-active` continuava em `1`.
    let ultimaX = 0
    let ultimaY = 0
    let temPosicao = false
    let quadro = 0
    let tween: { stop: () => void } | null = null

    const calcular = () => {
      quadro = 0
      if (!temPosicao) return

      // **A caixa é lida aqui dentro, a cada quadro, e não cacheada.** O cache
      // só se invalidava em `scroll` e `resize`; ler no quadro mata a
      // obsolescência de qualquer origem — um acordeão abrindo, uma imagem
      // carregando, um reflow. Com o `rAF` coalescendo, é uma leitura por
      // quadro no máximo.
      const { left, top, width, height } = el.getBoundingClientRect()
      const cx = left + width / 2
      const cy = top + height / 2

      // A zona morta do centro. Com 0,01 ela é quase nada — fica porque é um
      // número do dono, e porque é ela que evita o arco girando louco quando o
      // ponteiro cruza exatamente o centro.
      if (
        Math.hypot(ultimaX - cx, ultimaY - cy) <
        0.5 * Math.min(width, height) * GLOW_ZONA_MORTA
      ) {
        el.style.setProperty("--alert-glow-active", "0")
        return
      }

      const perto =
        ultimaX > left - GLOW_PROXIMIDADE &&
        ultimaX < left + width + GLOW_PROXIMIDADE &&
        ultimaY > top - GLOW_PROXIMIDADE &&
        ultimaY < top + height + GLOW_PROXIMIDADE

      el.style.setProperty("--alert-glow-active", perto ? "1" : "0")
      if (!perto) return

      // **O ângulo atual sai do DOM, não de um acumulador**, e isso é a
      // mecânica da referência: ela lê `--start` do `element.style`, que é o
      // valor que o **tween** escreveu no último quadro. Um acumulador guarda
      // o *alvo*, não onde a animação está — e era isso que o meu fazia.
      const atual =
        parseFloat(el.style.getPropertyValue("--alert-glow-start")) || 0
      const alvo = (180 * Math.atan2(ultimaY - cy, ultimaX - cx)) / Math.PI + 90

      // O caminho curto. A referência escreve
      // `((alvo - atual + 180) % 360) - 180`, que devolve valores abaixo de
      // −180 quando a diferença é bem negativa, porque o `%` do JavaScript
      // preserva o sinal — e aí o arco dá a volta pelo lado errado. O módulo
      // duplo conserta, e é a única divergência do fonte dela.
      const delta = ((((alvo - atual + 180) % 360) + 360) % 360) - 180

      // **Quem anima é o `animate` do `motion`, como na referência.** Havia
      // aqui uma transição de CSS sobre uma `@property` registrada, e eu
      // defendi por três rodadas que era equivalente. Era dedução minha, não
      // medição — e o dono disse três vezes que a animação não era a dela.
      // Agora ela **é**, por construção.
      //
      // O tween anterior é parado antes do novo: a referência não para, e
      // deixa até ~120 tweens vivos escrevendo a mesma variável. A trajetória
      // é a mesma (cada tween novo parte do valor atual do DOM), e parar evita
      // o vazamento.
      tween?.stop()
      if (semMovimento) {
        el.style.setProperty("--alert-glow-start", String(atual + delta))
        return
      }
      tween = animate(atual, atual + delta, {
        duration: GLOW_DURACAO,
        ease: [...GLOW_EASE],
        onUpdate: (v) => {
          el.style.setProperty("--alert-glow-start", String(v))
        },
      })
    }

    // **`requestAnimationFrame` aqui coalesce, não faz laço.** O precedente
    // proibido nesta casa é o `rAF` que se **re-agenda** — o polling contínuo
    // que o marcador do `Tabs` recusou. Este agenda no máximo um quadro por
    // rajada de eventos e o cancela no unmount; `pointermove` pode disparar
    // mais de uma vez por quadro, e sem isto o trabalho inteiro rodava em cada
    // um. É o que a referência faz.
    const agendar = () => {
      if (quadro) cancelAnimationFrame(quadro)
      quadro = requestAnimationFrame(calcular)
    }

    const aoMover = (e: PointerEvent) => {
      ultimaX = e.clientX
      ultimaY = e.clientY
      temPosicao = true
      agendar()
    }

    // Rolar e redimensionar movem a caixa sem mover o ponteiro, então os dois
    // recalculam **tudo** a partir da última posição — não só a geometria.
    //
    // **`capture: true` é a única divergência deliberada da referência**, e ela
    // corrige um caso que a referência erra: `scroll` não borbulha, mas
    // captura, então sem isto a rolagem **dentro de um container** passa
    // despercebida e só a da janela conta. É a mesma solução que
    // `use-close-on-scroll` já usa nesta casa.
    const aoRolar = () => agendar()

    document.addEventListener("pointermove", aoMover, { passive: true })
    window.addEventListener("scroll", aoRolar, { capture: true, passive: true })
    window.addEventListener("resize", aoRolar)
    return () => {
      tween?.stop()
      if (quadro) cancelAnimationFrame(quadro)
      document.removeEventListener("pointermove", aoMover)
      window.removeEventListener("scroll", aoRolar, { capture: true })
      window.removeEventListener("resize", aoRolar)
    }
  }, [ativo])

  return ref
}

type AlertBase = React.ComponentProps<"div"> &
  VariantProps<typeof alertVariants>

/**
 * **`tone` e `variant="brand"` são excludentes**, e o tipo cobra — o precedente
 * é o `Progress`, que faz o mesmo com `tone`, `bands` e `brand`.
 *
 * Os dois respondem à mesma pergunta (que cor tem o aviso) por caminhos
 * diferentes: `tone` é a gravidade de um estado do dado da pessoa, e a marca
 * não tem gravidade nenhuma. Aceitar os dois juntos seria aceitar que um não
 * faz nada — e aqui seria literal, porque `variant` vem depois de `tone` no
 * `cva` e o `tailwind-merge` apaga a superfície tonal.
 *
 * **E `brand` também não aceita `size="sm"`, por geometria medida.** O recuo
 * vertical da régua não é escolha: ele vem do `rounded-xl`. Num raio de 12px, a
 * 8px do topo a aresta da caixa recua 0,69px e a ponta arredondada absorve a
 * sobra; a 4px ela recua **3,06px**, e um fio de 2px em `start-0` ficaria
 * inteiramente fora da superfície pintada, flutuando na margem. Ou seja, 8px é
 * o piso. Numa caixa `sm` de 34px isso deixa 16px de fio — **47% da altura**,
 * medido, que lê como tracinho e não como régua.
 *
 * Reduzir o raio no degrau é o desvio que este arquivo já recusou ("raio
 * diferente por degrau"), e recortar o fio pelo raio (`overflow-hidden` com
 * `inset-y-0`) o transforma numa lente de ~10px de miolo cheio na mesma caixa.
 * Não há geometria boa, e a razão é que **não há caso**: `sm` é o aviso que
 * fala com um campo, e a marca fala uma vez por tela, no corpo inteiro. O tipo
 * diz isso em vez de entregar um degrau torto.
 */
type AlertProps =
  | (AlertBase & { variant?: "soft" | "plain" })
  | (AlertBase & { variant: "brand"; tone?: never; size?: "md" })

function Alert({ className, size, role, ref, ...props }: AlertProps) {
  const { tone, variant, ...rest } = props as AlertBase
  const glowRef = useAlertGlow(variant === "brand")

  // Em `brand` a superfície **é** a neutra, e `data-tone` diz isso: é ele que
  // manda o cinza do `AlertDescription` seguir a superfície em vez da tinta
  // tonal a 85%. Um atributo que mente sobre a cor pintada é pior que nenhum.
  const tomEfetivo = variant === "brand" ? "default" : (tone ?? "default")

  return (
    <div
      data-slot="alert"
      ref={composeRefs(glowRef, ref)}
      data-tone={tomEfetivo}
      role={
        // Só o destrutivo interrompe, como na `AnnouncementBar`. Marca não
        // interrompe, e cai no `status` pela mesma linha.
        role ?? (tomEfetivo === "destructive" ? "alert" : "status")
      }
      className={cn(alertVariants({ tone, variant, size }), className)}
      {...rest}
    />
  )
}

/**
 * O resumo — a linha que o olho lê para decidir se continua, e a primeira que o
 * leitor de tela anuncia.
 *
 * `col-start-2` passou a depender de existir um ícone. Ele era incondicional, e
 * num alerta sem `svg` a grade tem uma coluna só: a linha ia parar numa segunda
 * coluna implícita, de largura zero, e funcionava por acidente da especificação
 * de grid. Agora a regra diz o que quer dizer.
 */
function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "font-heading font-medium tracking-tight text-balance",
        "group-has-[>svg]/alert:col-start-2",
        className
      )}
      {...props}
    />
  )
}

/**
 * O detalhe sob o resumo.
 *
 * A tinta é a do próprio alerta a 85% — dois níveis dentro de **um** matiz, em
 * vez de um cinza que não pertence à superfície. No tom `default` a superfície
 * é neutra, e aí o cinza é a resposta certa: é a única exceção, e ela está
 * escrita.
 */
function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-current/85 group-data-[tone=default]/alert:text-muted-foreground",
        "group-has-[>svg]/alert:col-start-2",
        "[&_p]:leading-relaxed",
        className
      )}
      {...props}
    />
  )
}

/**
 * A linha de ação no pé do alerta.
 *
 * Ela existe porque a ação **herda a tinta do aviso**, e sem um lugar isso
 * vira paleta reimportada na tela: o dashboard escrevia
 * `border-destructive/40 bg-transparent text-destructive-muted-foreground
 * hover:bg-destructive/10` num `Button` dentro do `AlertDescription` — cinco
 * classes que só valiam para um dos cinco tons, e um `hover:` sem `active:`.
 *
 * **Ela é só a linha.** Quem veste o botão é o `AlertAction`, logo abaixo — e
 * essa divisão é a correção desta rodada. Antes, esta peça alcançava o botão
 * por **seletor descendente** (`[&_[data-slot=button]]:` cinco vezes) e o
 * JSDoc *pedia* que quem chamasse escrevesse `variant="tertiary"`. Pedir não é
 * garantir, e "compensar geometria por seletor é sintoma de que falta uma
 * peça" — a peça era o botão.
 */
function AlertActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-actions"
      className={cn(
        "mt-3 flex flex-wrap items-center gap-2",
        "group-has-[>svg]/alert:col-start-2",
        className
      )}
      {...props}
    />
  )
}

/**
 * A ação do alerta — um `Button` que não escolhe cor nenhuma.
 *
 * **Ele existe porque as seis chamadas escreviam a mesma string**:
 * `type="button" variant="tertiary" size="sm"`, nas três demonstrações do
 * catálogo, na página da folha e no dashboard. Quando o catálogo escreve a
 * anatomia, falta uma peça — e aqui faltava a de baixo: `alert.tsx` importava
 * **zero** componentes e se dizia molécula.
 *
 * **A pele sai de `currentColor`**, então a mesma linha serve os cinco tons sem
 * nomear nenhum. `tertiary` é o degrau certo porque ele já não preenche nada em
 * repouso; desde a rodada 99 o hover dele é um disco que nasce sob o ponteiro
 * (`@utility button-fill`), e o que se corrige aqui é só a **cor** desse disco:
 * `--button-fill-color` em `currentColor` a 10%, em vez do cinza de `--muted`.
 * O par `active:` do toque vem da própria variante.
 *
 * **O par `dark:` continua obrigatório**, e não por cor: o `tertiary` declara a
 * sua cor de disco também sob `dark:`, e `.dark *` mais classe vence a classe
 * simples daqui no tema escuro. Medido na página do catálogo: sem o par, o
 * disco do alerta saía no cinza de `--muted`. `currentColor` inverte sozinho,
 * mas a regra que o lê precisa vencer a do peso.
 *
 * `asChild` continua valendo: uma das seis chamadas é um `<Link>` dentro do
 * botão, e o tipo o carrega.
 */
function AlertAction({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      data-slot="alert-action"
      type="button"
      variant="tertiary"
      size="sm"
      className={cn(
        "border-current/25 bg-transparent text-current",
        // A cor do disco de preenchimento do `tertiary` (rodada 99) na pele do
        // alerta: `currentColor` a 10%, o mesmo tom de antes, agora nascendo
        // sob o ponteiro. **O par `dark:` é obrigatório mesmo com `currentColor`
        // invertendo sozinho** — não por cor, por especificidade: o `tertiary`
        // declara `dark:[--button-fill-color:…]`, que é `.dark *` mais classe e
        // vence esta classe simples no tema escuro. Medido: sem o par, o disco
        // do alerta saía no cinza de `--muted` no escuro. É a mesma armadilha
        // que o `hover:bg-current/10` anterior já tinha pago.
        "[--button-fill-color:color-mix(in_oklab,currentColor_10%,transparent)]",
        "dark:[--button-fill-color:color-mix(in_oklab,currentColor_10%,transparent)]",
        "hover:text-current active:text-current",
        className
      )}
      {...props}
    />
  )
}

export {
  Alert,
  AlertAction,
  AlertActions,
  AlertDescription,
  AlertTitle,
  alertVariants,
}
