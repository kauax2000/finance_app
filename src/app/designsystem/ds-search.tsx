"use client";

import { ClockIcon } from "@heroicons/react/16/solid";
import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { commandFilter } from "@/lib/command-filter";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandEmptyDescription,
  CommandEmptyTitle,
  CommandDock,
  CommandDockItem,
  CommandGroup,
  CommandHighlight,
  CommandInput,
  CommandItem,
  CommandItemArrow,
  CommandItemDescription,
  CommandItemIcon,
  CommandItemMeta,
  CommandItemTitle,
  CommandList,
  CommandPage,
  CommandPages,
  CommandScope,
  useCommandPages,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import { KbdGroup } from "@/components/ui/kbd-group";
import { TopBarSearch } from "@/components/ui/top-bar";
import { useCommandRecents } from "@/hooks/use-command-recents";
import { CATEGORY_META } from "./category-meta";
import type { Category } from "./ds-doc";
import { CATEGORY_ORDER, REGISTRY, getEntry } from "./registry";

/**
 * A busca do catálogo: um gatilho no meio do cabeçalho e a paleta de comandos. Abre por camadas (cada uma é uma
 * sub-página do `CommandPages`: pilha, Backspace e campo são do componente); esta tela só diz o que cada página mostra.
 */
export function DsSearch() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  /** `⌘K` e `/` abrem a paleta; `/` é ignorado enquanto se digita em outro campo, `⌘K` vale sempre. */
  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable === true;

      const isSlash = event.key === "/" && !typing;
      const isCmdK =
        event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey);
      if (!isSlash && !isCmdK) return;

      event.preventDefault();
      setOpen((current) => !current);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const navegar = React.useCallback(
    (slug: string) => {
      setOpen(false);
      router.push(`/designsystem/${slug}`);
    },
    [router],
  );

  return (
    <>
      {/* O gatilho é o `TopBarSearch`: ícone abaixo de `lg`, pílula a partir dele. */}
      <TopBarSearch
        onOpen={() => setOpen(true)}
        label="Buscar no design system"
        collapse="lg"
        listen={false}
        glow
        placeholder={
          <span className="grid min-w-0 text-left [&>*]:col-start-1 [&>*]:row-start-1">
            <FraseRolante texto="Buscar componentes e tokens…" papel="sai" />
            <FraseRolante texto="Abrir a busca" papel="entra" />
          </span>
        }
      />

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Buscar no design system"
        description={`Busque entre as ${REGISTRY.length} páginas pelo nome, ou entre numa camada.`}
        commandProps={{
          // A busca por substring sem acento mora em `lib/command-filter`, a mesma do `Combobox`.
          filter: commandFilter,
        }}
      >
        {/* Fechar zera a busca, o escopo e a pilha sem efeito. */}
        <CommandPages>
          <DsPaleta onNavigate={navegar} />
        </CommandPages>
      </CommandDialog>
    </>
  );
}

/** O miolo da paleta, dentro das sub-páginas: o campo, a lista e a legenda. */
function DsPaleta({ onNavigate }: { onNavigate: (slug: string) => void }) {
  const [query, setQuery] = React.useState("");
  const pages = useCommandPages();
  const scope = pages.current as Category | undefined;
  // Mesma chave da versão anterior (`recent-pages.ts`); o miolo monta a cada abertura, então a lista é a do momento.
  const { recents, add } = useCommandRecents("ds:recentes");
  const inputRef = React.useRef<HTMLInputElement>(null);

  /**
     * Trocar de página devolve a paleta ao estado ocioso: o `useCommandIdleSelection` só volta em `input`, e o campo
     * esvazia por estado; o evento sintético é o mesmo que o × do campo dispara.
     */
  React.useEffect(() => {
    inputRef.current?.dispatchEvent(new Event("input", { bubbles: true }));
  }, [scope]);

  const go = (slug: string) => {
    add(slug);
    onNavigate(slug);
  };

  const entrar = (category: Category) => {
    const { Icon } = CATEGORY_META[category];
    pages.push({ id: category, label: category, icon: <Icon aria-hidden /> });
  };

  const scoped = scope ? REGISTRY.filter((e) => e.category === scope) : null;

  /** Uma página recente não se repete no grupo da camada: duas linhas com o mesmo `value` acendem juntas no cmdk. */
  const recentes = recents.flatMap((slug) => {
    const entry = getEntry(slug);
    return entry ? [entry] : [];
  });
  const groups = CATEGORY_ORDER.map((category) => ({
    category,
    items: REGISTRY.filter(
      (e) => e.category === category && !recents.includes(e.slug),
    ),
  })).filter((g) => g.items.length > 0);

  const ScopeIcon = scope ? CATEGORY_META[scope].Icon : null;

  return (
    <>
      <CommandInput
        ref={inputRef}
        autoFocus
        value={query}
        onValueChange={setQuery}
        // A busca casa só com o nome da página (descrição e corpo traziam páginas que só mencionavam o termo).
        // O placeholder diz o que se acha: na raiz, páginas e camadas; no escopo, o tamanho do que sobrou.
        placeholder={
          scoped
            ? `Filtrar ${scoped.length} páginas…`
            : "Buscar uma página ou camada…"
        }
        aria-label={
          scope
            ? `Buscar nas ${scoped?.length ?? 0} páginas de ${scope}`
            : "Buscar uma página ou camada"
        }
        // A trilha das sub-páginas não tem `tint`; a camada pinta o escopo na cor dela.
        leading={
          scope && ScopeIcon ? (
            <CommandScope
              icon={<ScopeIcon aria-hidden />}
              armed={pages.armed}
              tint={CATEGORY_META[scope].tint}
            >
              {scope}
            </CommandScope>
          ) : null
        }
      />

      <CommandList>
        {/* Busca vazia não é beco sem saída. */}
        <CommandEmpty>
          <CommandEmptyTitle>
            {scope
              ? `Nada em ${scope} para "${query}".`
              : `Nada encontrado para "${query}".`}
          </CommandEmptyTitle>
          <CommandEmptyDescription>
            {scope
              ? `A busca cobre o nome das ${scoped?.length ?? 0} páginas desta camada.`
              : `A busca cobre o nome de cada uma das ${REGISTRY.length} páginas.`}
          </CommandEmptyDescription>
          <div className="flex gap-2">
            {scope ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={pages.reset}
              >
                Buscar em tudo
              </Button>
            ) : null}
            <Button
              type="button"
              variant="tertiary"
              size="sm"
              onClick={() => setQuery("")}
            >
              Limpar busca
            </Button>
          </div>
        </CommandEmpty>

        {/* Cada página remonta ao entrar: é a remontagem que faz as linhas subirem em cascata. */}
        <CommandPage>
          <CommandGroup heading="Camadas">
            {CATEGORY_ORDER.map((category) => {
              const { Icon, label } = CATEGORY_META[category];
              const total = REGISTRY.filter(
                (e) => e.category === category,
              ).length;
              return (
                <CommandItem
                  key={category}
                  value={category}
                  keywords={[label]}
                  onSelect={() => entrar(category)}
                >
                  <CommandItemIcon>
                    <Icon />
                  </CommandItemIcon>
                  <CommandItemTitle>
                    <CommandHighlight>{category}</CommandHighlight>
                  </CommandItemTitle>
                  <CommandItemMeta>
                    <CommandItemDescription className="nums">
                      {`${total} páginas`}
                    </CommandItemDescription>
                    <CommandItemArrow />
                  </CommandItemMeta>
                </CommandItem>
              );
            })}
          </CommandGroup>

          {/* Abaixo das camadas, uma linha só por página. */}
          {recentes.length > 0 ? (
            <CommandGroup heading="Recentes">
              {recentes.map((item) => (
                <CommandItem
                  key={item.slug}
                  value={item.name}
                  onSelect={() => go(item.slug)}
                >
                  <CommandItemIcon>
                    <ClockIcon />
                  </CommandItemIcon>
                  <CommandHighlight>{item.name}</CommandHighlight>
                  <CommandItemArrow />
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}

          {/* As páginas só entram quando há o que buscar. */}
          {query
            ? groups.map((group) => (
                <CommandGroup
                  key={group.category}
                  heading={group.category}
                  count
                >
                  {group.items.map((item) => (
                    <DsPageItem
                      key={item.slug}
                      slug={item.slug}
                      name={item.name}
                      description={item.description}
                      category={item.category}
                      onSelect={go}
                    />
                  ))}
                </CommandGroup>
              ))
            : null}
        </CommandPage>

        {CATEGORY_ORDER.map((category) => (
          <CommandPage key={category} id={category}>
            <CommandGroup heading={category} count={Boolean(query)}>
              {REGISTRY.filter((e) => e.category === category).map((item) => (
                <DsPageItem
                  key={item.slug}
                  slug={item.slug}
                  name={item.name}
                  description={item.description}
                  category={item.category}
                  onSelect={go}
                />
              ))}
            </CommandGroup>
          </CommandPage>
        ))}
      </CommandList>

      {/* A legenda de teclado, em cápsulas soltas embaixo da placa. */}
      <CommandDock>
        <div className="flex items-center gap-2">
          <CommandDockItem>
            <KbdGroup mode="either" keys={["up", "down"]} />
            navegar
          </CommandDockItem>
          {scope ? (
            <CommandDockItem className="animate-in fade-in-0 slide-in-from-left-1 animation-duration-(--duration-base) ease-(--ease-out)">
              <Kbd>⌫</Kbd>
              voltar
            </CommandDockItem>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <CommandDockItem>
            <Kbd>↵</Kbd>
            {scope ? "abrir" : "entrar"}
          </CommandDockItem>
          <CommandDockItem>
            <Kbd>Esc</Kbd>
            fechar
          </CommandDockItem>
        </div>
      </CommandDock>
    </>
  );
}


/** Uma página nos resultados: o ícone da camada, o nome e a descrição. */
function DsPageItem({
  slug,
  name,
  description,
  category,
  onSelect,
}: {
  slug: string;
  name: string;
  description: string;
  category: Category;
  onSelect: (slug: string) => void;
}) {
  const { Icon } = CATEGORY_META[category];
  return (
    <CommandItem value={name} onSelect={() => onSelect(slug)}>
      <CommandItemIcon>
        <Icon />
      </CommandItemIcon>
      <CommandItemTitle className="shrink-0">
        <CommandHighlight>{name}</CommandHighlight>
      </CommandItemTitle>
      <CommandItemMeta>
        <CommandItemDescription>{description}</CommandItemDescription>
        <CommandItemArrow />
      </CommandItemMeta>
    </CommandItem>
  );
}

/**
 * Uma frase que se dissolve na outra, palavra a palavra, quando o gatilho recebe o cursor ou o foco: as duas
 * ocupam o mesmo lugar e trocam de foco, 45ms por palavra. Com movimento reduzido o atraso é zerado à mão,
 * como na `command-reveal`.
 */
function FraseRolante({
  texto,
  papel,
}: {
  texto: string;
  papel: "sai" | "entra";
}) {
  const estado =
    papel === "sai"
      ? "group-hover/button:opacity-0 group-hover/button:blur-[3px] group-hover/button:scale-[1.02] group-focus-visible/button:opacity-0 group-focus-visible/button:blur-[3px] group-focus-visible/button:scale-[1.02]"
      : "translate-y-px scale-[0.98] opacity-0 blur-[3px] group-hover/button:translate-y-0 group-hover/button:scale-100 group-hover/button:opacity-100 group-hover/button:blur-none group-focus-visible/button:translate-y-0 group-focus-visible/button:scale-100 group-focus-visible/button:opacity-100 group-focus-visible/button:blur-none";
  const palavras = texto.split(" ");
  return (
    <span className="block overflow-hidden whitespace-pre">
      {palavras.map((palavra, i) => (
        <React.Fragment key={i}>
          {i > 0 ? " " : null}
          <span
            style={{ "--i": i } as React.CSSProperties}
            className={cn(
              "inline-block origin-left transition-[opacity,translate,scale,filter] duration-(--duration-slow) ease-(--ease-emphasized) [transition-delay:calc(var(--i)*45ms)] motion-reduce:[transition-delay:0ms]",
              estado,
            )}
          >
            {palavra}
          </span>
        </React.Fragment>
      ))}
    </span>
  );
}

