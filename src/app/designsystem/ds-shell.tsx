"use client"

import { Bars3Icon } from "@heroicons/react/16/solid"
import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { AppThemeToggle } from "@/components/settings/app-theme-toggle"
import { AppLogo } from "@/components/layout/app-logo"
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
      <div className="mx-auto flex w-full max-w-7xl gap-8 px-4 sm:px-6 lg:px-8">
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
      </div>
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
  return (
    <header className="sticky top-0 z-(--z-sticky) h-14 border-b border-border bg-background/85 backdrop-blur">
      {/* Esquerda e direita são as duas `flex-1`, e a busca no meio não encolhe.
          Com a busca sendo a única flexível, ela centralizava no espaço que
          sobrava — e como a marca cresceu, "o que sobrava" deixou de ser
          simétrico: o campo ficou 38px à direita do centro da janela. Dois
          lados elásticos de peso igual centralizam de verdade. */}
      <div className="mx-auto flex h-full w-full max-w-7xl items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <Sheet>
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
          <SheetContent side="left" className="w-72 gap-0 overflow-hidden p-0">
            <SheetTitle className="sr-only">
              Navegação do design system
            </SheetTitle>
            <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-border px-4 pr-14">
              <AppLogo className="size-6 shrink-0" />
              <span className="truncate font-heading text-sm font-semibold tracking-tight text-foreground">
                Design system
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
          </SheetContent>
        </Sheet>

        {/* A marca identifica o produto e o texto identifica a seção. Não repete
            "Finance" ao lado do símbolo: seria dizer duas vezes a mesma coisa
            numa barra de 56px que ainda precisa caber num telefone.

            O símbolo é 28px e o nome 16px: a 24/14 anteriores a marca ficava
            miúda numa barra de 56, sem peso para ancorar o canto. */}
        <Link
          href="/designsystem"
          // Sem `shrink-0`: com ele o link mantinha a largura inteira dentro do
          // grupo elástico, e a 320px o nome corria por baixo do switch de tema
          // em vez de truncar.
          className="-ml-1 flex min-w-0 items-center gap-2.5 rounded-md px-1 py-1 outline-none transition-opacity hover:opacity-70 focus-visible:ring-3 focus-visible:ring-ring/70 active:opacity-70"
        >
          <AppLogo className="size-7 shrink-0" />
          {/* O nome fica visível também no telefone. Ele estava escondido
              porque a busca ocupava o meio da barra; agora que ela é um ícone
              no fim, sobra espaço. O `truncate` com o `min-w-0` do grupo
              resolve a largura de 320px: o nome encurta em vez de empurrar os
              controles para fora. */}
          {/* `leading-tight`, e não `leading-none`: com entrelinha 1 a caixa da
              linha mede exatamente o corpo da fonte, e o `overflow-hidden` que
              vem junto do `truncate` decepava a descendente do "g" de Design. */}
          <span className="truncate font-heading text-base leading-tight font-semibold tracking-tight text-foreground">
            Design system
          </span>
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
      </div>
    </header>
  )
}

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
        <DsNavLink href="/designsystem" active={pathname === "/designsystem"}>
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
            return (
              <DsNavLink
                key={item.slug}
                href={href}
                active={pathname === href}
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

function DsNavLink({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "truncate rounded-md px-2 py-1.5 text-sm transition-colors",
        // Em ponteiro grosso o link vai aos 44px que a página
        // /designsystem/mobile-toque exige. Um catálogo que reprova na própria
        // regra não é fonte de verdade de nada.
        "pointer-coarse:flex pointer-coarse:min-h-11 pointer-coarse:items-center",
        active
          ? "bg-accent font-medium text-accent-foreground"
          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground active:bg-accent/60"
      )}
    >
      {children}
    </Link>
  )
}
