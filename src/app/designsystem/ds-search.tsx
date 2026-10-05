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
 * A busca do catálogo: um gatilho no meio do cabeçalho e a paleta de comandos.
 *
 * Ela saiu da barra lateral por dois motivos. O campo lá filtrava a navegação,
 * então buscar e navegar eram o mesmo gesto e um desfazia o outro: achar
 * "Cores" escondia as outras 87 entradas. E o campo só existia no desktop — no
 * telefone ficava dentro da folha de navegação, atrás de dois toques.
 *
 * **Ela abre por camadas** (rodada 139). Vazia, mostra as cinco camadas e as
 * últimas páginas abertas; escolher uma camada põe um chip no campo e a busca
 * segue só ali. Sem chip, digitar traz camadas, recentes e páginas que batem.
 *
 * **Desde a rodada 208 cada camada é uma sub-página** (`CommandPages`): a pilha,
 * o Backspace em dois toques e o campo que esvazia a cada passo são do
 * componente, e esta tela só diz o que cada página mostra.
 */
export function DsSearch() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  /**
   * `⌘K` e `/` abrem a paleta.
   *
   * `/` é ignorado enquanto se digita em outro campo, senão a barra some do meio
   * de uma palavra. `⌘K` vale sempre: é o gesto que a pessoa faz justamente para
   * sair de onde está.
   */
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
      {/* O gatilho é o `TopBarSearch` (rodada 237): o ícone abaixo de `lg` e a
          pílula com ⌘K acima, com o brilho de marca e a frase que troca. Quem
          escuta ⌘K e / é esta paleta (ela alterna), então ele não escuta. */}
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
          // A busca por substring sem acento, graduada, mora em
          // `lib/command-filter` — a mesma que o `Combobox` usa. Era escrita
          // aqui, inline, e o segundo consumidor não tinha como achá-la.
          filter: commandFilter,
        }}
      >
        {/* Fechar zera a busca, o escopo e a pilha sem efeito nenhum: o
            conteúdo do diálogo desmonta ao fechar, e o estado mora nele.
            Reabrir com o texto anterior parece memória útil e não é — o que
            vale lembrar é o **destino**, e ele fica nos recentes. */}
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
  // Mesma chave da versão anterior (`recent-pages.ts`), para quem já tinha
  // recentes não os perder. O gancho lê ao montar, e o miolo monta a cada
  // abertura — então a lista é a do momento, e não a do primeiro render.
  const { recents, add } = useCommandRecents("ds:recentes");
  const inputRef = React.useRef<HTMLInputElement>(null);

  /**
   * Trocar de página devolve a paleta ao estado ocioso.
   *
   * O `useCommandIdleSelection` só volta ao ocioso em `input`, e o campo
   * esvazia por estado, sem digitar nada: a linha "Organisms" que acabou de
   * ser escolhida sairia da lista, e o cmdk selecionaria a primeira da página
   * nova como se alguém tivesse navegado até ela. É o mesmo evento sintético
   * que o × do campo dispara.
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

  /**
   * Uma página recente não se repete no grupo da camada. É o que mantém o
   * `value` de cada linha único no cmdk — duas linhas com o mesmo valor
   * acendem juntas. Vazia, a paleta mostra as camadas e, abaixo, os recentes;
   * com texto, quem bate melhor sobe — o cmdk ordena os grupos pela nota.
   */
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
        // A busca casa só com o nome da página: descrição e texto do corpo
        // traziam páginas que apenas mencionavam o que se procurava.
        //
        // O placeholder diz o que se acha, e não repete o que já está na
        // tela: na raiz, que a busca cobre páginas **e** camadas; no escopo,
        // o nome da camada já está pintado ao lado, então ele diz o tamanho
        // do que sobrou para filtrar.
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
        // A trilha que as sub-páginas desenham sozinhas não tem `tint`; a
        // camada pinta o escopo na cor dela, então ele vem daqui — o estado
        // armado continua sendo o da pilha.
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
        {/* Busca vazia não pode ser beco sem saída: além de dizer o que a
              busca cobre, ela oferece a volta. */}
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

        {/* Cada página remonta ao entrar, e é a remontagem que faz as linhas
            subirem (`command-reveal`). */}
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

          {/* Abaixo das camadas, uma linha só por página — o desenho de
              "Go to …" que o dono trouxe: a seta e o nome. */}
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

          {/* As páginas só entram quando há o que buscar: vazia, a paleta é
              as camadas e os recentes. Com texto, cada camada diz quantas
              bateram. */}
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

      {/* A legenda de teclado, em cápsulas soltas embaixo da placa — o último
          filho da pilha. Navegar fica à esquerda; abrir e fechar andam
          juntos à direita, porque os dois encerram a interação. */}
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
 * Uma frase que se **dissolve** na outra, palavra a palavra, quando o gatilho
 * recebe o cursor ou o foco.
 *
 * O gesto já foi letra a letra rolando (chamava atenção demais) e depois
 * palavra a palavra deslizando 4px (discreto, mas mecânico). Hoje as duas
 * frases **ocupam o mesmo lugar e trocam de foco**, como uma lente: a que sai
 * desfoca e some, a que entra vem do desfoque até ficar nítida, com um
 * respiro de 1px e escala de 98% → 100%. Cada palavra começa 45ms depois da
 * anterior, em `--duration-slow` com `--ease-emphasized` — a curva que acelera
 * cedo e pousa devagar, a do link do catálogo. Não há trajeto a ler, só a
 * passagem de uma frase para a outra.
 *
 * Com movimento reduzido o bloco global encurta a duração, mas **não o
 * atraso**: ele é zerado à mão, como na `command-reveal`.
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

