"use client"

import { MagnifyingGlassIcon } from "@heroicons/react/16/solid"
import * as React from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Kbd } from "@/components/ui/kbd"
import { CATEGORY_ORDER, REGISTRY } from "./registry"
import { SEARCH_INDEX } from "./search-index"

/**
 * Acentos fora dos dois lados da comparação: quem digita "graficos" acha
 * "Gráficos", e quem digita "Gráficos" também.
 */
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
}

/**
 * A busca do catálogo: um gatilho no meio do cabeçalho e a paleta de comandos.
 *
 * Ela saiu da barra lateral por dois motivos. O campo lá filtrava a navegação,
 * então buscar e navegar eram o mesmo gesto e um desfazia o outro: achar
 * "Cores" escondia as outras 87 entradas. E o campo só existia no desktop — no
 * telefone ficava dentro da folha de navegação, atrás de dois toques.
 */
export function DsSearch() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")

  /**
   * `⌘K` e `/` abrem a paleta.
   *
   * `/` é ignorado enquanto se digita em outro campo, senão a barra some do meio
   * de uma palavra. `⌘K` vale sempre: é o gesto que a pessoa faz justamente para
   * sair de onde está.
   */
  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable === true

      const isSlash = event.key === "/" && !typing
      const isCmdK =
        event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)
      if (!isSlash && !isCmdK) return

      event.preventDefault()
      setOpen((current) => !current)
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  /**
   * Fechar zera a busca.
   *
   * Reabrir com o texto anterior parece memória útil e não é: o resultado que
   * aparece é o de uma pergunta que já foi respondida, e a pessoa reabriu
   * justamente para fazer outra.
   *
   * O reset mora num efeito sobre `open`, e não em cada botão, porque há cinco
   * jeitos de fechar isto — Esc, o clique fora, o atalho de novo, escolher um
   * item e o botão — e a versão por botão esqueceria pelo menos um.
   */
  React.useEffect(() => {
    if (!open) setQuery("")
  }, [open])

  const groups = React.useMemo(
    () =>
      CATEGORY_ORDER.map((category) => ({
        category,
        items: REGISTRY.filter((e) => e.category === category),
      })).filter((g) => g.items.length > 0),
    []
  )

  const go = React.useCallback(
    (slug: string) => {
      setOpen(false)
      router.push(`/designsystem/${slug}`)
    },
    [router]
  )

  return (
    <>
      <DsSearchTrigger onClick={() => setOpen(true)} />

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Buscar no design system"
        description={`Busque entre as ${REGISTRY.length} páginas pelo nome, pela descrição ou pelo texto de cada uma.`}
      >
        <Command
          // A busca do catálogo é por substring sem acento, não a difusa do
          // cmdk: "cor" tem que achar "Cores" e não "Carousel" e "Combobox".
          filter={(value, search, keywords) => {
            const q = normalize(search)
            if (!q) return 1
            const haystack = normalize([value, ...(keywords ?? [])].join(" "))
            return haystack.includes(q) ? 1 : 0
          }}
        >
          <CommandInput
            autoFocus
            value={query}
            onValueChange={setQuery}
            placeholder={`Buscar entre ${REGISTRY.length} páginas…`}
          />

          <CommandList>
            {/* Busca vazia não pode ser beco sem saída: além de dizer o que a
                busca cobre, ela oferece a volta. */}
            <CommandEmpty className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-sm text-foreground">
                {`Nada encontrado para "${query}".`}
              </p>
              <p className="max-w-xs text-xs text-muted-foreground">
                {`A busca cobre o nome, a descrição e o texto de cada uma das ${REGISTRY.length} páginas — inclusive as palavras que a página ensina, como "contraste" ou "tabular".`}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuery("")}
              >
                Limpar busca
              </Button>
            </CommandEmpty>

            {groups.map((group) => (
              <CommandGroup key={group.category} heading={group.category}>
                {group.items.map((item) => (
                  <CommandItem
                    key={item.slug}
                    value={`${item.name} ${item.slug} ${item.description}`}
                    keywords={[SEARCH_INDEX[item.slug] ?? ""]}
                    onSelect={() => go(item.slug)}
                  >
                    {/* Nome sobre descrição é o mesmo dado em duas linhas:
                        quem os separa é a entrelinha, não um gap. */}
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-medium text-foreground">
                        {item.name}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}

/**
 * O gatilho no meio do cabeçalho.
 *
 * É um `button` com cara de campo, e não um `input`: focá-lo não deixa digitar,
 * e um campo que não aceita texto é a promessa que a paleta existe para
 * cumprir. O `Kbd` ao lado não é enfeite — é a única coisa na tela que ensina
 * que o atalho existe, e um atalho que ninguém descobre não tem uso.
 *
 * No telefone sobra só o ícone: a barra tem 56px e já carrega o menu, a marca e
 * o tema — e teclado físico, ali, não costuma haver.
 */
function DsSearchTrigger({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      // `ghost` é a base, e o contorno entra só no desktop. No telefone ele é
      // um ícone entre outros ícones: contorno ali desenhava uma caixa em volta
      // de um botão de 36px ao lado de um switch sem caixa nenhuma.
      variant="ghost"
      size="icon"
      onClick={onClick}
      aria-haspopup="dialog"
      aria-keyshortcuts="Meta+K Control+K"
      aria-label="Buscar no design system"
      className={cn(
        "text-muted-foreground",
        // O ponto de virada é `lg`, o mesmo em que a busca sai do meio da
        // barra: campo largo só existe onde há meio para centralizá-lo.
        "max-lg:size-9 max-lg:px-0",
        "lg:h-9 lg:w-full lg:max-w-sm lg:justify-start lg:gap-2 lg:px-3 lg:font-normal",
        "lg:border-border lg:bg-background lg:dark:border-input lg:dark:bg-input-fill/30"
      )}
    >
      <MagnifyingGlassIcon className="shrink-0 opacity-70" aria-hidden />
      <span className="truncate max-lg:sr-only">Buscar</span>
      <CommandShortcutHint />
    </Button>
  )
}

/**
 * `⌘K` no Mac, `Ctrl K` no resto.
 *
 * A escolha depende do `navigator`, que não existe no servidor. Renderizar o
 * palpite e corrigir depois faria a tecla piscar de errada para certa na
 * primeira pintura, então até saber ele não mostra nada — e o que aparece,
 * aparece certo.
 */
function CommandShortcutHint() {
  const [shortcut, setShortcut] = React.useState<string | null>(null)

  React.useEffect(() => {
    const isApple = /mac|iphone|ipad|ipod/i.test(
      navigator.platform || navigator.userAgent
    )
    // `⌘K` cola porque o símbolo já é uma tecla; `Ctrl K` precisa do espaço,
    // senão vira uma palavra só.
    setShortcut(isApple ? "⌘K" : "Ctrl K")
  }, [])

  if (shortcut == null) return null

  // Uma tecla só, e não `KbdGroup` com duas: o atalho é um gesto, não duas
  // teclas em sequência. Separadas, o olho lê "⌘" e "K" como dois passos.
  return (
    <Kbd className="ml-auto max-lg:hidden" aria-hidden>
      {shortcut}
    </Kbd>
  )
}
