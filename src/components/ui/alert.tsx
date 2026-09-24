"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { composeRefs, useBrandGlow } from "@/hooks/use-brand-glow"

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
       * A forma, e são duas. `soft` é o aviso com moldura própria — o padrão, e
       * o que se usa em qualquer lugar. `brand` é a caixa neutra com o brilho
       * de arco-íris na borda, para quando quem fala é o produto e não o dado
       * — e por isso ela não aceita `tone`.
       *
       * **Havia um `plain`**, tingido sem borda, para dentro de formulário ou
       * diálogo "onde a moldura já é de outro e mais uma só acrescenta um
       * retângulo". Ele tinha 8 chamadas em 4 telas de acesso e **saiu a pedido
       * do dono**: o custo é que esses avisos passaram a desenhar a própria
       * borda dentro do formulário, que é exatamente o que ele evitava. Se o
       * retângulo a mais incomodar, o caminho de volta é uma linha (`border-0`)
       * — e a razão de ele ter existido fica escrita aqui.
       */
      variant: {
        soft: "border",
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
         * `@utility brand-glow`, no `globals.css` (e o ponteiro é `useBrandGlow`,
         * em `hooks/use-brand-glow.ts`, que o `Card` também veste). As duas que se veem daqui:
         * **`isolate` é obrigatório** (sem ele o pseudo de `z` negativo cai
         * atrás do fundo de um ancestral e some, medido), e o núcleo chapado
         * em `padding-box` é o que impede o degradê de cobrir o texto, já que
         * numa raiz de empilhamento o filho de `z` negativo pinta **por cima**
         * do fundo do elemento.
         */
        brand: [
          "brand-rainbow-image brand-glow isolate",
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
  | (AlertBase & { variant?: "soft" })
  | (AlertBase & { variant: "brand"; tone?: never; size?: "md" })

function Alert({ className, size, role, ref, ...props }: AlertProps) {
  const { tone, variant, ...rest } = props as AlertBase
  const glowRef = useBrandGlow(variant === "brand")

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
