import {
    ArrowPathRoundedSquareIcon,
    ClipboardDocumentCheckIcon,
    CreditCardIcon,
} from "@heroicons/react/16/solid"

import { AppWordmark } from "@/components/layout/app-wordmark"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardNote, CardToolbar } from "@/components/ui/card"
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
import { SplitShellAside } from "@/components/ui/split-shell"
import { Muted } from "@/components/ui/typography"
import { currencyBRL } from "@/lib/formatters"

/**
 * O painel de marca das telas de acesso.
 *
 * Ele existe para responder, antes da senha, a pergunta que a tela de login
 * padrão não responde: **o que é este app**. A resposta não é uma frase de
 * efeito — é um cartão do próprio produto, com o saldo e as três coisas que
 * ele junta à carteira, cada uma com o número que ela teria. Quem chega vê o
 * produto, não uma promessa.
 *
 * **É um cartão, não uma coluna.** A superfície é a `@utility brand-field` — o
 * arco-íris da marca com grão pesado e vinheta para o preto —, e ela tem
 * cantos, fio e margem: o campo lê como um objeto pousado na página, e não
 * como a página pintada. Abaixo da quebra do casco (a container query
 * `@3xl/split-shell`, e não a janela) ele é o cartão do topo do formulário; a
 * partir dela é a coluna esquerda inteira.
 *
 * **Nenhum texto corrido mora direto sobre o arco-íris.** Sete matizes não têm
 * um contraste só, e o que se lê vive dentro de `Card`, que segue o tema —
 * branco no claro, escuro no escuro — e por isso passa na norma sem tinta
 * local. A única exceção é o `AppWordmark`, branco e grande, apoiado na
 * vinheta: ele herda o `color` branco do campo por `currentColor`. A utility
 * não redefine token nenhum — a versão verde redefinia `--foreground`, e sobre
 * o arco-íris isso desceu pelo `Card` e deixou o saldo branco no cartão branco.
 *
 * A pilha atrás do cartão da frente é a referência de "produto" (páginas de um
 * documento, cartões de uma carteira), e é decorativa: `aria-hidden`, sem
 * conteúdo, só a aresta de cima aparecendo.
 */

/**
 * Os números são **de exemplo**, e o cartão diz isso no chip da barra. Eles são
 * autorados com fidelidade — valores que uma carteira real teria, não
 * `1.234,56` — porque uma demonstração preguiçosa lê como um protótipo. O que
 * não se inventa é alegação comercial: não há aqui nenhuma contagem de
 * clientes, preço ou promessa de resultado.
 */
const SALDO = 4182.6

const AREAS = [
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
        // A geometria do campo — o cartão do telefone com a área segura do
        // notch dentro dele, a coluna do desktop, a superfície `brand-field` e
        // o `self-start` da marca — é do `SplitShellAside` desde a rodada 235.
        // Daqui sai só o conteúdo.
        //
        // Sem `rainbow` no wordmark: sobre o arco-íris o lockup é branco, e é
        // o campo quem lhe dá a cor.
        <SplitShellAside surface="brand" brand={<AppWordmark size="lg" />}>
            {/* O cartão do telefone — **com os números**.

                A pilha completa empurraria os campos para fora da primeira
                dobra, e um painel de prova que esconde o formulário deixou de
                ser prova. Mas esconder tudo deixava o aparelho principal deste
                produto (ver `PRODUCT.md`) com uma faixa colorida e nada mais,
                que é o arranjo que a tese recusa.

                A grade de dois por dois cabe em 375px e carrega valor. Ela é
                `DescriptionList`, que é exatamente o par termo/valor, com
                `columns={2}` porque aqui as duas colunas valem **antes** de
                640px. */}
            <Card padding="sm" className="@3xl/split-shell:hidden">
                <CardContent>
                    <DescriptionList layout="grid" size="sm" columns={2}>
                        <DescriptionListItem>
                            <DescriptionTerm>Carteira</DescriptionTerm>
                            {/* `currencyBRL` e não `MoneyDisplay`: o `<dd>` já
                                é o valor, e já traz `.nums`. Aninhar os dois
                                seria dois donos para a mesma tinta. */}
                            <DescriptionDetails>{currencyBRL(SALDO)}</DescriptionDetails>
                        </DescriptionListItem>
                        {AREAS.map(({ title, value }) => (
                            <DescriptionListItem key={title}>
                                <DescriptionTerm>{title}</DescriptionTerm>
                                <DescriptionDetails>{currencyBRL(value)}</DescriptionDetails>
                            </DescriptionListItem>
                        ))}
                    </DescriptionList>
                </CardContent>
                <CardNote>Números de exemplo.</CardNote>
            </Card>

            {/* A pilha do desktop: dois cartões vazios atrás, só a aresta de
                cima à mostra, e o cartão do produto na frente. Os de trás são
                `absolute` e vêm antes no DOM; o da frente é `relative` e vem
                depois, então pinta por cima sem `z-index` nenhum. O `pt-6` do
                envelope é o espaço que as duas arestas ocupam. */}
            <div className="relative hidden pt-6 @3xl/split-shell:block">
                <Card
                    variant="elevated"
                    padding="none"
                    aria-hidden
                    className="absolute inset-x-8 top-0 h-8 opacity-40"
                />
                <Card
                    variant="elevated"
                    padding="none"
                    aria-hidden
                    className="absolute inset-x-4 top-3 h-8 opacity-70"
                />
                <Card variant="elevated" padding="none" className="relative">
                    <CardToolbar variant="title">
                        Carteira
                        <Badge tone="neutral" size="xs">
                            exemplo
                        </Badge>
                    </CardToolbar>
                    <CardContent className="px-(--card-strip-px) pb-2">
                        {/* Rótulo sobre valor: par de identidade, sem gap. */}
                        <Muted>saldo deste mês</Muted>
                        <MoneyDisplay value={SALDO} size="2xl" />
                    </CardContent>
                    <ItemGroup variant="divided">
                        {AREAS.map(({ icon: Icon, title, detail, value }) => (
                            <Item key={title} size="lg">
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
                    <CardNote>
                        Tudo o que entra e sai da casa num lugar só — e
                        compartilhado com quem divide as contas.
                    </CardNote>
                </Card>
            </div>
        </SplitShellAside>
    )
}
