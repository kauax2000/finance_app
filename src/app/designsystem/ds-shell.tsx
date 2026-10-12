"use client"

import { Bars3Icon } from "@heroicons/react/16/solid"
import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  DialogCloseButton,
  DialogTitle,
} from "@/components/ui/dialog"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { AppWordmark } from "@/components/layout/app-wordmark"
import { Container } from "@/components/ui/container"
import { TopBar } from "@/components/ui/top-bar"
import { CATEGORY_ORDER, REGISTRY } from "./registry"
import { CATEGORY_META } from "./category-meta"
import { DsSearch } from "./ds-search"

/**
 * A casca da documentação: navegação por categoria à esquerda, conteúdo à direita e o `ThemeToggle` do
 * produto no topo (conferir o tema escuro é metade do valor do site), e não uma versão própria.
 */
export function DsShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      {/* Sem o atalho, chegar ao conteúdo por teclado custava 90 paradas de tabulação. */}
      <a
        href="#ds-conteudo"
        className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-2 focus-visible:left-2 focus-visible:z-(--z-toast) focus-visible:rounded-md focus-visible:bg-card focus-visible:px-3 focus-visible:py-2 focus-visible:text-sm focus-visible:font-medium focus-visible:text-foreground focus-visible:ring-3 focus-visible:ring-ring/45"
      >
        Pular para o conteúdo
      </a>
      <DsTopBar />
      <Container size="xl" gutter="page" className="flex gap-8">
        {/* A coluna prende sob a barra do topo; quem rola é o `SidebarContent` de dentro. */}
        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-60 shrink-0 lg:block">
          <DsNav />
        </aside>
        <main id="ds-conteudo" tabIndex={-1} className="min-w-0 flex-1 py-8">
          {children}
        </main>
      </Container>
    </div>
  )
}

/** O `h-14` mora no `header` para a borda entrar nos 56 e o `aside` (`top-14`) não pular 1px ao sair do topo. */
function DsTopBar() {
  const pathname = usePathname()
  const [navAberta, setNavAberta] = React.useState(false)

  /**
     * Navegar fecha o painel. Fechar pela rota (e não por `SheetClose`, que lançaria no desktop, onde `DsNav` é o
     * mesmo componente) cobre também a paleta de busca e o botão de voltar.
     */
  React.useEffect(() => {
    setNavAberta(false)
  }, [pathname])

  // É o `TopBar` (56px, `--z-sticky`); sem calha própria porque o `Container` de dentro traz a do catálogo.
  return (
    <TopBar size="md" surface="glass" gutter="none">
      {/* Esquerda e direita são `flex-1` de peso igual, para a busca no meio centralizar de verdade. */}
      <Container
        size="xl"
        gutter="page"
        className="flex h-full min-w-0 items-center gap-2 sm:gap-3"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        {/* `surface="panel"`: a navegação entra pelo lado em qualquer largura, como o `Sidebar` do app. */}
        <Sheet surface="panel" open={navAberta} onOpenChange={setNavAberta}>
          <SheetTrigger asChild>
            <Button
              variant="tertiary"
              // Mesmo degrau do gatilho de busca ao lado.
              size="icon-md"
              className="lg:hidden"
              aria-label="Abrir navegação do design system"
            >
              <Bars3Icon aria-hidden />
            </Button>
          </SheetTrigger>
          {/* A rolagem é do `div` de dentro: com `overflow-y-auto` na folha o × (`absolute`) rolava junto. A faixa de cima é o território do ×, e o `pr-14` o reserva. */}
          <SheetContent
            side="left"
            // Colado nas bordas, como a navegação rente do app.
            variant="flush"
            // 288px, a largura do `Sidebar` do app no telefone.
            className="w-72 gap-0 overflow-hidden"
            // Clicar no link da página atual não muda a rota, e o painel ficaria aberto.
            onClick={(e) => {
              if ((e.target as HTMLElement).closest("a")) setNavAberta(false)
            }}
          >
            <DialogTitle className="sr-only">
              Navegação do design system
            </DialogTitle>
            <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-border px-4 pr-14">
              <AppWordmark size="sm" rainbow className="shrink-0" aria-hidden />
              <Separator orientation="vertical" />
              {/* O `DialogTitle` já nomeia a folha; a sigla é só o que se vê. */}
              <span className="font-display text-base leading-none text-foreground">
                DS
              </span>
            </div>
            <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4">
              {/* O tema mora aqui no telefone: a barra de 56px já carrega menu, marca e busca. */}
              <div className="flex items-center justify-between gap-3 border-b border-border py-3">
                <span className="text-sm text-muted-foreground">Tema</span>
                <ThemeToggle />
              </div>
              <DsNav />
            </div>
          <DialogCloseButton />
          </SheetContent>
        </Sheet>

        {/* A marca identifica o produto e a sigla a seção; "Design system" por extenso truncava a 320px. */}
        <Link
          href="/designsystem"
          // Sem `shrink-0`: a 320px o link empurrava os controles para fora.
          className="-ml-1 flex min-w-0 items-center gap-2.5 rounded-md px-1 py-1 outline-none transition-opacity hover:opacity-70 focus-visible:ring-3 focus-visible:ring-ring/45 active:opacity-70"
        >
          <AppWordmark rainbow className="shrink-0" aria-hidden />
          <Separator orientation="vertical" />
          {/* `leading-none`; o fio fica nos 16px do `Separator`, que uma altura crua não vence. */}
          <span className="font-display text-lg leading-none text-foreground">
            DS
          </span>
          {/* A sigla vem primeiro porque é o que se vê; a expansão, porque "DS" sozinho não diz nada em voz alta. */}
          <span className="sr-only">Design system</span>
        </Link>
        </div>

        {/* A busca muda de lugar com `order`, sem duplicar o componente (que é dono do diálogo e do `⌘K`). */}
        <div className="flex justify-center max-lg:order-last max-lg:shrink-0 lg:w-full lg:max-w-sm">
          <DsSearch />
        </div>

        {/* No telefone o tema vive na folha de navegação; este grupo faz o par elástico para a busca cair no centro. */}
        <div className="hidden items-center justify-end gap-1 sm:gap-2 lg:flex lg:flex-1">
          <ThemeToggle />
        </div>
      </Container>
    </TopBar>
  )
}

/**
 * Qual rota abriu esta carga de página, e se ela já foi deixada para trás. Mora no módulo porque a lista tem
 * duas instâncias (coluna e folha) e porque o `StrictMode` desfaz e refaz refs; recarregar zera os dois.
 */
let caminhoDeEntrada: string | null = null
let saiuDaEntrada = false

/** A navegação lateral: percorrer o catálogo na ordem. Não busca (buscar e navegar eram o mesmo gesto); a busca é a paleta do cabeçalho. */
function DsNav() {
  const pathname = usePathname()

  /**
     * Traz o item ativo para a parte visível da lista (o browser não guarda o `scrollTop` de um contêiner interno).
     * É `ref` de callback para rodar no commit e não existir no servidor. Anima só na entrada da página: depois
     * é corte seco, e nenhuma superfície modal anima (`data-surface`). Rola o contêiner, e não `scrollIntoView`,
     * que levaria a janela junto.
     */
  const revelarAtivo = React.useCallback(
    (link: HTMLAnchorElement | null) => {
      if (!link) return
      const rolagem = scrollerDe(link)
      if (!rolagem) return

      if (caminhoDeEntrada === null) caminhoDeEntrada = pathname
      else if (pathname !== caminhoDeEntrada) saiuDaEntrada = true

      // `data-surface` e não um `data-slot`: a superfície modal já mudou de componente e o atributo comum não depende do nome.
      const dentroDeUmaSuperficie = rolagem.closest("[data-surface]") !== null
      const animar =
        !saiuDaEntrada && !dentroDeUmaSuperficie && !prefereMenosMovimento()

      const l = link.getBoundingClientRect()
      const r = rolagem.getBoundingClientRect()
      // Já à vista, não mexe: clicar num item da própria lista não sacode a lista.
      if (l.top >= r.top && l.bottom <= r.bottom) return

      // Centraliza, para o item ativo chegar com vizinhos dos dois lados; o browser apara o valor no fim da rolagem.
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

  // O `Sidebar` na versão `plain`, controlado e sempre aberto para o ⌘B não gravar o cookie da barra do app.
  return (
    <SidebarProvider open onOpenChange={() => {}} className="h-full min-h-0">
      <Sidebar collapsible="none" variant="plain" className="w-full">
        <SidebarContent>
          <nav className="flex flex-col pt-2 pb-6" aria-label="Componentes">
            {/* A volta para o índice: a marca no cabeçalho não se anuncia como link. */}
            <SidebarGroup>
              <SidebarMenu>
                <DsNavLink
                  href="/designsystem"
                  active={pathname === "/designsystem"}
                  ref={pathname === "/designsystem" ? revelarAtivo : undefined}
                >
                  Visão geral
                </DsNavLink>
              </SidebarMenu>
            </SidebarGroup>

            {groups.map((group) => {
              const Icon = CATEGORY_META[group.category].Icon
              return (
                <SidebarGroup key={group.category}>
                  {/* O ícone é o da paleta (`category-meta`). */}
                  <SidebarGroupLabel asChild>
                    <h2>
                      <Icon aria-hidden />
                      {group.category}
                    </h2>
                  </SidebarGroupLabel>
                  <SidebarMenu>
                    {group.items.map((item) => {
                      const href = `/designsystem/${item.slug}`
                      const active = pathname === href
                      return (
                        <DsNavLink
                          key={item.slug}
                          href={href}
                          active={active}
                          // Só o ativo carrega o ref: o React chama o do novo ao navegar, que é quando a lista se reposiciona.
                          ref={active ? revelarAtivo : undefined}
                        >
                          {item.name}
                        </DsNavLink>
                      )
                    })}
                  </SidebarMenu>
                </SidebarGroup>
              )
            })}
          </nav>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  )
}

/** O `scroll-behavior: auto !important` do tema vale só para rolagem do CSS; o argumento de `scrollTo` o vence, então a preferência é consultada aqui. */
function prefereMenosMovimento() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

/** O ancestral que de fato rola (o `aside` no desktop, a folha no telefone, onde `scrollHeight` vale zero e a busca segue para cima). */
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
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active}>
        <Link ref={ref} href={href} aria-current={active ? "page" : undefined}>
          <span>{children}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
