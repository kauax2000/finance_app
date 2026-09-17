import {
    ArrowPathRoundedSquareIcon,
    ArrowsRightLeftIcon,
    ClipboardDocumentCheckIcon,
    CreditCardIcon,
} from "@heroicons/react/16/solid"

import { AppWordmark } from "@/components/layout/app-wordmark"
import {
    DescriptionDetails,
    DescriptionList,
    DescriptionListItem,
    DescriptionTerm,
} from "@/components/ui/description-list"
import {
    Item,
    ItemActions,
    ItemContent,
    ItemDescription,
    ItemGroup,
    ItemMedia,
    ItemTitle,
} from "@/components/ui/item"
import { MoneyDisplay } from "@/components/ui/money-display"
import { currencyBRL } from "@/lib/formatters"
import { Caption, Muted } from "@/components/ui/typography"

/**
 * O painel de marca das telas de acesso.
 *
 * Ele existe para responder, antes da senha, a pergunta que a tela de login
 * padrão não responde: **o que é este app**. A resposta não é uma frase de
 * efeito — são as quatro coisas que o produto junta, cada uma com o número que
 * ela teria. Quem chega vê o escopo, não uma promessa.
 *
 * **Um elemento só, e ele muda de forma.** Abaixo de `lg` é uma faixa de marca
 * no topo do formulário; a partir de `lg` é a coluna esquerda inteira. A lista
 * é `hidden lg:flex` porque num telefone ela empurraria os campos para fora da
 * primeira dobra — e um painel de prova que esconde o formulário deixou de ser
 * prova.
 *
 * A superfície é a `@utility brand-field`, e ela **redefine `--foreground`,
 * `--muted-foreground` e `--border` para o contêiner**. É por isso que nenhum
 * filho de conteúdo declara cor: `Item`, `MoneyDisplay`, `Muted` e `Caption`
 * chegam já com a tinta certa. Ver a nota da utility em `globals.css`.
 *
 * A única exceção é o `AppWordmark`, e ela é da peça e não desta tela: o
 * lockup declara a própria cor (`text-primary-accent dark:text-foreground`),
 * que é a marca sobre o **fundo da página**. Sobre o verde ele precisaria ser
 * verde sobre verde, então aqui ele é sobrescrito para a tinta da superfície.
 */

/**
 * Os números são **de exemplo**, e a tela diz isso em voz alta logo abaixo da
 * lista. Eles são autorados com fidelidade — valores que uma carteira real
 * teria, não `1.234,56` — porque uma demonstração preguiçosa lê como um
 * protótipo. O que não se inventa é alegação comercial: não há aqui nenhuma
 * contagem de clientes, preço ou promessa de resultado.
 */
const AREAS = [
    {
        icon: ArrowsRightLeftIcon,
        title: "Carteira",
        detail: "saldo deste mês",
        value: 4182.6,
    },
    {
        icon: CreditCardIcon,
        title: "Cartões",
        detail: "fatura aberta",
        value: 1284.6,
    },
    {
        icon: ClipboardDocumentCheckIcon,
        title: "Contas a pagar",
        detail: "3 vencem este mês",
        value: 740,
    },
    {
        icon: ArrowPathRoundedSquareIcon,
        title: "Assinaturas",
        detail: "6 ativas",
        value: 189.9,
    },
] as const

export function AuthBrandPanel() {
    return (
        <aside
            className={[
                "brand-field flex flex-col",
                // A faixa do telefone: só a marca, com a área segura dentro da
                // caixa — quem chama não deve saber que existe um notch.
                "px-6 pt-[calc(--spacing(5)+env(safe-area-inset-top,0px))] pb-5",
                // A coluna do desktop.
                "lg:justify-between lg:px-10 lg:py-12 lg:pt-12",
            ].join(" ")}
        >
            {/* `self-start` é obrigatório, e custou uma medição: um `<svg>` é
                elemento substituído, e `w-auto` **não** o protege do
                `align-items: stretch` de uma coluna flex. Medido aqui: a marca
                saiu com 438px de largura em vez de 135, e como o
                `preserveAspectRatio` padrão é `xMidYMid`, o desenho ficou
                centralizado dentro da própria caixa — parecia alinhado ao
                centro do painel sem ninguém ter pedido isso. */}
            <AppWordmark size="lg" className="self-start text-primary-foreground" />

            {/* A tese no telefone — **com os números**.

                A lista de baixo é `hidden lg:flex` porque as quatro linhas
                completas empurrariam os campos para fora da primeira dobra, e
                um painel de prova que esconde o formulário deixou de ser prova.
                Mas esconder tudo deixava o aparelho principal deste produto
                (ver `PRODUCT.md`) com uma faixa verde e nada mais, que é o
                arranjo que a tese recusa.

                Uma primeira tentativa listou só os nomes numa linha. Era
                escopo, não prova: a promessa deste painel é "cada uma com o
                número que ela teria", e quatro palavras separadas por ponto
                médio são a frase de efeito que ele existe para não ser.

                A grade de dois por dois resolve os dois lados: cabe em 375px,
                custa ~60px — medidos contra os ~150px de folga que sobravam
                abaixo do rodapé do formulário — e carrega valor. Ela é
                `DescriptionList`, que é exatamente o par termo/valor, e o
                `grid-cols-2` local vence o `sm:grid-cols-2` do componente
                porque aqui as duas colunas valem **antes** de 640px. */}
            <div className="mt-4 flex flex-col gap-2 lg:hidden">
                <DescriptionList
                    layout="grid"
                    size="sm"
                    className="grid-cols-2 gap-x-6"
                >
                    {AREAS.map(({ title, value }) => (
                        <DescriptionListItem key={title}>
                            <DescriptionTerm>{title}</DescriptionTerm>
                            {/* `currencyBRL` e não `MoneyDisplay`: o `<dd>` já
                                é o valor, e já traz `.nums`. Aninhar os dois
                                seria dois donos para a mesma tinta. */}
                            <DescriptionDetails>
                                {currencyBRL(value)}
                            </DescriptionDetails>
                        </DescriptionListItem>
                    ))}
                </DescriptionList>
                <Caption>Números de exemplo.</Caption>
            </div>

            <div className="hidden lg:flex lg:flex-col lg:gap-(--space-block)">
                <ItemGroup variant="divided">
                    {AREAS.map(({ icon: Icon, title, detail, value }) => (
                        // `px-0`: o painel tem um eixo esquerdo só — a marca,
                        // os ícones e a frase de fecho na mesma vertical. O
                        // recuo que o `Item` traz é para uma lista dentro de um
                        // cartão, e aqui não há cartão.
                        <Item key={title} size="lg" className="px-0">
                            <ItemMedia variant="icon">
                                <Icon />
                            </ItemMedia>
                            <ItemContent>
                                <ItemTitle>{title}</ItemTitle>
                                <ItemDescription>{detail}</ItemDescription>
                            </ItemContent>
                            <ItemActions>
                                <MoneyDisplay value={value} size="lg" />
                            </ItemActions>
                        </Item>
                    ))}
                </ItemGroup>
                <Caption>Números de exemplo.</Caption>
            </div>

            <Muted className="hidden max-w-sm lg:block">
                Tudo o que entra e sai da casa num lugar só — e compartilhado
                com quem divide as contas.
            </Muted>
        </aside>
    )
}
