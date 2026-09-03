import { ArrowRightIcon } from "@heroicons/react/16/solid"
import { ArrowUturnLeftIcon, BanknotesIcon, CursorArrowRaysIcon, SwatchIcon } from "@heroicons/react/24/outline"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Code } from "@/components/ui/code"
import {
    PageHeader,
    PageHeaderDescription,
    PageHeaderEyebrow,
    PageHeaderMeta,
    PageHeaderTitle,
    PageHeaderTitleRow,
} from "@/components/ui/page-header"
import {
    CATEGORY_ORDER,
    movedFrom,
    REGISTRY,
    getEntry,
    groupedRegistry,
    slugifyCategory,
} from "./registry"

/**
 * Por onde se começa.
 *
 * O índice listava 87 cartões de peso idêntico, e um catálogo sem ponto de
 * entrada obriga cada pessoa a inventar o próprio. Estes quatro não são os mais
 * usados: são os que mudam o que alguém vai escrever nos outros 83 — três
 * padrões que atravessam telas e a página que governa todas as cores.
 */
const START_HERE = [
    { slug: "cores", Icon: SwatchIcon },
    { slug: "dinheiro", Icon: BanknotesIcon },
    // A própria glifa da tecla Enter, que é sobre o que a página fala.
    { slug: "formularios", Icon: ArrowUturnLeftIcon },
    { slug: "mobile-toque", Icon: CursorArrowRaysIcon },
]

const CATEGORY_BLURB: Record<string, string> = {
    Fundações: "As decisões que todo o resto herda: cor, tipo, forma, movimento, camada.",
    Átomos: "Um controle, uma responsabilidade. Não compõem outros componentes.",
    Moléculas: "Alguns átomos resolvendo uma tarefa completa.",
    Organismos: "Seções complexas da interface, com estado e layout próprios.",
    Templates: "O que estrutura a página, e não o que ela contém.",
    Padrões: "Não são componentes: são as decisões que atravessam telas.",
}

/** `01`, `02` — a numeração do sumário, não a contagem de itens. */
function ordinal(index: number): string {
    return String(index + 1).padStart(2, "0")
}

/**
 * A entrada em cascata.
 *
 * Um único gesto de carga, escalonado pelo token de movimento em vez de
 * milissegundos escritos à mão — do mesmo jeito que a escala de raio deriva de
 * `--radius`.
 *
 * O degrau para no quarto bloco de propósito. `fill-mode-both` mantém o
 * elemento invisível até a vez dele, e escalonar os sete blocos deixaria a
 * última categoria em branco por quase um segundo e meio — tempo suficiente
 * para alguém rolar até ela e encontrar vão. Cascata é para o que está na
 * primeira tela; o resto entra junto, fora de vista.
 *
 * O kill global de `prefers-reduced-motion` em `globals.css` já anula qualquer
 * animação de uma passada, então não há tratamento por elemento aqui.
 */
const ENTRADA_MAX_STEP = 3

function entrada(step: number): React.CSSProperties {
    const degrau = Math.min(step, ENTRADA_MAX_STEP)
    return { animationDelay: `calc(var(--duration-fast) / 2 * ${degrau})` }
}

const ENTRADA_CLASS =
    "animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500 ease-out"

/**
 * A marca temporária de quem mudou de camada na rodada 17.
 *
 * Ela existe porque 32 das 90 páginas trocaram de lugar de uma vez, e quem tem
 * o mapa antigo na cabeça procuraria `Table` em Organismos e não acharia. Diz
 * de onde veio, e não que é novidade — a página é a mesma.
 *
 * **É dado, não decoração**: sai de `MOVED_FROM` no registry, e desaparece
 * sozinha quando aquele campo for apagado. Fica em `text-2xs` sem preenchimento
 * porque um `Badge` aqui competiria com o nome que ele acompanha, 32 vezes numa
 * lista de 90.
 */
function MovedMark({ slug }: { slug: string }) {
    const de = movedFrom(slug)
    if (!de) return null
    return (
        <span className="shrink-0 text-2xs font-medium tracking-wide whitespace-nowrap text-primary-accent/80 uppercase">
            movido de {de}
        </span>
    )
}

export default function DesignSystemIndexPage() {
    const groups = groupedRegistry()

    return (
        <div className="flex flex-col gap-14 pb-24">
            {/* O cabeçalho ocupa espaço de propósito: é o único lugar da página
                sem densidade, e é ele que faz a lista abaixo ler como lista. */}
            {/* O `size="lg"` é o degrau que esta página já renderizava — 30/36px
                —, e a faixa de fatos é o `dl` que estava escrito à mão aqui.
                A sobrancelha se paga porque há um pai de verdade a nomear: o
                produto de que este catálogo é o sistema. */}
            <PageHeader
                size="lg"
                variant="plain"
                className={ENTRADA_CLASS}
                style={entrada(0)}
            >
                <PageHeaderTitleRow>
                    <PageHeaderEyebrow>Finance App</PageHeaderEyebrow>
                    <PageHeaderTitle>Design system</PageHeaderTitle>
                    <PageHeaderDescription className="max-w-none">
                        Uma página por componente e por padrão, com o espécime vivo ao
                        lado da regra. Os componentes vivem em{" "}
                        <Code variant="inline">src/components/ui/</Code> e os tokens em{" "}
                        <Code variant="inline">src/app/globals.css</Code>.
                    </PageHeaderDescription>
                </PageHeaderTitleRow>
                <PageHeaderMeta asChild>
                    <dl>
                        <div className="flex items-baseline gap-2">
                            <dt className="text-muted-foreground">Páginas</dt>
                            <dd className="nums font-medium text-foreground">
                                {REGISTRY.length}
                            </dd>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <dt className="text-muted-foreground">Categorias</dt>
                            <dd className="nums font-medium text-foreground">
                                {CATEGORY_ORDER.length}
                            </dd>
                        </div>
                    </dl>
                </PageHeaderMeta>
            </PageHeader>

            {/* O único bloco com cartão. É o contraste com as listas de fio
                abaixo que faz ele pesar — não uma cor mais forte. */}
            <section
                aria-labelledby="comece-aqui"
                className={cn("flex flex-col gap-4", ENTRADA_CLASS)}
                style={entrada(1)}
            >
                <div className="flex flex-col">
                    <h2
                        id="comece-aqui"
                        className="font-heading text-lg font-semibold tracking-tight text-foreground"
                    >
                        Comece aqui
                    </h2>
                    <p className="text-sm text-pretty text-muted-foreground">
                        Quatro páginas antes das outras {REGISTRY.length - 4}. Elas não
                        descrevem um componente: descrevem a decisão que os componentes
                        obedecem.
                    </p>
                </div>
                {/* Sem cartão, de propósito.

                    Fundo tingido, anel na cor de acento, ícone dentro de um
                    quadradinho arredondado e hover que acende a superfície: é o
                    cartão que aparece em toda página gerada por máquina, e num
                    catálogo que existe para ter opinião ele era justamente o
                    lugar sem nenhuma.

                    Aqui as quatro viraram aberturas sob fio. O que faz este
                    bloco pesar mais que as listas abaixo é escala e ar — título
                    em `text-base` contra `text-sm`, três vezes a altura de uma
                    linha de sumário —, e não uma caixa em volta. */}
                <ol className="grid grid-cols-1 gap-x-10 sm:grid-cols-2">
                    {START_HERE.map(({ slug, Icon }, index) => {
                        const item = getEntry(slug)
                        if (!item) return null
                        return (
                            <li key={item.slug} className="flex">
                                <Link
                                    href={`/designsystem/${item.slug}`}
                                    className={cn(
                                        "group flex flex-1 flex-col border-t border-border pt-4 pb-6",
                                        "transition-colors duration-(--duration-fast) ease-(--ease-out)",
                                        // O fio de cima é o que responde ao
                                        // toque: some a superfície, sobra a
                                        // régua, e é ela que acende.
                                        "hover:border-foreground/40 active:border-foreground/40",
                                        "focus-visible:ring-3 focus-visible:ring-ring/70 focus-visible:outline-none"
                                    )}
                                >
                                    {/* Ícone nu, sem ladrilho. Ele e o ordinal
                                        são a linha de metadado; o título vem
                                        depois, no tamanho que manda. */}
                                    <div className="flex items-center justify-between gap-2">
                                        <Icon
                                            aria-hidden
                                            className="size-4 shrink-0 text-muted-foreground transition-colors duration-(--duration-fast) ease-(--ease-out) group-hover:text-foreground group-active:text-foreground"
                                        />
                                        <span className="nums text-2xs font-medium text-muted-foreground">
                                            {ordinal(index)}
                                        </span>
                                    </div>

                                    {/* Título sobre descrição é o mesmo dado em
                                        duas linhas: separa a entrelinha, não um
                                        `gap`. */}
                                    <div className="mt-3 flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-heading text-base font-medium tracking-tight text-foreground underline-offset-4 group-hover:underline group-active:underline">
                                                {item.name}
                                            </h3>
                                            <ArrowRightIcon
                                                aria-hidden
                                                className={cn(
                                                    "size-4 shrink-0 -translate-x-1 text-foreground opacity-0",
                                                    "transition-[opacity,translate] duration-(--duration-fast) ease-(--ease-out)",
                                                    "group-hover:translate-x-0 group-hover:opacity-100",
                                                    "group-active:translate-x-0 group-active:opacity-100",
                                                    "group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
                                                )}
                                            />
                                        </div>
                                        <p className="text-xs leading-relaxed text-muted-foreground">
                                            {item.description}
                                        </p>
                                    </div>
                                </Link>
                            </li>
                        )
                    })}
                </ol>
            </section>

            {groups.map((group, index) => (
                <section
                    key={group.category}
                    id={slugifyCategory(group.category)}
                    aria-labelledby={`${slugifyCategory(group.category)}-titulo`}
                    className={cn("flex scroll-mt-20 flex-col gap-5", ENTRADA_CLASS)}
                    style={entrada(index + 2)}
                >
                    {/* No telefone o numeral vai para cima do nome. Ao lado, ele
                        comia uma coluna de 40px de uma tela de 375 e empurrava a
                        legenda para três linhas; e como a coluna era fixa, o
                        nome da categoria nunca começava na margem. */}
                    <header className="flex flex-col gap-1 border-b border-border pb-4 sm:flex-row sm:items-start sm:gap-4">
                        {/* O numeral era um matiz diferente por categoria. Cinco
                            cores em cinco cabeçalhos lê como legenda de gráfico,
                            não como sumário — e a página inteira ficava mais
                            colorida que qualquer tela do produto que ela
                            documenta.

                            Quem distingue as seções agora é o tamanho e o
                            contraste baixo do número: grande o bastante para
                            marcar o começo, apagado o bastante para o nome da
                            categoria continuar sendo o que se lê primeiro. */}
                        <span
                            aria-hidden
                            className="nums font-heading text-3xl leading-none font-semibold text-muted-foreground/45 sm:w-10 sm:shrink-0"
                        >
                            {ordinal(index)}
                        </span>
                        {/* Título sobre legenda é o mesmo dado em duas linhas:
                            quem os separa é a entrelinha, não um `gap`. */}
                        <div className="flex min-w-0 flex-col">
                            <h2
                                id={`${slugifyCategory(group.category)}-titulo`}
                                className="font-heading text-lg font-semibold tracking-tight text-foreground"
                            >
                                {group.category}
                                <span className="nums ml-2 text-sm font-normal text-muted-foreground">
                                    {group.items.length}
                                </span>
                            </h2>
                            <p className="text-sm text-pretty text-muted-foreground">
                                {CATEGORY_BLURB[group.category]}
                            </p>
                        </div>
                    </header>

                    {/* Linha com fio, e não cartão. O cartão gastava um cabeçalho
                        e um corpo para mostrar um nome e uma frase, 88 vezes; a
                        linha alinha os nomes numa coluna e as descrições em
                        outra, que é o que se lê num sumário. */}
                    {/* O fio pertence à `li` e atravessa a linha inteira; a faixa
                        de hover é o `a`, recuado 2px em cima e embaixo pelo
                        `py-0.5`. É esse respiro que deixa o canto arredondado
                        existir sem encostar na régua — antes a faixa terminava
                        exatamente onde o fio começava, e os quatro cantos abriam
                        fresta. A altura da linha continua 44px. */}
                    <ul className="flex flex-col">
                        {group.items.map((item) => (
                            <li
                                key={item.slug}
                                className="border-b border-border/70 py-0.5"
                            >
                                <Link
                                    href={`/designsystem/${item.slug}`}
                                    className={cn(
                                        "group flex min-h-10 items-center gap-3 rounded-md px-2 py-2 transition-colors",
                                        "hover:bg-accent/50 active:bg-accent/50",
                                        "focus-visible:ring-3 focus-visible:ring-ring/70 focus-visible:outline-none"
                                    )}
                                >
                                    <span className="grid min-w-0 flex-1 grid-cols-1 items-baseline gap-x-6 leading-snug sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)]">
                                        <span className="flex min-w-0 items-baseline gap-2">
                                            <span className="truncate text-sm font-medium text-foreground">
                                                {item.name}
                                            </span>
                                            <MovedMark slug={item.slug} />
                                        </span>
                                        {/* Uma linha, com reticências no que
                                            passar. Descrição que quebra faz a
                                            linha crescer, e um sumário com
                                            alturas diferentes perde o ritmo que
                                            o torna varrível. O `title` devolve o
                                            texto inteiro a quem para o cursor. */}
                                        <span
                                            title={item.description}
                                            className="truncate text-xs text-muted-foreground"
                                        >
                                            {item.description}
                                        </span>
                                    </span>
                                    {/* A seta diz que a linha leva para outro
                                        lugar — a lista inteira é link, e nada
                                        na régua dizia isso.

                                        Ela ocupa o espaço mesmo invisível, então
                                        aparecer não empurra o texto. `active:`
                                        acompanha `hover:` porque no telefone o
                                        segundo não existe, e `focus-visible:`
                                        porque quem anda de Tab merece a mesma
                                        pista. */}
                                    <ArrowRightIcon
                                        aria-hidden
                                        className={cn(
                                            "size-4 shrink-0 -translate-x-1 text-muted-foreground opacity-0",
                                            // `translate`, não `transform`: no
                                            // Tailwind v4 o `-translate-x-1`
                                            // escreve a propriedade `translate`,
                                            // e uma transição que só nomeia
                                            // `transform` deixa a seta aparecer
                                            // de estalo em vez de deslizar.
                                            "transition-[opacity,translate] duration-(--duration-fast) ease-(--ease-out)",
                                            "group-hover:translate-x-0 group-hover:opacity-100",
                                            "group-active:translate-x-0 group-active:opacity-100",
                                            "group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
                                        )}
                                    />
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
        </div>
    )
}
