"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { MenuIcon, SearchIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { AppThemeToggle } from "@/components/settings/app-theme-toggle"
import { AppLogo } from "@/components/layout/app-logo"
import { CATEGORY_ORDER, REGISTRY, type RegistryEntry } from "./registry"
import { SEARCH_INDEX } from "./search-index"

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
        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-60 shrink-0 overflow-y-auto py-8 lg:block">
          <DsNav />
        </aside>
        <main id="ds-conteudo" tabIndex={-1} className="min-w-0 flex-1 py-8">
          {children}
        </main>
      </div>
    </div>
  )
}

function DsTopBar() {
  return (
    <header className="sticky top-0 z-(--z-sticky) border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Abrir navegação do design system"
            >
              <MenuIcon aria-hidden />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 overflow-y-auto p-0">
            <SheetTitle className="sr-only">
              Navegação do design system
            </SheetTitle>
            <div className="p-4">
              <DsNav />
            </div>
          </SheetContent>
        </Sheet>

        {/* A marca identifica o produto e o texto identifica a seção. Não repete
            "Finance" ao lado do símbolo: seria dizer duas vezes a mesma coisa
            numa barra de 56px que ainda precisa caber num telefone. */}
        <Link
          href="/designsystem"
          className="flex min-w-0 items-center gap-2 rounded-md outline-none transition-opacity hover:opacity-70 focus-visible:ring-3 focus-visible:ring-ring/70 active:opacity-70"
        >
          <AppLogo className="size-6" />
          <span className="truncate font-heading text-sm font-semibold tracking-tight text-foreground">
            Design system
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <AppThemeToggle />
        </div>
      </div>
    </header>
  )
}

/**
 * A navegação e a busca são a mesma coisa: filtrar a lista é o que substitui um
 * índice separado. Com 80 itens, rolar até achar já não funciona.
 */
function DsNav() {
  const pathname = usePathname()
  const [query, setQuery] = React.useState("")

  const groups = React.useMemo(() => {
    const q = normalize(query)
    // A busca alcança o texto que a página ensina, não só o nome do componente.
    // Sem isto, "excluir", "confirmar", "contraste" e "tabular" devolviam zero
    // — em páginas que falam exatamente disso.
    const match = (e: RegistryEntry) =>
      !q ||
      normalize(e.name).includes(q) ||
      normalize(e.slug).includes(q) ||
      normalize(e.description).includes(q) ||
      normalize(SEARCH_INDEX[e.slug] ?? "").includes(q)

    return CATEGORY_ORDER.map((category) => ({
      category,
      items: REGISTRY.filter((e) => e.category === category && match(e)),
    })).filter((g) => g.items.length > 0)
  }, [query])

  return (
    <nav className="flex flex-col gap-5" aria-label="Componentes">
      <div className="relative">
        <SearchIcon
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar"
          aria-label="Buscar no design system"
          className="pl-8"
        />
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-start gap-2 px-2 py-4">
          <p className="text-sm text-foreground">
            Nada encontrado para &ldquo;{query}&rdquo;.
          </p>
          <p className="text-xs text-muted-foreground">
            A busca cobre o nome, a descrição e o texto de cada uma das{" "}
            {REGISTRY.length} páginas.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setQuery("")}
          >
            Limpar busca
          </Button>
        </div>
      ) : null}

      {groups.map((group) => (
        <div key={group.category} className="flex flex-col gap-1">
          <span className="px-2 text-2xs font-medium tracking-wide text-muted-foreground uppercase">
            {group.category}
          </span>
          {group.items.map((item) => {
            const href = `/designsystem/${item.slug}`
            const active = pathname === href
            return (
              <Link
                key={item.slug}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "truncate rounded-md px-2 py-1.5 text-sm transition-colors",
                  // Em ponteiro grosso o link vai aos 44px que a página
                  // /designsystem/mobile-toque exige. Um catálogo que reprova na
                  // própria regra não é fonte de verdade de nada.
                  "pointer-coarse:flex pointer-coarse:min-h-11 pointer-coarse:items-center",
                  active
                    ? "bg-accent font-medium text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground active:bg-accent/60"
                )}
              >
                {item.name}
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}

/** Acentos fora: buscar "acordeao" tem que achar "Accordion" e "Fundações". */
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}
