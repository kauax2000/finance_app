"use client"

import { Bars3Icon } from "@heroicons/react/16/solid"
import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { barSurfaceClassName } from "@/lib/bar-classes"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  DialogCloseButton,
  DialogTitle,
} from "@/components/ui/dialog"
import { AppThemeToggle } from "@/components/settings/app-theme-toggle"
import { AppWordmark } from "@/components/layout/app-wordmark"
import { Container } from "@/components/ui/container"
import { CATEGORY_ORDER, REGISTRY } from "./registry"
import { DsSearch } from "./ds-search"

/**
 * A casca da documentação: navegação por categoria à esquerda, conteúdo à
 * direita, e o alternador de tema no topo.
 *
 * O alternador existe aqui porque metade do valor deste site é conferir o tema
 * escuro, e sem ele cada verificação vira uma ida às configurações e uma volta.
 * Mas ele é o `AppThemeToggle` do produto, não um segundo controle: um catálogo
 * de design system que inventa a própria versão de algo que o app já tem é a
 * primeira coisa a desmentir o que ele documenta.
 */
export function DsShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      {/* Sem isto, chegar ao conteúdo por teclado custava 90 paradas de
          tabulação: menu, marca, tema, busca e os 87 links da navegação. */}
      <a
        href="#ds-conteudo"
        className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-2 focus-visible:left-2 focus-visible:z-(--z-toast) focus-visible:rounded-md focus-visible:bg-card focus-visible:px-3 focus-visible:py-2 focus-visible:text-sm focus-visible:font-medium focus-visible:text-foreground focus-visible:ring-3 focus-visible:ring-ring/70"
      >
        Pular para o conteúdo
      </a>
      <DsTopBar />
      <Container size="xl" gutter="page" className="flex gap-8">
        {/* `no-scrollbar` é o utilitário que `Sidebar` e `Command` já usam.
            O padding vertical fica no `nav`, e não aqui: padding no contêiner
            de rolagem não rola junto, e o primeiro item nasceria colado no
            topo depois do primeiro gesto. */}
        <aside className="no-scrollbar sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-60 shrink-0 overflow-y-auto lg:block">
          <DsNav />
        </aside>
        <main id="ds-conteudo" tabIndex={-1} className="min-w-0 flex-1 py-8">
          {children}
        </main>
      </Container>
    </div>
  )
}

/**
 * O `h-14` mora no `header`, e não na linha de dentro.
 *
 * Antes o cabeçalho media 57px — 56 da linha mais 1 da borda —, enquanto o
 * `aside` grudava em `top-14`, que é 56. Ao sair do topo, a lateral inteira
 * pulava 1px para cima e ficava com a primeira fileira de pixels atrás da
 * borda: um "scroll" que ninguém pediu, toda vez que a página deixava o zero.
 *
 * Com `box-sizing: border-box`, `h-14` no `header` faz os 56 incluírem a borda,
 * e aí `top-14` e `h-[calc(100dvh-3.5rem)]` no `aside` passam a ser exatos —
 * sem número mágico em lugar nenhum.
 */
function DsTopBar() {
  const pathname = usePathname()
  const [navAberta, setNavAberta] = React.useState(false)

  /**
   * Navegar fecha o painel.
   *
   * O painel é controlado só por isso: `DsNav` é o **mesmo** componente na
   * coluna fixa do desktop e aqui dentro, então envolver os links num
   * `SheetClose` — que é o idioma do Radix — lançaria no desktop, onde não
   * existe painel para fechar.
   *
   * Fechar pela **rota**, e não pelo clique, cobre também quem chega pela
   * paleta de busca com o painel aberto, e pelo botão de voltar do navegador.
   */
  React.useEffect(() => {
    setNavAberta(false)
  }, [pathname])

  // A superfície é a régua de barra, e ela mora em `lib/bar-classes`: opaca de
  // base e translúcida só onde o borrão existe — sem `backdrop-filter`, os 60%
  // deixariam o conteúdo passar por trás do título. Ela estava escrita à mão
  // aqui até a fileira do `Menubar` precisar da mesma receita.
  return (
    <header
      className={cn(
        "sticky top-0 z-(--z-sticky) h-14 border-b border-border",
        barSurfaceClassName
      )}
    >
      {/* Esquerda e direita são as duas `flex-1`, e a busca no meio não encolhe.
          Com a busca sendo a única flexível, ela centralizava no espaço que
          sobrava — e como a marca cresceu, "o que sobrava" deixou de ser
          simétrico: o campo ficou 38px à direita do centro da janela. Dois
          lados elásticos de peso igual centralizam de verdade. */}
      <Container
        size="xl"
        gutter="page"
        className="flex h-full items-center gap-2 sm:gap-3"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        {/* `Sheet`: painel de borda a partir de 768px, gaveta abaixo — e é
            gaveta também para navegação, que é a inversão da rodada 64. O
            gatilho é `lg:hidden`, então entre 768 e 1024px o que abre é o
            painel da esquerda, e `side` vale ali. */}
        <Sheet open={navAberta} onOpenChange={setNavAberta}>
          <SheetTrigger asChild>
            <Button
              variant="tertiary"
              // Mesmo degrau do gatilho de busca ao lado: os dois são ícone na
              // mesma barra, e 36 contra 32 deixava a linha torta no telefone.
              size="icon-md"
              className="lg:hidden"
              aria-label="Abrir navegação do design system"
            >
              <Bars3Icon aria-hidden />
            </Button>
          </SheetTrigger>
          {/* A rolagem é do `div` de dentro, não do `SheetContent`.
              Com `overflow-y-auto` na própria folha, o botão de fechar — que é
              `absolute` dentro dela — rolava junto e sumia depois de uns
              poucos itens, numa lista de 88.

              E a faixa de cima existe para dar um lugar a esse botão. Sem ela o
              × ficava por cima do primeiro item da lista (medido: o botão em
              y 12–40 e "Visão geral" em y 16–60, cruzando em x 240–264), e
              empurrar o conteúdo para baixo não resolveria — ao rolar, os itens
              voltariam a passar por baixo dele. Com a faixa, o × tem território
              próprio e nada mais entra ali.

              O `pr-14` é o território: 56px reservados à direita, para o título
              não correr por baixo do botão. */}
          <SheetContent
            side="left"
            fillMobileViewport
            // `md:w-72` e não `w-72`: o ramo gaveta é `inset-x-0`, e uma
            // largura ali venceria o `right: 0` — a gaveta sairia com 288px
            // ancorada à esquerda em vez de ocupar a tela. O `md` é o mesmo
            // 768 de `useIsMobile`, então a largura só existe onde existe o
            // painel.
            className="gap-0 overflow-hidden md:w-72"
            // O efeito acima cobre toda navegação, menos uma: clicar no link da
            // página em que já se está não muda a rota, e o painel ficaria
            // aberto sobre a página que ele acabou de dizer que é a atual.
            onClick={(e) => {
              if ((e.target as HTMLElement).closest("a")) setNavAberta(false)
            }}
          >
            <DialogTitle className="sr-only">
              Navegação do design system
            </DialogTitle>
            <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-border px-4 pr-14">
              <AppWordmark size="sm" className="shrink-0" aria-hidden />
              <Separator orientation="vertical" />
              {/* O `DialogTitle` acima já diz "Navegação do design system" ao
                  leitor de tela; aqui a sigla é só o que se vê. */}
              <span className="font-display text-base leading-none text-foreground">
                DS
              </span>
            </div>
            <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4">
              {/* O switch de tema mora aqui no telefone, e não na barra de
                  cima: são 56px que já carregam menu, marca e busca, e o tema
                  é a única dessas coisas que não se usa o tempo todo.
                  Primeira linha porque é ajuste, não navegação — vem antes da
                  lista, separado dela por um fio. */}
              <div className="flex items-center justify-between gap-3 border-b border-border py-3">
                <span className="text-sm text-muted-foreground">Tema</span>
                <AppThemeToggle />
              </div>
              <DsNav />
            </div>
          <DialogCloseButton />
          </SheetContent>
        </Sheet>

        {/* A marca identifica o produto, o fio separa, e a sigla identifica a
            seção — três peças que não competem porque nenhuma repete a outra.

            "Design system" por extenso não cabia: o lockup mede ~101px e a
            barra de 56 ainda carrega menu e busca, então a 320px o rótulo
            truncava para "Design sy…". A sigla resolve por subtração, e ela vem
            na serifa da marca de propósito — é o mesmo corpo de display do
            lockup ao lado, o que faz o par ler como uma assinatura só em vez de
            marca mais legenda.

            A serifa a 16px contraria o "nada abaixo de 24px" que a fundação de
            tipografia pede para texto de display. Duas maiúsculas não são
            texto: não há descendente para se perder nem palavra para soletrar,
            e o que sobra da Ledger nesse corpo é justamente o contraste de
            traço que amarra a sigla ao lockup. */}
        <Link
          href="/designsystem"
          // Sem `shrink-0`: com ele o link mantinha a largura inteira dentro do
          // grupo elástico, e a 320px empurrava os controles para fora.
          className="-ml-1 flex min-w-0 items-center gap-2.5 rounded-md px-1 py-1 outline-none transition-opacity hover:opacity-70 focus-visible:ring-3 focus-visible:ring-ring/70 active:opacity-70"
        >
          <AppWordmark className="shrink-0" aria-hidden />
          <Separator orientation="vertical" />
          {/* `leading-none` porque não há ascendente nem descendente para a
              caixa da linha acomodar — só as duas maiúsculas.

              O fio fica nos 16px do `Separator`: altura crua não vence o
              `data-[orientation=vertical]:h-4` dele, que é classe com variante
              e não entra no mesmo grupo do merge. 16 contra as 24 do lockup é
              a proporção certa de qualquer forma — o fio marca a junta, não
              divide a barra. */}
          <span className="font-display text-lg leading-none text-foreground">
            DS
          </span>
          {/* O nome acessível fica "DS Design system": a sigla vem primeiro
              porque é o que se vê — quem navega por voz diz o que está escrito
              — e a expansão vem atrás porque "DS" sozinho não diz nada em voz
              alta. */}
          <span className="sr-only">Design system</span>
        </Link>
        </div>

        {/* A busca muda de lugar com a largura, e o `order` faz isso sem
            duplicar o componente — que é dono do diálogo e do atalho de teclado,
            e em duas cópias registraria dois ouvintes para o mesmo `⌘K`.

            No desktop ela ocupa o meio: é a tarefa primária de uma superfície de
            leitura, e no centro ela é a mesma em todas as 88 páginas. Abaixo de
            `lg` não há meio para ocupar — vira ícone no fim da barra, depois do
            tema, onde o polegar já está. */}
        <div className="flex justify-center max-lg:order-last max-lg:shrink-0 lg:w-full lg:max-w-sm">
          <DsSearch />
        </div>

        {/* No telefone o tema vive na folha de navegação, então este grupo só
            existe a partir de `lg` — e é ele que faz o par elástico com a
            esquerda para a busca cair no centro exato. */}
        <div className="hidden items-center justify-end gap-1 sm:gap-2 lg:flex lg:flex-1">
          <AppThemeToggle />
        </div>
      </Container>
    </header>
  )
}

/**
 * Qual rota abriu esta carga de página, e se ela já foi deixada para trás.
 *
 * Mora no módulo, e não num `useRef`, por dois motivos. A lista é renderizada
 * em duas instâncias — a coluna do desktop e a folha do telefone —, e as duas
 * precisam da mesma resposta. E o `StrictMode` do Next em desenvolvimento
 * simula um desmonte e uma remontagem, o que **desfaz e refaz os refs**: um
 * simples booleano de "já animei" seria gasto pela montagem descartada, e a
 * animação nunca apareceria em dev. Comparar a rota sobrevive a isso, porque a
 * rota das duas montagens é a mesma.
 *
 * Recarregar a página reavalia o módulo e zera os dois.
 */
let caminhoDeEntrada: string | null = null
let saiuDaEntrada = false

/**
 * A navegação lateral: percorrer o catálogo na ordem, categoria por categoria.
 *
 * Ela **não** busca mais. O campo que ficava aqui filtrava esta lista, então
 * buscar e navegar eram o mesmo gesto e um desfazia o outro: achar "Cores"
 * escondia as outras 87 entradas, e voltar à navegação exigia limpar o campo.
 * Procurar virou a paleta do cabeçalho; aqui ficou o que a lista sempre soube
 * fazer, que é mostrar onde você está e o que vem ao lado.
 */
function DsNav() {
  const pathname = usePathname()

  /**
   * Trazer o item ativo para a parte visível da lista.
   *
   * São 89 entradas numa coluna que rola sozinha, e o browser não guarda o
   * `scrollTop` de um contêiner interno: recarregar em `/designsystem/toolbar`
   * devolvia a lista no topo, com o item ativo umas quinze telas abaixo. Quem
   * chega por link, por recarga ou pela paleta de busca não faz ideia de onde
   * está no catálogo.
   *
   * É `ref` de callback e não `useEffect` por dois motivos. Ele roda no commit,
   * já com a lista medida, então a viagem começa no primeiro quadro em vez de
   * esperar um ciclo. E callback de ref não existe no servidor, o que dispensa
   * o `useLayoutEffect` que o Next avisaria estar rodando em vão na
   * renderização de servidor.
   *
   * A rolagem só é **animada na entrada** — a carga da página, com a coluna já
   * à vista. Ali a viagem responde uma pergunta: no corte seco a lista aparecia
   * no meio do catálogo, e não dava para saber se ela tinha rolado ou se o item
   * ativo por acaso morava ali.
   *
   * Depois disso, corte seco. Navegar é gesto de quem já sabe para onde vai, e
   * **nenhuma superfície modal anima**: ela mesma está entrando na tela, e uma
   * lista rolando por baixo de um painel que chega são dois movimentos
   * disputando a atenção — sem contar que o começo da viagem acontece antes de
   * o painel terminar de abrir, então metade dela nem é vista. Vale para o
   * painel de borda, para a folha e para a gaveta, e a checagem é pelo
   * `data-surface` que as três carregam.
   *
   * Rola o contêiner, e não com `scrollIntoView`: este último rola **todos** os
   * ancestrais roláveis, e levaria a janela junto — a coluna é `sticky`, e
   * mover a página para acertar a lista é o oposto do pedido.
   */
  const revelarAtivo = React.useCallback(
    (link: HTMLAnchorElement | null) => {
      if (!link) return
      const rolagem = scrollerDe(link)
      if (!rolagem) return

      if (caminhoDeEntrada === null) caminhoDeEntrada = pathname
      else if (pathname !== caminhoDeEntrada) saiuDaEntrada = true

      // `data-surface` e não um `data-slot` específico: a superfície modal do
      // telefone já se chamou `sheet-content` e hoje pode ser `panel`, `sheet`
      // ou `drawer`. Amarrar a checagem a um nome fez a animação voltar assim
      // que a navegação trocou de componente — o atributo que todas carregam
      // não tem esse problema.
      const dentroDeUmaSuperficie = rolagem.closest("[data-surface]") !== null
      const animar =
        !saiuDaEntrada && !dentroDeUmaSuperficie && !prefereMenosMovimento()

      const l = link.getBoundingClientRect()
      const r = rolagem.getBoundingClientRect()
      // Já à vista, não mexe. É o que faz clicar num item da própria lista não
      // sacudir a lista embaixo do ponteiro.
      if (l.top >= r.top && l.bottom <= r.bottom) return

      // Centraliza, para o item ativo chegar com vizinhos dos dois lados — a
      // lista responde "onde estou" melhor encostada no meio que na borda. O
      // browser apara o valor no fim da rolagem, então não há caso especial
      // para item perto do topo ou do fim.
      const destino =
        rolagem.scrollTop + l.top - r.top - (r.height - l.height) / 2

      rolagem.scrollTo({ top: destino, behavior: animar ? "smooth" : "auto" })
    },
    [pathname]
  )

  const groups = React.useMemo(
    () =>
      CATEGORY_ORDER.map((category) => ({
        category,
        items: REGISTRY.filter((e) => e.category === category),
      })).filter((g) => g.items.length > 0),
    []
  )

  return (
    <nav className="flex flex-col pt-4 pb-8" aria-label="Componentes">
      {/* A volta para o índice. Sem ela, sair de uma página de componente e ver
          o catálogo inteiro dependia de acertar a marca no cabeçalho — que não
          se anuncia como link para lugar nenhum. */}
      <div className="flex flex-col gap-0.5 pb-5">
        <DsNavLink
          href="/designsystem"
          active={pathname === "/designsystem"}
          ref={pathname === "/designsystem" ? revelarAtivo : undefined}
        >
          Visão geral
        </DsNavLink>
      </div>

      {groups.map((group) => (
        <div
          key={group.category}
          // O grupo era separado só por `gap-5`, e com 88 itens rolando um vão
          // de 20px não lê como fronteira — lê como um item faltando. O fio é a
          // divisão que o olho pega sem procurar.
          className="flex flex-col gap-0.5 border-t border-border pb-5"
        >
          <h2 className="mb-1 px-2 pt-4 pb-1.5 text-2xs font-semibold tracking-wide text-foreground uppercase">
            {group.category}
          </h2>
          {group.items.map((item) => {
            const href = `/designsystem/${item.slug}`
            const active = pathname === href
            return (
              <DsNavLink
                key={item.slug}
                href={href}
                active={active}
                // Só o ativo carrega o ref. Ao navegar, o React limpa o do item
                // que deixou de ser ativo e chama o do novo — que é exatamente
                // quando a lista precisa se reposicionar.
                ref={active ? revelarAtivo : undefined}
              >
                {item.name}
              </DsNavLink>
            )
          })}
        </div>
      ))}
    </nav>
  )
}

/**
 * O `scroll-behavior: auto !important` que o tema aplica em
 * `prefers-reduced-motion` vale para rolagem disparada pelo CSS; o argumento de
 * `scrollTo` vence a folha de estilo, então a preferência precisa ser
 * consultada aqui, em JavaScript.
 */
function prefereMenosMovimento() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

/**
 * O ancestral que de fato rola.
 *
 * A lista mora em dois contêineres diferentes — o `aside` grudado no desktop e
 * a folha lateral no telefone — e nenhum dos dois é pai direto do link. Subir
 * até achar quem tem transbordo e rolagem cobre os dois sem que a navegação
 * precise saber em qual deles está.
 *
 * No telefone o `aside` é `display: none`, e aí `scrollHeight` e `clientHeight`
 * valem zero: a condição falha sozinha e a busca segue para cima, sem caso
 * especial.
 */
function scrollerDe(node: HTMLElement): HTMLElement | null {
  let atual = node.parentElement
  while (atual) {
    const { overflowY } = getComputedStyle(atual)
    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      atual.scrollHeight > atual.clientHeight
    ) {
      return atual
    }
    atual = atual.parentElement
  }
  return null
}

function DsNavLink({
  href,
  active,
  children,
  ref,
}: {
  href: string
  active: boolean
  children: React.ReactNode
  ref?: React.Ref<HTMLAnchorElement>
}) {
  // O `Button` do sistema — e ele custa **sete** contra-classes, medidas: as
  // quatro abaixo mais as três que neutralizam o hover do `tertiary` no estado
  // ativo. É o mesmo número que fez o `sidebarMenuButtonVariants` ficar cru, e a
  // decisão aqui foi a inversa, tomada com o número na mesa.
  //
  // `variant="secondary"` para o ativo está fora: `bg-accent` derruba
  // `bg-secondary`, mas `hover:bg-secondary-hover` **sobrevive**, e o item ativo
  // passaria a mudar de cor sob o cursor.
  return (
    <Button
      asChild
      variant="tertiary"
      size="md"
      className={cn(
        // Contra-classe 1 e 2. `justify-center` centraliza o rótulo; e
        // `font-medium` da base apagaria a distinção do item ativo, cujo peso é
        // metade do sinal.
        "justify-start font-normal",
        // Contra-classe 3. `inline-flex` não é *block container*, e
        // `text-overflow` não se aplica a ele: o `truncate` desce para o filho.
        "min-w-0",
        "rounded-md px-2 text-sm transition-colors",
        // Em ponteiro grosso o link vai aos 44px que a página
        // /designsystem/mobile-toque exige. Um catálogo que reprova na própria
        // regra não é fonte de verdade de nada.
        "pointer-coarse:min-h-11",
        active
          ? // Contra-classes 4 a 6: o `tertiary` acenderia `bg-muted` sobre o
            // item já aceso.
            "bg-accent font-medium text-accent-foreground hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent"
          : // Contra-classe 7. O `dark:hover:bg-muted/50` do `tertiary` não é
            // derrubado por `hover:bg-accent/60` — variante diferente.
            "text-muted-foreground hover:bg-accent/60 hover:text-foreground active:bg-accent/60 dark:hover:bg-accent/60"
      )}
    >
      <Link ref={ref} href={href} aria-current={active ? "page" : undefined}>
        <span className="truncate">{children}</span>
      </Link>
    </Button>
  )
}
