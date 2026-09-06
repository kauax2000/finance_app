"use client"

import { Glass } from "@/components/ui/glass"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Muted, Small } from "@/components/ui/typography"

import { cn } from "@/lib/utils"

import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

/** Linhas falsas, só para a placa ter conteúdo por cima. */
function LinhasDeMenu() {
    return (
        <div className="flex flex-col gap-1 p-2">
            <Small className="px-2 py-1 text-muted-foreground">Finanças</Small>
            {["Início", "Transações", "Carteiras", "Cartões"].map((rotulo, i) => (
                <div
                    key={rotulo}
                    className={`rounded-md px-2 py-1.5 text-sm ${i === 0 ? "bg-current/12 font-medium" : ""}`}
                >
                    {rotulo}
                </div>
            ))}
        </div>
    )
}

/**
 * Uma pastilha na caixa de um switch de tema — 72×32.
 *
 * Ela **espalha as props na raiz**, e isso não é cerimônia: sem o espalhamento,
 * o `Slot` entrega a `className` e ninguém a aplica. Foi o que aconteceu na
 * primeira escrita desta página — o espécime saiu sem vidro nenhum, calado.
 */
function PastilhaDeControle({
    className,
    ...props
}: React.ComponentProps<"div">) {
    return (
        <div
            className={cn("relative h-8 w-18 shrink-0 rounded-full p-0.5", className)}
            {...props}
        >
            <div className="absolute inset-y-0.5 left-0.5 w-[calc(50%-0.125rem)] rounded-full border border-border/80 bg-background shadow-xs" />
        </div>
    )
}

export default function GlassDoc() {
    return (
        <>
            <Usage>
                A superfície de vidro do sistema: uma lâmina translúcida que puxa
                para o chão do próprio tema, duas nuvens de luz nos cantos
                opostos da diagonal, e um aro inclinado que é a aresta pegando
                luz. Ela nasceu na placa flutuante da barra lateral e saiu de lá
                para poder vestir qualquer peça.
                <br />
                <br />
                <strong>Existem dois vidros nesta casa, e a escolha é pela
                premissa.</strong> Este é o <strong>pintado</strong>: ele não
                borra nada, porque conta com <em>não haver conteúdo atrás</em> —
                um painel que reserva a própria calha, um controle sobre cor
                chapada. Quando há algo passando por baixo, o certo é a{" "}
                <code>.mobile-glass-surface</code>, que tem{" "}
                <code>backdrop-filter</code> de verdade e o{" "}
                <code>prefers-reduced-transparency</code> que um blur obriga.
                Borrar cor chapada não desenha nada.
            </Usage>

            <DocSection
                title="A superfície"
                description="O degrau `panel`, que é o padrão. A lâmina é o corpo; as duas nuvens moram nos cantos superior-esquerdo e inferior-direito; o aro corre na diagonal entre eles."
                previewClassName="bg-background p-6"
                code={`<Glass className="w-60 rounded-xl shadow-sm">
  …
</Glass>`}
            >
                <Glass className="h-64 w-60 rounded-xl shadow-sm">
                    <LinhasDeMenu />
                </Glass>
            </DocSection>

            <DocSection
                title="Numa caixa pequena"
                description="O degrau `control`. Porcentagem escala e percepção não: a nuvem de `panel` vira 5,7px de luz num controle de 32px, e isso lê como aresta dura em vez de nuvem."
                previewClassName="bg-background p-6"
                code={`<Glass size="control" className="h-8 w-18 rounded-full" />`}
            >
                <div className="flex items-center gap-8">
                    <div className="flex flex-col items-center gap-2">
                        <Glass size="control" className="h-8 w-18 rounded-full" />
                        <Muted className="text-2xs">control</Muted>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <Glass className="h-8 w-18 rounded-full" />
                        <Muted className="text-2xs">panel, na mesma caixa</Muted>
                    </div>
                </div>
            </DocSection>

            <DocSection
                title="Vestindo uma peça que já existe"
                description="Com `asChild` nenhum nó é criado — o `Slot` mescla as classes no filho. É a forma de dar vidro a um controle sem tocar na `className` dele."
                previewClassName="bg-background p-6"
                code={`<Glass asChild size="control">
  <AppThemeToggle />
</Glass>`}
            >
                <Glass asChild size="control">
                    <PastilhaDeControle />
                </Glass>
            </DocSection>

            <DocNote title="A ordem das camadas é o mecanismo, e não um detalhe">
                A lâmina é pintada <strong>por cima</strong> das nuvens, e é a
                atenuação dela que constrói o &ldquo;atrás&rdquo;. Medido no tema
                escuro: 48% de branco sobre a página dá rgb 128, e a lâmina a 82%
                o leva a <strong>23</strong> contra um corpo de{" "}
                <strong>2</strong>. Pintadas por cima, as mesmas nuvens dariam
                128 e leriam como manchas <em>na</em> placa. Alfa alto, resultado
                baixo.
                <br />
                <br />
                Consequência prática: os dois alfas andam juntos. Escurecer a
                lâmina sem subir a nuvem apaga a luz na mesma proporção — 17%
                atrás de 55% de preto e 48% atrás de 82% rendem o mesmo pico.
            </DocNote>

            <DocNote title="A polaridade se inverte entre os temas, e a distância não">
                A régua é uma só: <strong>a lâmina se afasta da página na direção
                do chão daquele tema</strong>. No escuro esse chão é o preto; no
                claro é a família neutra própria dele — que é acromática, com a
                página em <code>oklch(0.985)</code> e o branco de verdade morando
                no <code>--card</code>. Preto com alfa ali introduziria um cinza
                que o tema não tem em lugar nenhum.
                <br />
                <br />
                <Table className="mt-2">
                    <TableHeader>
                        <TableRow>
                            <TableHead> </TableHead>
                            <TableHead>escuro</TableHead>
                            <TableHead>claro</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell>lâmina</TableCell>
                            <TableCell className="nums">preto 82% → rgb 2</TableCell>
                            <TableCell className="nums">branco 92% → rgb 255</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>razão da página</TableCell>
                            <TableCell className="nums">1,049</TableCell>
                            <TableCell className="nums">1,040</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>pico do aro</TableCell>
                            <TableCell className="nums">luz, sup-esq</TableCell>
                            <TableCell className="nums">sombra, inf-dir</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>nuvens</TableCell>
                            <TableCell className="nums">23 e 23</TableCell>
                            <TableCell className="nums">não registram</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
                <br />
                <strong>As nuvens não registram no claro por aritmética, e não
                por timidez.</strong> A página é rgb 250 de 255 e a lâmina já a
                levou a 255: não sobra nenhuma unidade acima do corpo. Quem
                quiser luz de verdade no claro precisa baixar{" "}
                <code>--background</code>, o que é decisão de sistema.
            </DocNote>

            <DocNote title="O que faz brilhar não é o realce sozinho — é o par">
                O extremo <code>100%</code> do aro já foi derivado do pico
                (<code>color-mix(--glass-rim 45%, transparent)</code>), sob a
                lógica de que a base não tem luz própria, tem menos da mesma.
                Isso vale enquanto os dois extremos são da{" "}
                <strong>mesma natureza</strong> — e no escuro são, os dois são
                luz.
                <br />
                <br />
                <strong>No claro não são.</strong> Ali o pico é sombra, e
                derivado o outro extremo só podia ser uma sombra mais fraca.
                Medido: os quatro cantos saíam em 210, 232, 232 e 235 contra uma
                placa de 255 — <strong>todos abaixo dela</strong>. Isso é um
                contorno, não um bisel: a peça não tinha lado aceso.
                <br />
                <br />
                Com <code>--glass-rim-far</code> como token próprio, o claro
                ganha realce branco puro no canto superior-esquerdo e a lâmina
                cede três unidades (255 → <strong>252</strong>) para o realce ter
                onde existir — sem descer abaixo da página, que continua em 250.
                O par vai de <strong>205 a 255</strong>: amplitude 50 contra as
                25 de antes, e razão <strong>1,591</strong> entre os dois lados.
                Cada lado sozinho mal se separa da placa; o par é o que lê.
                <br />
                <br />
                No escuro o token vale <code>15%</code> — os mesmos 45% de 34%
                que o derivado valia —, então aquele lado não se mexeu: corpo 2,
                aro 94, vestígio 47.
            </DocNote>

            <DocNote title="É um eixo só de aro, girado 180° entre os temas">
                <code>--glass-rim-angle</code> vale 165° no escuro e 345° no
                claro — o mesmo eixo pela outra ponta. A geometria é idêntica e
                só a polaridade inverte: sombra de uma placa acesa por
                cima-à-esquerda mora no canto oposto ao brilho. Com dois valores
                soltos, os dois biséis podiam apontar para direções diferentes
                sem ninguém perceber, e o teste tranca a soma.
                <br />
                <br />
                Isto reverte uma decisão anterior que pusera o aro em 180° reto,
                e a reversão é legítima porque <strong>a peça mudou</strong>:
                naquela versão o corpo era uma rampa vertical com que um aro
                diagonal brigava; hoje o corpo é chapado e a luz mora nos cantos.
            </DocNote>

            <DocNote title="A pegada das nuvens é o espelho da do aro">
                Os números saem de medir a caixa real (240×424), não de
                estimativa. O aro chega ao vale em 16% de um eixo de 471,7px — ou
                seja 75,5px —, então a zona clara dele cobre a largura toda do
                topo e desce <strong>18,4% da altura</strong> pela borda
                esquerda. Refletido pelo centro: a largura toda de baixo, subindo
                18,4% pela direita. Daí <code>100% 18%</code> em{" "}
                <code>0% 0%</code> e <code>100% 100%</code>.
                <br />
                <br />
                <strong>O que não dá para espelhar é a inclinação.</strong>{" "}
                <code>radial-gradient</code> não rotaciona os eixos da elipse em
                CSS — não existe sintaxe para isso. O que se iguala é a pegada; o
                tombo de 15° fica só no aro, e é ele que carrega a direção.
            </DocNote>

            <DocNote title="`asChild` só funciona se o filho repassar props">
                O <code>Slot</code> entrega <code>className</code> ao filho; quem
                a aplica no elemento certo é o filho. Um componente que aceita só{" "}
                <code>children</code> recebe a classe e a descarta — e o defeito é{" "}
                <strong>calado</strong>: nada quebra, a peça simplesmente sai sem
                vidro. Aconteceu na primeira escrita desta página.
                <br />
                <br />
                Antes de vestir alguma coisa, confira que ela faz{" "}
                <code>className={"{cn(…, className)}"}</code> na raiz. O{" "}
                <code>AppThemeToggle</code> faz, nos dois ramos.
                <br />
                <br />
                E o <code>data-slot</code> do filho <strong>vence</strong> o da
                peça — dentro de <code>{"<Glass asChild>"}</code> um toggle
                continua se anunciando como <code>app-theme-toggle</code>. É a
                resolução do <code>Slot</code>, e é o nome certo: naquele lugar
                aquilo é um toggle que por acaso está de vidro.
            </DocNote>

            <DocNote title="Três coisas que mordem quem veste isto numa peça existente">
                <strong>1. O shorthand `background` apaga o `background-color`.</strong>{" "}
                Medido na barra: o <code>bg-sidebar</code> que continuava na
                string resolvia <code>rgba(0, 0, 0, 0)</code> sob a utility.
                Vestir vidro <em>substitui</em> o preenchimento; não soma a ele.
                <br />
                <br />
                <strong>2. A borda transparente de 1px toma a borda.</strong> O
                aro é pintado no <code>border-box</code>, então a peça precisa de
                uma borda onde ele more. Com <code>box-sizing: border-box</code>{" "}
                a caixa externa não cresce — o conteúdo encolhe 2px, e num
                controle com filho absoluto calibrado isso desloca 1px.
                <br />
                <br />
                <strong>3. O raio é herdado, e é isso que a torna portátil.</strong>{" "}
                A utility não declara <code>border-radius</code>. É o que faz{" "}
                <code>rounded-full</code> num controle e <code>rounded-xl</code>{" "}
                num painel funcionarem sem eixo nenhum.
            </DocNote>

            <DocNote title="Porcentagem escala; percepção não">
                É a razão de o eixo <code>size</code> existir, e a única. A nuvem
                de <code>panel</code> é <code>100% 18%</code>: numa placa de
                424px são 76px de luz difusa, e num controle de 32px são{" "}
                <strong>5,7px</strong>. A fração óptica é idêntica nos dois e o
                resultado não é — 5,7px de gradiente lê como aresta dura. O
                preset corrige a <em>medida absoluta</em>, não a proporção.
                <br />
                <br />
                Ele sobrescreve <strong>só a variável</strong>, e nunca a
                propriedade: <code>glass</code> lê{" "}
                <code>var(--glass-cloud-ry, 18%)</code> e não declara a variável
                em lugar nenhum. Duas utilities escrevendo{" "}
                <code>background</code> seriam decididas por ordem de emissão do
                Tailwind e não pelo que se escreveu.
            </DocNote>

            <DocNote title="O que foi tentado e rejeitado, que vale tanto quanto o que ficou">
                <strong>Uma lavagem vertical de altura inteira</strong>, chegando
                a rgb 62 no topo. Trocar linear por radial não resolvia nada
                porque o radial cobria a placa toda: o que importa não é a
                família da curva, é a <strong>escala</strong>. Luz que ocupa a
                peça inteira é fundo, não é luz.
                <br />
                <br />
                <strong>O aro baixado de 34% para 18%</strong>, sob o argumento
                de que contraluz não tem especular. Errado: o aro não descreve de
                onde vem a luz do corpo — ele é a aresta pegando luz, e sem ele a
                peça vira um retângulo escuro.
                <br />
                <br />
                <strong>Três focos, depois dois, depois um.</strong> O do meio da
                borda direita disputava com a lista de links; o do topo-esquerdo
                disputava com o cabeçalho. A régua que sobrou é{" "}
                <em>luz vai onde não há conteúdo</em> — e ela foi depois
                revertida de propósito, com o custo medido na mesa, quando o par
                da diagonal ficou mais equilibrado que um foco só.
                <br />
                <br />
                <strong>A placa clara em 244</strong>, mais escura que a página
                em 250. Ela fazia a navegação recuar num tema em que ela deve
                avançar.
            </DocNote>

            <DocNote title="Sem eixo de intensidade">
                Zero contagem. Quem precisar de um vidro mais forte ou mais fraco
                sobrescreve os cinco tokens no próprio elemento — eles são
                variáveis, e variável herda. Um eixo com um caso só medido é
                ficção, e este projeto já removeu dois que eram constante
                disfarçada.
            </DocNote>

            <PropsTable
                rows={[
                    {
                        prop: "size",
                        type: `"panel" | "control"`,
                        default: `"panel"`,
                        description:
                            "A medida da caixa. Existe porque a nuvem de `panel` vira 5,7px de luz num controle de 32px — a proporção é a mesma e a percepção não.",
                    },
                    {
                        prop: "asChild",
                        type: "boolean",
                        default: "false",
                        description:
                            "Veste a peça de quem chama em vez de renderizar um `div`. Nenhum nó é criado; o `Slot` mescla as classes no filho.",
                    },
                    {
                        prop: "className",
                        type: "string",
                        description:
                            "O raio, a sombra e a caixa são de quem chama — a utility não declara nenhum dos três.",
                    },
                ]}
            />

            <PropsTable
                title="Tokens"
                rows={[
                    {
                        prop: "--glass-tint",
                        type: "cor com alfa",
                        description:
                            "A lâmina. Preto no escuro, branco no claro — ela se afasta da página na direção do chão daquele tema.",
                    },
                    {
                        prop: "--glass-cloud",
                        type: "cor com alfa",
                        description:
                            "A luz atrás. Branca nos dois temas, e lida através da lâmina — daí o alfa alto para um resultado baixo.",
                    },
                    {
                        prop: "--glass-rim",
                        type: "cor com alfa",
                        description:
                            "O pico do aro. Luz no escuro, sombra no claro. Piso de 28% no escuro: abaixo disso a peça deixa de ler como vidro.",
                    },
                    {
                        prop: "--glass-rim-shade",
                        type: "cor com alfa",
                        description: "O vale do aro, nos lados.",
                    },
                    {
                        prop: "--glass-rim-angle",
                        type: "ângulo",
                        description:
                            "O eixo. 165° no escuro e 345° no claro — o mesmo eixo pela outra ponta.",
                    },
                    {
                        prop: "--glass-cloud-rx / -ry",
                        type: "medida",
                        default: "100% / 18%",
                        description:
                            "A pegada das nuvens. O preset `control` move só a `-ry`; a utility as lê com fallback e não as declara.",
                    },
                ]}
            />
        </>
    )
}
