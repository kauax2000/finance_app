"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/16/solid";
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
  CommandFooter,
  CommandHint,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandItemContent,
  CommandItemTitle,
  CommandList,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import { KbdShortcut } from "@/components/ui/kbd-shortcut";
import { CATEGORY_ORDER, REGISTRY } from "./registry";
import { SEARCH_INDEX } from "./search-index";

/**
 * A busca do catálogo: um gatilho no meio do cabeçalho e a paleta de comandos.
 *
 * Ela saiu da barra lateral por dois motivos. O campo lá filtrava a navegação,
 * então buscar e navegar eram o mesmo gesto e um desfazia o outro: achar
 * "Cores" escondia as outras 87 entradas. E o campo só existia no desktop — no
 * telefone ficava dentro da folha de navegação, atrás de dois toques.
 */
export function DsSearch() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

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
    if (!open) setQuery("");
  }, [open]);

  const groups = React.useMemo(
    () =>
      CATEGORY_ORDER.map((category) => ({
        category,
        items: REGISTRY.filter((e) => e.category === category),
      })).filter((g) => g.items.length > 0),
    [],
  );

  const go = React.useCallback(
    (slug: string) => {
      setOpen(false);
      router.push(`/designsystem/${slug}`);
    },
    [router],
  );

  return (
    <>
      <DsSearchTrigger onClick={() => setOpen(true)} />

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Buscar no design system"
        description={`Busque entre as ${REGISTRY.length} páginas pelo nome, pela descrição ou pelo texto de cada uma.`}
        commandProps={{
          // A busca por substring sem acento, graduada, mora em
          // `lib/command-filter` — a mesma que o `Combobox` usa. Era escrita
          // aqui, inline, e o segundo consumidor não tinha como achá-la.
          filter: commandFilter,
        }}
      >
        <CommandInput
          autoFocus
          value={query}
          onValueChange={setQuery}
          // Os três tipos de coisa que o catálogo guarda, na ordem em que a
          // barra lateral os lista: token (Fundações), componente (Átomos,
          // Moléculas, Organismos) e padrão (Padrões). "89 páginas" contava o
          // continente e não o conteúdo — quem abre a busca não procura uma
          // página, procura o `Badge`, o `--z-popover` ou a regra de dinheiro.
          placeholder="Buscar componente, token ou padrão…"
        />

        <CommandList>
          {/* Busca vazia não pode ser beco sem saída: além de dizer o que a
                busca cobre, ela oferece a volta. */}
          <CommandEmpty>
            <CommandEmptyTitle>
              {`Nada encontrado para "${query}".`}
            </CommandEmptyTitle>
            <CommandEmptyDescription>
              {`A busca cobre o nome, a descrição e o texto de cada uma das ${REGISTRY.length} páginas.`}
            </CommandEmptyDescription>
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
                  {/* Só o nome. A descrição continua no `value` acima, então
                      ela ainda **encontra** a página — ela só deixou de ser
                      desenhada. Numa lista de 80 páginas a segunda linha dobra
                      a altura de cada resultado e corta o número de opções
                      visíveis pela metade, e ela é justamente o texto que quem
                      busca por nome não lê. */}
                  <CommandItemContent>
                    <CommandItemTitle>{item.name}</CommandItemTitle>
                  </CommandItemContent>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>

        <CommandFooter>
          <CommandHint>
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            navegar
          </CommandHint>
          {/* Navegar fica sozinho à esquerda; abrir e fechar andam juntos à
              direita, porque os dois encerram a interação e o `justify-between`
              do rodapé espalharia os três em vez de agrupá-los. */}
          <div className="flex items-center gap-3">
            <CommandHint>
              <Kbd>↵</Kbd>
              abrir
            </CommandHint>
            <CommandHint>
              <Kbd>esc</Kbd>
              fechar
            </CommandHint>
          </div>
        </CommandFooter>
      </CommandDialog>
    </>
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
  return (
    <Button
      type="button"
      // `tertiary` é a base, e o contorno entra só no desktop. No telefone ele
      // é um ícone entre outros ícones: contorno ali desenhava uma caixa em
      // volta de um botão ao lado de um switch sem caixa nenhuma.
      //
      // No desktop ele finge ser um campo de busca, então usa a altura de campo
      // — `md`, 32 — e não a de botão de ícone que tinha antes.
      variant="tertiary"
      size="icon-md"
      onClick={onClick}
      aria-haspopup="dialog"
      aria-keyshortcuts="Meta+K Control+K"
      aria-label="Buscar no design system"
      className={cn(
        "text-muted-foreground",
        // O ponto de virada é `lg`, o mesmo em que a busca sai do meio da
        // barra: campo largo só existe onde há meio para centralizá-lo.
        "max-lg:size-8 max-lg:px-0",
        "lg:h-8 lg:w-full lg:max-w-sm lg:justify-start lg:gap-2 lg:px-3 lg:font-normal",
        "lg:border-border lg:bg-input-fill/30",
      )}
    >
      <MagnifyingGlassIcon className="shrink-0 opacity-70" aria-hidden />
      <span className="truncate max-lg:sr-only">Buscar</span>
      {/* `aria-hidden` porque o atalho já é anunciado pelo
          `aria-keyshortcuts` do próprio botão — repetir a tecla no nome
          acessível diria a mesma coisa duas vezes. */}
      <KbdShortcut keys="mod+k" aria-hidden className="ml-auto max-lg:hidden" />
    </Button>
  );
}
