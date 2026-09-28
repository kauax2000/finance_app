"use client";

import { ClockIcon, MagnifyingGlassIcon } from "@heroicons/react/16/solid";
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
  CommandInput,
  CommandItem,
  CommandItemArrow,
  CommandItemDescription,
  CommandItemIcon,
  CommandItemMeta,
  CommandItemTitle,
  CommandList,
  CommandScope,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import { useBrandGlow } from "@/hooks/use-brand-glow";
import { CATEGORY_META } from "./category-meta";
import type { Category } from "./ds-doc";
import { gravarRecente, lerRecentes } from "./recent-pages";
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
 */
export function DsSearch() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [scope, setScope] = React.useState<Category | null>(null);
  const [recent, setRecent] = React.useState<string[]>([]);
  /** O primeiro Backspace com o campo vazio arma o escopo; o segundo sai. */
  const [armado, setArmado] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

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

  /**
   * Fechar zera a busca e o escopo; abrir lê os recentes.
   *
   * Reabrir com o texto anterior parece memória útil e não é: o resultado que
   * aparece é o de uma pergunta que já foi respondida, e a pessoa reabriu
   * justamente para fazer outra. O que vale lembrar é o **destino** — as
   * páginas abertas —, e ele é lido aqui, num efeito, e não no render: o
   * `localStorage` não existe no servidor, e ler os dois lados com getters
   * diferentes foi o desencontro de hidratação do `Resizable`.
   *
   * O reset mora num efeito sobre `open`, e não em cada botão, porque há cinco
   * jeitos de fechar isto — Esc, o clique fora, o atalho de novo, escolher um
   * item e o botão — e a versão por botão esqueceria pelo menos um.
   */
  React.useEffect(() => {
    if (open) {
      setRecent(lerRecentes().filter((slug) => getEntry(slug)));
      return;
    }
    setQuery("");
    setScope(null);
  }, [open]);

  /**
   * Trocar de vista devolve a paleta ao estado ocioso.
   *
   * O `useCommandIdleSelection` só volta ao ocioso em `input`, e trocar o
   * escopo não digita nada: a linha "Organisms" que acabou de ser escolhida
   * continuaria como valor selecionado de uma lista que já não a tem. É o
   * mesmo evento sintético que o × do campo dispara.
   */
  React.useEffect(() => {
    inputRef.current?.dispatchEvent(new Event("input", { bubbles: true }));
    setArmado(false);
  }, [scope]);

  const go = React.useCallback(
    (slug: string) => {
      gravarRecente(slug);
      setOpen(false);
      router.push(`/designsystem/${slug}`);
    },
    [router],
  );

  const entrar = React.useCallback((category: Category) => {
    setScope(category);
    setQuery("");
  }, []);

  const sair = React.useCallback(() => setScope(null), []);

  const scoped = scope ? REGISTRY.filter((e) => e.category === scope) : null;

  /**
   * Uma página recente não se repete no grupo da camada. É o que mantém o
   * `value` de cada linha único no cmdk — duas linhas com o mesmo valor
   * acendem juntas. Vazia, a paleta mostra as camadas e, abaixo, os recentes;
   * com texto, quem bate melhor sobe — o cmdk ordena os grupos pela nota.
   */
  const recentes = recent.flatMap((slug) => {
    const entry = getEntry(slug);
    return entry ? [entry] : [];
  });
  const groups = CATEGORY_ORDER.map((category) => ({
    category,
    items: REGISTRY.filter(
      (e) => e.category === category && !recent.includes(e.slug),
    ),
  })).filter((g) => g.items.length > 0);

  const ScopeIcon = scope ? CATEGORY_META[scope].Icon : null;

  return (
    <>
      <DsSearchTrigger onClick={() => setOpen(true)} />

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
          leading={
            scope && ScopeIcon ? (
              <CommandScope
                icon={<ScopeIcon aria-hidden />}
                armed={armado}
                tint={CATEGORY_META[scope].tint}
              >
                {scope}
              </CommandScope>
            ) : null
          }
          onKeyDown={(event) => {
            // Backspace com o campo vazio, em dois toques: o primeiro arma o
            // escopo (o fundo acende), o segundo o remove — o destinatário de
            // um e-mail. Qualquer outra tecla desarma.
            if (event.key === "Backspace" && !query && scope) {
              event.preventDefault();
              if (armado) sair();
              else setArmado(true);
              return;
            }
            if (armado && event.key !== "Shift") setArmado(false);
          }}
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
                  onClick={sair}
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

          {/* O miolo remonta a cada troca de vista, e é a remontagem que faz as
              linhas subirem (`command-reveal`). */}
          <div key={scope ?? "root"}>
            {scoped && scope ? (
              <CommandGroup heading={scope}>
                {scoped.map((item) => (
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
            ) : (
              <>
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
                        <CommandItemTitle>{category}</CommandItemTitle>
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
                        {item.name}
                        <CommandItemArrow />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ) : null}

                {/* As páginas só entram quando há o que buscar: vazia, a
                    paleta é as camadas e os recentes. */}
                {query
                  ? groups.map((group) => (
                      <CommandGroup
                        key={group.category}
                        heading={group.category}
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
              </>
            )}
          </div>
        </CommandList>

        {/* A legenda de teclado, em cápsulas soltas embaixo da placa — o último
            filho da pilha. Navegar fica à esquerda; abrir e fechar andam
            juntos à direita, porque os dois encerram a interação. */}
        <CommandDock>
          <div className="flex items-center gap-2">
            <CommandDockItem>
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd>
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
              <Kbd>esc</Kbd>
              fechar
            </CommandDockItem>
          </div>
        </CommandDock>
      </CommandDialog>
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
      <CommandItemTitle className="shrink-0">{name}</CommandItemTitle>
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
  // O brilho de marca ao aproximar (a primitiva do `Card` e do `Alert`
  // brand), só onde o gatilho é um campo, a partir de `lg`. Ele mora num
  // invólucro, e não no botão: o `::before` do brilho fica em `z` negativo sob
  // `isolate`, e no próprio botão ele pintaria **por cima** do fundo e do disco
  // de hover do `tertiary`. No invólucro, só o anel acende: a máscara recorta
  // a borda, e o campo atrás aparece intacto (rodada 156 — o núcleo chapado de
  // antes era o preto da página sobre este campo mais claro, e virava feixe).
  const glowRef = useBrandGlow(true);
  return (
    <div
      ref={glowRef}
      className="relative isolate flex rounded-full lg:w-full lg:max-w-sm lg:brand-glow"
    >
      <Button
        type="button"
        // `tertiary` é a base, e o contorno entra só no desktop. No telefone ele
        // é um ícone entre outros ícones: contorno ali desenhava uma caixa em
        // volta de um botão ao lado de um switch sem caixa nenhuma.
        //
        // No desktop ele finge ser um campo de busca, então usa a altura de campo
        // — `md`, 32 — e não a de botão de ícone que tinha antes. Foi 36 por
        // uma rodada, e o dono o quis de volta em 32.
        variant="tertiary"
        size="icon-md"
        onClick={onClick}
        aria-haspopup="dialog"
        aria-keyshortcuts="Meta+K Control+K"
        aria-label="Buscar no design system"
        className={cn(
          // Pílula, a pedido do dono. O invólucro do brilho acompanha, porque o
          // anel herda o raio dele (`border-radius: inherit`).
          "rounded-full text-muted-foreground",
          // O ponto de virada é `lg`, o mesmo em que a busca sai do meio da
          // barra: campo largo só existe onde há meio para centralizá-lo.
          "max-lg:size-8 max-lg:px-0",
          "lg:h-8 lg:w-full lg:justify-start lg:gap-2 lg:px-3 lg:font-normal",
          "lg:border-border lg:bg-input-fill/30",
          // No campo largo o hover não pinta o fundo: quem responde à
          // aproximação é o brilho da borda, e os dois juntos eram demais. O
          // a flor do `tertiary` fica sem cor. Abaixo de `lg`, onde não há
          // brilho, o botão de ícone mantém a flor.
          "lg:[--button-bloom-fill:transparent] lg:dark:[--button-bloom-fill:transparent]",
          // E o texto não acende: a frase troca, a cor fica a do repouso.
          "lg:hover:text-muted-foreground lg:active:text-muted-foreground lg:aria-expanded:text-muted-foreground",
        )}
      >
        <MagnifyingGlassIcon className="shrink-0 opacity-70" aria-hidden />
        {/* Em repouso o campo diz o que se acha nele; com o cursor (ou o
            foco de teclado) ele vira o convite para a ação. As duas frases
            ocupam a mesma célula da grade, então a largura não pula, e trocam
            **palavra a palavra**, uma se dissolvendo na outra (ver
            `FraseRolante`).

            **`text-left` é carga estrutural**: o `<button>` centraliza texto
            por padrão do navegador, e a frase curta ficava centrada na largura
            da longa — medido, "Buscar" nascia 40px à direita da lupa. O nome
            acessível é o `aria-label` do botão. */}
        <span
          aria-hidden
          className="grid min-w-0 text-left max-lg:sr-only [&>*]:col-start-1 [&>*]:row-start-1"
        >
          <FraseRolante texto="Buscar componentes e tokens…" papel="sai" />
          <FraseRolante texto="Abrir a busca" papel="entra" />
        </span>
        {/* `aria-hidden` porque o atalho já é anunciado pelo
          `aria-keyshortcuts` do próprio botão — repetir a tecla no nome
          acessível diria a mesma coisa duas vezes. */}
        <Kbd
          keys="mod+k"
          aria-hidden
          // Sem a pastilha, como as teclas da legenda da paleta: dentro de um
          // campo em pílula ela era uma caixa dentro de outra caixa.
          className="ml-auto min-w-0 bg-transparent px-0 max-lg:hidden dark:bg-transparent"
        />
      </Button>
    </div>
  );
}
