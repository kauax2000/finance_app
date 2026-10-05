"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronLeftIcon } from "@heroicons/react/16/solid"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton"
import { H1, Muted } from "@/components/ui/typography"
import { cn } from "@/lib/utils"

/**
 * A página dividida: um campo de um lado, uma coluna de conteúdo do outro.
 *
 * É o casco de uma tela que existe **fora** da casca do app — acesso, convite,
 * qualquer página que tenha algo a mostrar antes de pedir alguma coisa. Abaixo
 * da quebra as duas partes empilham: o campo vira o cartão do topo (ou uma
 * faixa, ou nada — `asideMobile`) e a coluna ocupa o resto.
 *
 * **Não há cartão, e é a decisão que ele carrega.** O cartão centrado existe
 * para dar moldura a um formulário solto no meio de um fundo cinza; com o campo
 * segurando metade da tela, a moldura já está dada, e um retângulo com borda
 * dentro dela é uma segunda fronteira para o mesmo limite — a mesma conta que
 * tirou o fio das tiras do `Card`. A coluna é a superfície.
 *
 * **O conteúdo do campo é de quem chama** — marca, números, prova são
 * conteúdo de produto, e conteúdo de produto não mora em `ui/`. A **geometria**
 * dele (margem, canto, a área segura do notch, coluna no desktop e cartão no
 * telefone) é daqui desde a rodada 235: `SplitShellAside`. No app, quem o veste
 * é o `AuthBrandPanel`.
 *
 * **A quebra é do casco, e não da janela** (rodada 235): a divisão responde a
 * uma container query (`@container/split-shell`, 48rem), então o casco se
 * divide certo num painel, numa prévia ou num iframe. Era `lg:` — e a página
 * do catálogo mostrava o layout de desktop numa caixa de 810px.
 */

type SplitShellSide = "start" | "end"
type SplitShellRatio = "wide" | "even" | "narrow"
type SplitShellAsideMobile = "card" | "band" | "logo" | "hidden"

const SplitShellContext = React.createContext<{
  side: SplitShellSide
  asideMobile: SplitShellAsideMobile
}>({ side: "start", asideMobile: "card" })

/**
 * As colunas, escritas por extenso porque classe montada não chega ao CSS.
 * `wide` é o `5fr 6fr` de sempre: o campo em ~45% e a coluna, que tem trabalho
 * a fazer, a mais larga. `narrow` dá o terço ao campo, para telas com mais
 * formulário; `end` espelha.
 */
const COLUNAS: Record<SplitShellSide, Record<SplitShellRatio, string>> = {
  start: {
    wide: "@3xl/split-shell:grid-cols-[5fr_6fr]",
    even: "@3xl/split-shell:grid-cols-2",
    narrow: "@3xl/split-shell:grid-cols-[1fr_2fr]",
  },
  end: {
    wide: "@3xl/split-shell:grid-cols-[6fr_5fr]",
    even: "@3xl/split-shell:grid-cols-2",
    narrow: "@3xl/split-shell:grid-cols-[2fr_1fr]",
  },
}

/**
 * **O campo recolhe com o teclado** (rodada 235): no toque, abaixo da quebra,
 * um campo de texto focado na coluna esconde o campo de marca, e o formulário
 * sobe para a parte da tela que o teclado deixa. É CSS (`:has(:focus)`), sem
 * ouvinte; sair do campo devolve o cartão.
 */
const RECOLHE_COM_O_TECLADO =
  "pointer-coarse:@max-3xl/split-shell:group-has-[[data-slot=split-shell-main]_:is(input:not([type=checkbox]):not([type=radio]),textarea):focus]/split-shell:hidden"

function SplitShell({
  aside,
  title,
  description,
  back,
  footer,
  side = "start",
  ratio = "wide",
  asideMobile = "card",
  step,
  children,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  /** O campo. Vista o `SplitShellAside` para ter a geometria do casco. */
  aside: React.ReactNode
  title: string
  /** Uma linha. Título sobre descrição é par de identidade — sem `gap`. */
  description?: React.ReactNode
  /** O topo da coluna: o `SplitShellBack`. */
  back?: React.ReactNode
  /** O pé da coluna: o `SplitShellFooter`. */
  footer?: React.ReactNode
  /** De que lado mora o campo. A ordem de leitura não muda. */
  side?: SplitShellSide
  /** Quanto da largura o campo leva: 5:6, 1:1 ou 1:2. */
  ratio?: SplitShellRatio
  /**
   * O campo no telefone: o cartão, uma faixa só com a marca, a marca sozinha
   * sobre a página (`logo`, sem superfície), ou nada.
   */
  asideMobile?: SplitShellAsideMobile
  /**
   * O passo de um fluxo (login → código → nova senha). Ao mudar, título e
   * conteúdo entram deslizando e o foco vai ao título — quem usa leitor de
   * tela ouve a tela nova, em vez de ficar num botão que sumiu.
   */
  step?: string | number
}) {
  const titulo = React.useRef<HTMLHeadingElement>(null)
  // O passo de antes, e não um "já montou": o `StrictMode` roda o efeito duas
  // vezes na montagem, e o segundo roubaria o foco para o título ao abrir.
  const anterior = React.useRef(step)
  React.useEffect(() => {
    if (anterior.current === step) return
    anterior.current = step
    titulo.current?.focus({ preventScroll: true })
  }, [step])

  const contexto = React.useMemo(() => ({ side, asideMobile }), [side, asideMobile])

  return (
    <SplitShellContext value={contexto}>
      <div
        data-slot="split-shell"
        data-side={side}
        data-ratio={ratio}
        data-aside-mobile={asideMobile}
        className={cn(
          "group/split-shell @container/split-shell min-h-svh",
          // As áreas seguras por variável, e não `env()` direto: a prévia num
          // iPhone do catálogo (um iframe, onde `env()` vale zero) as emula.
          "[--split-shell-safe-top:env(safe-area-inset-top,0px)] [--split-shell-safe-bottom:env(safe-area-inset-bottom,0px)]",
          className
        )}
        {...props}
      >
        <div className={cn("flex min-h-svh flex-col @3xl/split-shell:grid", COLUNAS[side][ratio])}>
          {/* O campo fica preso na altura da janela enquanto uma coluna longa
              rola (o cadastro) — **campo preso**, rodada 235. */}
          <div
            data-slot="split-shell-aside-slot"
            className={cn(
              "flex flex-col @3xl/split-shell:sticky @3xl/split-shell:top-0 @3xl/split-shell:h-svh",
              side === "end" && "@3xl/split-shell:order-last",
              asideMobile === "hidden" && "@max-3xl/split-shell:hidden",
              RECOLHE_COM_O_TECLADO
            )}
          >
            {aside}
          </div>
          {/* **A coluna em três faixas** (rodada 235): o voltar em cima, o
              conteúdo no meio e o pé embaixo. No telefone o conteúdo encosta
              no topo, logo abaixo do campo; centrado na vertical ele flutuava
              a 223px dele (medido a 375×812) e o campo deixava de ancorar coisa
              nenhuma. A sobra que fica embaixo é onde o teclado sobe. */}
          <main
            data-slot="split-shell-main"
            className={cn(
              "flex flex-1 flex-col px-6 pt-6 pb-[calc(--spacing(6)+var(--split-shell-safe-bottom))] @xl/split-shell:px-10",
              // Sem campo em cima, a coluna é quem encosta no notch.
              asideMobile === "hidden" &&
                "@max-3xl/split-shell:pt-[calc(--spacing(6)+var(--split-shell-safe-top))]",
              "@3xl/split-shell:min-h-svh @3xl/split-shell:px-12 @3xl/split-shell:py-8"
            )}
          >
            {back ? (
              <div data-slot="split-shell-back-row" className="mb-4 flex @3xl/split-shell:mb-0">
                {back}
              </div>
            ) : null}
            {/* No telefone o pé vem logo depois do conteúdo; empurrado para o
                fim da tela, ele ficava a uma tela de distância do formulário. */}
            <div className="flex flex-col @3xl/split-shell:flex-1 @3xl/split-shell:justify-center @3xl/split-shell:py-10">
              <Container
                key={step}
                size="sm"
                stack="section"
                className={cn(step !== undefined && "split-shell-step")}
              >
                <header>
                  <H1 ref={titulo} tabIndex={-1} className="outline-none">
                    {title}
                  </H1>
                  {description ? <Muted>{description}</Muted> : null}
                </header>
                {children}
              </Container>
            </div>
            {footer ? (
              <Container size="sm" className="pt-8">
                {footer}
              </Container>
            ) : null}
          </main>
        </div>
      </div>
    </SplitShellContext>
  )
}

/**
 * A geometria do campo (rodada 235): o cartão do telefone, com margem em volta
 * e descendo abaixo do notch — quem chama não deve saber que existe um notch —,
 * e a coluna do desktop, com a margem do lado de fora e a
 * coluna de conteúdo trazendo o próprio recuo do lado de dentro.
 *
 * `surface="brand"` é a `@utility brand-field` (o arco-íris com grão e
 * vinheta) e `muted` é a superfície neutra. **Nenhum texto corrido mora direto
 * sobre o `brand`**: o que se lê vive em `Card`, e a única exceção é a marca.
 *
 * `brand` é o que fica sempre — a marca, no topo; os filhos são o resto, e na
 * faixa do telefone (`asideMobile="band"`) só a marca aparece.
 */
function SplitShellAside({
  surface = "brand",
  brand,
  logo,
  className,
  children,
  ...props
}: React.ComponentProps<"aside"> & {
  surface?: "brand" | "muted"
  /** A marca: o que a faixa do telefone mantém. */
  brand?: React.ReactNode
  /**
   * A marca do `asideMobile="logo"`, sobre a página e não sobre o campo — o
   * wordmark em arco-íris, por exemplo, que no campo seria branco. Sem ela, a
   * `brand` herda a tinta do texto.
   */
  logo?: React.ReactNode
}) {
  const { side, asideMobile } = React.useContext(SplitShellContext)
  const soLogo = asideMobile === "logo"
  return (
    <aside
      data-slot="split-shell-aside"
      data-surface={surface}
      className={cn(
        "flex flex-1 flex-col gap-5 rounded-2xl",
        surface === "brand" ? "brand-field" : "bg-muted text-foreground",
        // A marca sozinha: sem superfície no telefone, no recuo da coluna.
        soLogo &&
          "@max-3xl/split-shell:rounded-none @max-3xl/split-shell:bg-transparent @max-3xl/split-shell:bg-none @max-3xl/split-shell:p-0 @max-3xl/split-shell:text-foreground @max-3xl/split-shell:shadow-none @max-3xl/split-shell:mx-6 @max-3xl/split-shell:mb-0 @max-3xl/split-shell:mt-[calc(--spacing(6)+var(--split-shell-safe-top))] @xl/split-shell:@max-3xl/split-shell:mx-10",
        // O cartão desce **inteiro** abaixo do notch: com a área segura no
        // recuo de dentro, a borda de cima ficava sob a ilha.
        "mx-4 mt-[calc(--spacing(4)+var(--split-shell-safe-top))] mb-4 p-5",
        asideMobile === "band" && "@max-3xl/split-shell:py-3",
        "@3xl/split-shell:m-5 @3xl/split-shell:mt-5 @3xl/split-shell:justify-between @3xl/split-shell:px-8 @3xl/split-shell:py-10",
        side === "end" ? "@3xl/split-shell:ms-0" : "@3xl/split-shell:me-0",
        className
      )}
      {...props}
    >
      {brand ? (
        // `self-start`: um `<svg>` é elemento substituído, e `w-auto` não o
        // protege do `align-items: stretch` da coluna — a marca sairia com a
        // largura do campo, centrada dentro da própria caixa.
        <div
          data-slot="split-shell-aside-brand"
          className={cn("flex self-start", soLogo && logo && "@max-3xl/split-shell:hidden")}
        >
          {brand}
        </div>
      ) : null}
      {soLogo && logo ? (
        <div data-slot="split-shell-aside-logo" className="flex self-start @3xl/split-shell:hidden">
          {logo}
        </div>
      ) : null}
      <div
        data-slot="split-shell-aside-body"
        className={cn(
          "flex min-h-0 flex-col gap-5 @3xl/split-shell:flex-1 @3xl/split-shell:justify-end",
          (asideMobile === "band" || soLogo) && "@max-3xl/split-shell:hidden"
        )}
      >
        {children}
      </div>
    </aside>
  )
}

/**
 * O pé da coluna (rodada 235): "Não tem uma conta? Criar conta", os termos, a
 * ajuda. Os links de dentro vestem o acento e sublinham no cursor — nenhuma
 * tela escreve `text-primary-accent underline-offset-4` à mão.
 */
function SplitShellFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="split-shell-footer"
      className={cn(
        "flex flex-col gap-2 text-sm text-muted-foreground",
        "[&_a]:font-medium [&_a]:text-primary-accent [&_a]:underline-offset-4 [&_a]:hover:underline [&_a]:active:underline",
        className
      )}
      {...props}
    />
  )
}

/**
 * O voltar do topo da coluna (rodada 235): "‹ Entrar" na recuperação de senha
 * e no convite. É um link de verdade, para o `href` — sem histórico: quem
 * chega por um e-mail não tem "anterior" no app.
 */
function SplitShellBack({
  href,
  children = "Voltar",
  className,
}: {
  href: string
  children?: React.ReactNode
  className?: string
}) {
  return (
    <Button
      asChild
      variant="tertiary"
      size="sm"
      className={cn("-ms-2.5 pointer-coarse:min-h-10", className)}
    >
      <Link data-slot="split-shell-back" href={href}>
        <ChevronLeftIcon data-icon="inline-start" aria-hidden />
        {children}
      </Link>
    </Button>
  )
}

/**
 * A espera do casco inteiro (rodada 235): o campo e a coluna com o título, a
 * descrição, os campos e o botão, no `SkeletonGroup`. Para a espera só do
 * formulário, dentro de um casco já montado, o app tem o `AuthFormSkeleton`.
 */
function SplitShellSkeleton({
  fields = 2,
  ratio = "wide",
  side = "start",
  className,
}: {
  fields?: number
  ratio?: SplitShellRatio
  side?: SplitShellSide
  className?: string
}) {
  return (
    <SkeletonGroup
      data-slot="split-shell-skeleton"
      label="Carregando…"
      className={cn("@container/split-shell min-h-svh", className)}
    >
      <div className={cn("flex min-h-svh flex-col @3xl/split-shell:grid", COLUNAS[side][ratio])}>
        <div className={cn("flex", side === "end" && "@3xl/split-shell:order-last")}>
          <Skeleton
            className={cn(
              "m-4 h-40 flex-1 rounded-2xl @3xl/split-shell:m-5 @3xl/split-shell:h-auto",
              side === "end" ? "@3xl/split-shell:ms-0" : "@3xl/split-shell:me-0"
            )}
          />
        </div>
        <div className="flex flex-1 flex-col px-6 py-6 @xl/split-shell:px-10 @3xl/split-shell:justify-center @3xl/split-shell:px-12">
          <Container size="sm" stack="section">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-9 w-40" />
              <Skeleton shape="text" className="w-64 max-w-full" />
            </div>
            <div className="flex flex-col gap-(--space-block)">
              {Array.from({ length: fields }, (_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
              <Skeleton className="h-10 w-full" />
            </div>
          </Container>
        </div>
      </div>
    </SkeletonGroup>
  )
}

export { SplitShell, SplitShellAside, SplitShellBack, SplitShellFooter, SplitShellSkeleton }
