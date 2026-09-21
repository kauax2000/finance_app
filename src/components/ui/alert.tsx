import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

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
       * uma só acrescenta um retângulo.
       */
      variant: {
        soft: "border",
        plain: "border-0",
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
function Alert({
  className,
  tone,
  variant,
  size,
  role,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      data-tone={tone ?? "default"}
      role={
        // Só o destrutivo interrompe, como na `AnnouncementBar`.
        role ?? (tone === "destructive" ? "alert" : "status")
      }
      className={cn(alertVariants({ tone, variant, size }), className)}
      {...props}
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
