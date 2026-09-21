"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-[color,background-color,border-color,box-shadow,opacity,translate] duration-(--duration-fast) ease-(--ease-out) outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/70 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&>[data-slot=button-label]]:first-letter:uppercase [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      // A hierarquia é uma escada, e ela desce em peso visual, não só em nome:
      // `primary` preenche de preto (branco no escuro), `secondary` preenche
      // de cinza, `tertiary` não preenche nada. Uma tela tem um `primary` só.
      //
      // `outline` fica de fora da escada de propósito: é a exceção, para
      // quando um controle precisa de contorno próprio (um par de navegação,
      // um filtro que alterna) e nenhum dos três degraus serve. `brand`
      // também fica de fora: é a mesma tecla do `primary` com o arco-íris da
      // marca em volta, para **um** CTA de marca por tela — entrar, começar.
      // O arco-íris não entra no `primary` porque um acento em todo botão
      // deixa de ser acento — e isso deixou de ser só argumento na rodada 90,
      // quando três candidatos de primário com arco-íris foram montados ao
      // vivo, medidos e recusados pelo dono. O número que sobrou: com a
      // lavagem acesa no cursor o rótulo branco cai a **4,87:1** no tema
      // claro, contra **18,97** da tecla chapada.
      //
      // `success` e `warning` foram removidos: nomeavam um estado, não um
      // peso, e nenhuma tela do app chegou a usá-los. Estado de sucesso e de
      // atenção continua sendo trabalho do `Badge` e do `Alert`.
      variant: {
        // **O primário é chapado, e acende em lava sob o cursor** (rodada 98).
        // Em repouso é só o preenchimento — sem contorno, plinto, luz, véu ou
        // sombra: ele foi tecla da rodada 78 à 97 e o dono pediu o relevo
        // inteiro fora. Sob o cursor, o arco-íris da marca aparece **atrás de
        // um vidro** da cor do botão, focado na ponta do mouse e drifting como
        // lava-lamp; a receita inteira mora em `@utility primary-wash`, no
        // `globals.css`, e o que a variante faz é ligá-la.
        //
        // **Quem liga é `--button-wash`** (uma `@property` tipada, 0 → 1) no
        // cursor, no toque e com o popover aberto — e não um `hover:bg-*`: o
        // fundo não troca de cor, o vidro afina. Por isso a lista de
        // `transition` é restatada inteira com `--button-wash` no fim: o
        // `tailwind-merge` troca a classe, não acrescenta.
        //
        // **A órbita pausa em vez de desligar** (`animation-play-state`), a
        // decisão do `brand`: ligar a animação só dentro do `hover:` faria a
        // lava saltar ao ponto zero a cada entrada.
        //
        // **Nada aqui é pseudo-elemento.** O `ButtonGroup` esconde o `::before`
        // do primário, e um `::after` em `z` negativo fica atrás do próprio
        // `background`. As cinco camadas são `background-image` do elemento.
        //
        // A posição do ponteiro chega por `--button-mx`/`--button-my`, escritas
        // pelo `Button` em `onPointerMove`/`onPointerDown` (ver abaixo).
        //
        // **O clique não tem animação própria**: afunda 1px pelo
        // `active:translate-y-px` da base, como `secondary` e `tertiary`.
        // Enviando (`aria-busy`) a opacidade fica cheia, para "salvando" não
        // ler como "desabilitado".
        //
        // A rodada 90 recusou arco-íris no primário, e o `AGENTS.md` escrevia
        // que ele não o veste. O dono pediu de novo com outro desenho — chapado,
        // texto na cor do sistema, cor atrás de vidro com teto medido por
        // `scripts/primary-wash-contrast.mjs` — e a decisão é dele.
        primary:
          "primary-wash bg-primary text-primary-foreground hover:[--button-wash:1] active:[--button-wash:1] aria-expanded:[--button-wash:1] [animation-play-state:paused] hover:[animation-play-state:running] active:[animation-play-state:running] transition-[color,background-color,border-color,box-shadow,opacity,translate,--button-wash] aria-busy:disabled:opacity-100",
        // A tecla de marca. Três camadas, e a ordem delas é a razão do
        // arranjo: o botão em si não pinta nada (`isolate` o faz raiz de
        // empilhamento; a base já traz `border-transparent`), o `::before`
        // é o preenchimento **e** o contorno — o preto em `padding-box` sobre
        // o arco-íris em `border-box`, com 1px de borda transparente entre
        // os dois, que é por onde o arco-íris aparece —, e o `::after` é o
        // halo: o mesmo degradê, borrado, uma camada abaixo.
        //
        // Por que não `bg-primary` no próprio botão: numa raiz de
        // empilhamento o fundo do elemento pinta **antes** dos filhos de
        // `z-index` negativo, então um `::before` a `-z-10` cobriria a tecla
        // em vez de ficar atrás dela. O preenchimento vai para o pseudo por
        // isso, e o hover troca a variável que ele lê.
        //
        // Sem grão: numa área de 32px o grão é ruído, não textura. Sem a
        // sombra da tecla: o contorno arco-íris já é a aresta.
        //
        // **O arco-íris gira sob o cursor, e ele pausa em vez de desligar.**
        // `brand-rainbow-live` fica aplicada sempre, com
        // `animation-play-state: paused`; o cursor e o toque a põem em
        // `running`. Ligar a animação só dentro do `hover:` faria o ângulo
        // **voltar a 0°** ao sair — pausada, ela congela onde estava e retoma
        // dali. `--brand-spin` é o botão de velocidade da utility; 6s num
        // botão de 32px lê como giro, enquanto os 12s do padrão (o splash)
        // leem como respiração.
        //
        // O giro chega ao contorno **e** ao halo sem camada nova: os dois leem
        // `--brand-rainbow`, que é composto aqui a partir de `--brand-angle`.
        // Movimento reduzido já está coberto pelo bloco global, que isenta só
        // `.animate-spin` e `.animate-pulse` — `brand-rotate` é cortada, e o
        // botão não gira.
        //
        // `brand-rainbow-image` **não é redundante**, e não se apaga: ela é
        // quem declara `--brand-rainbow` no botão. O degradê saiu do `:root`
        // porque um `var()` dentro de uma propriedade personalizada é
        // substituído onde ela é **declarada** — no `:root`, o
        // `var(--brand-angle)` congelava em 0deg e o arco-íris nunca girava.
        // Os dois pseudo-elementos herdam daqui o valor já substituído, então
        // basta a classe no elemento. Ver `@utility brand-rainbow-image` em
        // `globals.css`.
        brand:
          "brand-rainbow-image brand-rainbow-live [--brand-spin:6s] [animation-play-state:paused] hover:[animation-play-state:running] active:[animation-play-state:running] relative isolate text-primary-foreground [--brand-fill:var(--primary)] hover:[--brand-fill:var(--primary-hover)] active:[--brand-fill:var(--primary-hover)] aria-expanded:[--brand-fill:var(--primary-hover)] before:absolute before:-inset-px before:-z-10 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(var(--brand-fill),var(--brand-fill))_padding-box,var(--brand-rainbow)_border-box] before:transition-[background] before:duration-(--duration-fast) after:absolute after:-inset-1 after:-z-20 after:rounded-[inherit] after:bg-(image:--brand-rainbow) after:opacity-50 after:blur-md after:transition-opacity after:duration-(--duration-fast) hover:after:opacity-80 active:after:opacity-80 aria-busy:disabled:opacity-100",        // A mesma tecla de marca **sem o halo**: só o contorno de arco-íris,
        // que continua girando sob o cursor. É o `brand` para onde ele não
        // cabe — uma barra, um cabeçalho, um par de ações — porque o halo do
        // `::after` sangra 4px para fora da caixa e encosta no vizinho.
        //
        // Ele não é um degrau a menos na escada: continua fora dela, e
        // continua **um por tela**. O que muda é quanto espaço ele pede.
        brandOutline: "brand-rainbow-image brand-rainbow-live [--brand-spin:6s] [animation-play-state:paused] hover:[animation-play-state:running] active:[animation-play-state:running] relative isolate text-primary-foreground [--brand-fill:var(--primary)] hover:[--brand-fill:var(--primary-hover)] active:[--brand-fill:var(--primary-hover)] aria-expanded:[--brand-fill:var(--primary-hover)] before:absolute before:-inset-px before:-z-10 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(var(--brand-fill),var(--brand-fill))_padding-box,var(--brand-rainbow)_border-box] before:transition-[background] before:duration-(--duration-fast) aria-busy:disabled:opacity-100",

        // Sem borda visível — e sem o anel vazado que havia antes. O culpado
        // não era a borda transparente da base, era o `bg-clip-padding` que a
        // acompanha: ele recortava o preenchimento na caixa de padding, então o
        // cinza pintava 30px dentro de uma caixa de 32. `bg-clip-border` faz o
        // preenchimento passar por baixo da borda e chegar à aresta.
        //
        // Preferido a `border-0` porque a borda de 1px é o que mantém a
        // geometria igual entre as variantes: com `border-0` o rótulo do
        // `secondary` recuava para 12px contra os 13px das outras, e os chips
        // que alternam entre `secondary` e `outline` saltavam 2px ao selecionar.
        secondary:
          "button-fill bg-clip-border bg-secondary text-secondary-foreground [--button-fill-color:var(--secondary-hover)] hover:[--button-fill:100%] active:[--button-fill:100%] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground transition-[color,background-color,border-color,box-shadow,opacity,translate,--button-fill] duration-(--duration-slow) ease-(--ease-emphasized)",
        // **Os quatro pesos que preenchem — este, `secondary`, `outline` e
        // `destructive` — não trocam de cor no cursor: a cor do hover preenche
        // o botão num disco que nasce sob o ponteiro** (rodada 99). A receita
        // é `@utility button-fill`, no `globals.css`; cada peso declara só a
        // cor (`--button-fill-color`, com par `dark:` onde o hover tinha um) e
        // liga o raio (`--button-fill`, 0% → 100%) no cursor, no toque e — onde
        // o expandido pintava — em `aria-expanded`. A lista de `transition` é
        // restatada com `--button-fill`, porque o `tailwind-merge` troca a
        // classe em vez de acrescentar.
        //
        // **O ritmo é próprio, e é exceção registrada** (`RITMO_PROPRIO` em
        // `button-primary.test.ts`): `--duration-slow` com `--ease-emphasized`.
        // Com o ritmo da casa o disco era um piscar — `--ease-out` chega a 95%
        // do raio em 60ms dos 150, medido —, e o dono pediu para ser visível.
        // A mesma duração alcança `color` e o `translate` de 1px do clique,
        // que a 300ms não se nota.
        //
        // **Os alfas do escuro e do `destructive` são compostos, não copiados**:
        // o disco pinta por cima do fundo de repouso, então para o resultado
        // ser o mesmo hover de antes a conta é `repouso + a·(1 − repouso) =
        // hover` — `destructive` 0,10 → 0,20 dá 11%, 0,20 → 0,30 dá 12,5%;
        // `outline` escuro 0,30 → 0,50 dá 29%. Copiar o alfa empilharia duas
        // camadas e escureceria.
        //
        // O par `active:` não é redundante com o `hover:`: `hover:` compila
        // dentro de `@media (hover: hover)`, então sem ele **o terciário não
        // devolvia nada ao toque** — em nenhuma das telas que o usam (rodada
        // 29b). O conserto mora aqui e não em cada chamada, que é onde `Toggle`,
        // `Tabs`, `Menubar`, `Item` e `Calendar` já o escreviam à mão.
        tertiary:
          "button-fill [--button-fill-color:var(--muted)] dark:[--button-fill-color:color-mix(in_oklab,var(--muted)_50%,transparent)] hover:[--button-fill:100%] hover:text-foreground active:[--button-fill:100%] active:text-foreground aria-expanded:[--button-fill:100%] aria-expanded:text-foreground transition-[color,background-color,border-color,box-shadow,opacity,translate,--button-fill] duration-(--duration-slow) ease-(--ease-emphasized)",
        outline:
          "button-fill border-border bg-background [--button-fill-color:var(--muted)] dark:[--button-fill-color:color-mix(in_oklab,var(--input-fill)_29%,transparent)] hover:[--button-fill:100%] hover:text-foreground active:[--button-fill:100%] active:text-foreground aria-expanded:[--button-fill:100%] aria-expanded:text-foreground dark:border-input dark:bg-input-fill/30 transition-[color,background-color,border-color,box-shadow,opacity,translate,--button-fill] duration-(--duration-slow) ease-(--ease-emphasized)",
        destructive:
          "button-fill bg-destructive/10 text-destructive-muted-foreground [--button-fill-color:color-mix(in_oklab,var(--destructive)_11%,transparent)] dark:[--button-fill-color:color-mix(in_oklab,var(--destructive)_12.5%,transparent)] hover:[--button-fill:100%] active:[--button-fill:100%] focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 transition-[color,background-color,border-color,box-shadow,opacity,translate,--button-fill] duration-(--duration-slow) ease-(--ease-emphasized)",
        // O link é sublinhado **sempre**: com a marca preta ele tem a cor do
        // texto, e sem o traço nada o distinguia até o cursor passar — o que
        // no toque é nunca. No cursor e no toque o traço **troca de tinta**,
        // do texto para o arco-íris, sem animação nenhuma.
        //
        // **O traço entra pela esquerda e sai pela direita**, na mecânica do
        // `link-button` do 21st que o dono trouxe: um `::after` que vive em
        // `scaleX(0)` com a origem à direita e, no cursor, troca a origem para
        // a esquerda e vai a `scaleX(1)`. A troca de origem é o truque — sem
        // ela o traço encolheria de volta por onde veio.
        //
        // **Não há traço em repouso, e isso reverte a regra do sublinhado
        // permanente.** Decisão do dono, com o custo dito: sem cursor o link
        // deixa de se distinguir do texto ao redor e passa a depender de
        // `--primary-accent`. As rodadas 91 a 93 tinham varrido e recuado
        // antes, e a 94 encerrou pedindo a troca seca; esta é a volta do
        // movimento, agora com o traço ausente em repouso em vez de branco.
        //
        // **Continua não sendo `text-decoration`, e a razão é a mesma emenda
        // medida.** O `::first-letter` da base — a garantia de maiúscula do
        // CTA — cria caixa própria para a primeira letra, e a decoração
        // propagada é pintada em **dois segmentos** com uma costura visível a
        // olho nu. Quatro candidatos foram testados a 22× de ampliação:
        // sublinhar também o `::first-letter`, `text-decoration-skip-ink:
        // none` e mover a decoração para o `<span>` **mantêm** a emenda; só
        // uma pintura própria a elimina. **Quem devolver `underline` aqui traz
        // a emenda junto.**
        //
        // O resto da receita — a âncora `calc(50% + 0.5lh)`, o traço morando
        // no `data-slot="button-label"` para ter a largura do texto e não a do
        // botão, e o porquê de `prefers-reduced-motion` não desligar o traço —
        // está em `@utility link-sweep`, em `globals.css`.
        //
        // `brand-rainbow-image` pela mesma razão do `brand`: ela declara
        // `--brand-rainbow` aqui, que é o que o traço de 1px lê no cursor.
        link: "brand-rainbow-image link-sweep text-primary-accent",
      },
      // Uma escada só, de 24 a 40 em degraus de 4, e a coluna `icon-*` espelha
      // a de texto degrau a degrau: `md` casa com `icon-md`, `lg` com
      // `icon-lg`. Não existe `default` na escala — o nome dizia "o padrão" e
      // apontava para 36, que deixou de ser o padrão; um rótulo que promete
      // uma coisa e entrega outra custa mais caro que um degrau a mais.
      //
      // O padrão é `md` (32), o corpo da ação comum. `lg` (36) é a altura de
      // `Input` e `SelectTrigger`: botão colado a campo pede `lg` e alinha sem
      // ajuste.
      size: {
        xs: "h-6 gap-1 px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 px-2.5 text-control-sm has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        md: "h-8 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        lg: "h-9 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        xl: "h-10 gap-1.5 px-3.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7",
        "icon-md": "size-8",
        "icon-lg": "size-9",
        "icon-xl": "size-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

/**
 * A ordem padrão da pilha da lava — a mesma da `@utility primary-wash`,
 * intercalando frio e quente para nenhuma família tampar a outra. O `Button`
 * a gira a cada entrada do cursor.
 */
const LAVA_STOPS = ["teal", "coral", "indigo", "amber", "magenta", "green", "violet", "blue"] as const

/**
 * Quem segue a ponta do mouse: o primário, pela lava, e os quatro pesos que
 * preenchem a partir do ponteiro (rodada 99). `brand`, `brandOutline` e `link`
 * têm o próprio hover e não leem `--button-mx`.
 */
const PESOS_COM_PONTEIRO = new Set(["primary", "secondary", "tertiary", "outline", "destructive"])

function Button({
  className,
  variant = "primary",
  size = "md",
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  // A lava do primário e o disco dos outros pesos seguem a ponta do mouse: a posição vai para o CSS como
  // `--button-mx`/`--button-my`, em px relativos à caixa, por `setProperty` —
  // sem estado React, sem re-render (o precedente é o marcador do `Tabs`).
  // `pointerdown` escreve também, para o toque acender onde o dedo pousou.
  // Os handlers **compõem** com os de quem chama; com `asChild` o `Slot` os
  // funde no filho e o `currentTarget` é o elemento do consumidor.
  const seguirPonteiro =
    variant && PESOS_COM_PONTEIRO.has(variant)
      ? (e: React.PointerEvent<HTMLElement>) => {
          const el = e.currentTarget
          const r = el.getBoundingClientRect()
          el.style.setProperty("--button-mx", `${e.clientX - r.left}px`)
          el.style.setProperty("--button-my", `${e.clientY - r.top}px`)
        }
      : undefined
  // E a cada entrada a lava começa por outra cor. Todos os blobs cobrem o
  // ponteiro, então quem lê no ponto de entrada é a camada de cima da pilha —
  // fixa no CSS, ela seria sempre a mesma. As oito cores da pilha são
  // variáveis (`--button-blob-1..8`, padrão intercalado na utility), e aqui a
  // atribuição gira por um sorteio: as mesmas oito paradas, em outra ordem.
  //
  // **Nunca a mesma ordem duas vezes seguidas.** Um sorteio puro repete a
  // anterior 1 vez em 8, e o pedido é "sempre uma cor diferente": o passo é
  // sorteado entre 1 e 7 e somado à rotação anterior, guardada no elemento.
  const girarLava = (el: HTMLElement) => {
    const anterior = Number(el.dataset.lavaR ?? 0)
    const passo = 1 + Math.floor(Math.random() * (LAVA_STOPS.length - 1))
    const r = (anterior + passo) % LAVA_STOPS.length
    el.dataset.lavaR = String(r)
    LAVA_STOPS.forEach((_, k) => {
      const parada = LAVA_STOPS[(k + r) % LAVA_STOPS.length]
      el.style.setProperty(`--button-blob-${k + 1}`, `var(--brand-${parada})`)
    })
  }
  const { onPointerMove, onPointerDown, onPointerEnter, ...resto } = props
  const ponteiro = seguirPonteiro
    ? {
        onPointerEnter: (e: React.PointerEvent<HTMLButtonElement>) => {
          onPointerEnter?.(e)
          if (variant === "primary") girarLava(e.currentTarget)
          seguirPonteiro(e)
        },
        onPointerMove: (e: React.PointerEvent<HTMLButtonElement>) => {
          onPointerMove?.(e)
          seguirPonteiro(e)
        },
        onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
          onPointerDown?.(e)
          seguirPonteiro(e)
        },
      }
    : { onPointerMove, onPointerDown, onPointerEnter }

  // A maiúscula inicial é do design system, não de quem escreve o rótulo — mas
  // `::first-letter` não se aplica a `inline-flex`, e o botão precisa ser flex
  // para alinhar ícone. O texto cru vira um `span`, que como item de flex é
  // blocado e aí aceita o pseudo-elemento.
  //
  // Só texto cru. Quem passa um elemento assume a caixa alta — é a saída para
  // um rótulo que precisa de minúscula, como os nomes de prop do catálogo.
  // Com `asChild` nada é embrulhado: o Slot exige um filho único.
  const wrapText = (nodes: React.ReactNode) =>
    React.Children.map(nodes, (child) =>
      typeof child === "string" || typeof child === "number" ? (
        <span data-slot="button-label">{child}</span>
      ) : (
        child
      )
    )

  // Com `asChild` o Slot exige um filho único, então o embrulho desce um nível:
  // clona o filho e embrulha o texto **dele**. Sem isto, `<Button asChild>` com
  // um `<Link>` — que é a forma documentada de botão que navega — ficaria de
  // fora da regra, e ela vale para todo CTA.
  const content =
    asChild && React.isValidElement<{ children?: React.ReactNode }>(children)
      ? React.cloneElement(children, undefined, wrapText(children.props.children))
      : wrapText(children)

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...resto}
      {...ponteiro}
    >
      {content}
    </Comp>
  )
}

export { Button, buttonVariants }
