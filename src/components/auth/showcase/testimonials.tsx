import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { SceneFamily } from "@/components/auth/showcase/scene-context"
import { identityToneFor } from "@/lib/avatar"
import { cn, getInitials } from "@/lib/utils"

/**
 * # Depoimentos ilustrativos da colagem do painel de marca
 *
 * Ninguém disse estas frases: são **exemplos** do que o app resolve, e o selo
 * "exemplo" em todo cartão diz isso a quem olha. Por isso nenhuma frase tem
 * número, dinheiro, nota ou empresa — um número soaria como resultado
 * prometido, e um nome de empresa como cliente de verdade. O nome é só
 * "Primeiro I.".
 *
 * O cartão sempre traz o selo; **mantê-lo à vista é da colagem**. Um cartão
 * cujo selo cai sob o herói, a legenda ou outro cartão parece depoimento de
 * verdade — esse lugar não pode aparecer naquela forma e tamanho de palco
 * (conferido por `elementFromPoint` no selo, não só pelo retângulo do palco).
 */

export type TestimonialId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14

export type Testimonial = { id: TestimonialId; name: string; quote: string }

/** As 14 frases da seção 6 do plano do painel, por extenso; o `id` é a numeração de lá. */
export const TESTIMONIALS = [
    { id: 1, name: "Marina S.", quote: "Quitei o cartão sem pressa. Ver a fatura crescer dia a dia mudou meu mês." },
    { id: 2, name: "Lucas P.", quote: "Dividir o aluguel com a Bia virou um clique. Acabou a planilha no grupo." },
    { id: 3, name: "Camila R.", quote: "Achei três assinaturas que eu nem lembrava. Cancelei todas no mesmo dia." },
    { id: 4, name: "Caio R.", quote: "Coloquei um teto pro mercado e cheguei no fim do mês com folga." },
    { id: 5, name: "Juliana M.", quote: "Agora sei o dia em que a fatura fecha e compro depois dele." },
    { id: 6, name: "Thiago N.", quote: "Eu e minha esposa vemos a mesma carteira. Ninguém mais pergunta quem pagou." },
    { id: 7, name: "Diego F.", quote: "Primeira vez que chego no fim do mês sabendo para onde foi cada real." },
    { id: 8, name: "Lúcia F.", quote: "O aviso chega antes do vencimento. Nunca mais paguei multa na conta de luz." },
    { id: 9, name: "André V.", quote: "Separei a reserva de emergência aos poucos e não mexi mais nela." },
    { id: 10, name: "Beatriz N.", quote: "Parcelo menos desde que vi todas as parcelas juntas numa tela só." },
    { id: 11, name: "Gabriel O.", quote: "Uso no computador no trabalho e no celular no mercado. É a mesma conta." },
    { id: 12, name: "Renato C.", quote: "Chamei minha mãe pra carteira da casa. Ela lança a feira pelo celular." },
    { id: 13, name: "Helena B.", quote: "Esqueci a senha e voltei com um código no e-mail, sem chamar ninguém." },
    { id: 14, name: "Patrícia O.", quote: "Troquei de celular e entrei de novo em segundos. Estava tudo lá." },
] as const satisfies readonly Testimonial[]

type Slots = readonly [
    TestimonialId, TestimonialId, TestimonialId, TestimonialId, TestimonialId, TestimonialId,
    TestimonialId, TestimonialId, TestimonialId, TestimonialId, TestimonialId, TestimonialId,
]

/**
 * Que frase pousa em cada lugar (s0…s11) por família — a tabela "Distribuição"
 * da seção 6. A chave do item na colagem é o `id`: o lugar que mantém a frase
 * não se mexe na troca de família, e só os que mudam trocam (vindo do login,
 * o cadastro troca cinco, a recuperação e o convite, três).
 */
export const TESTIMONIAL_SLOTS = {
    login: [1, 5, 7, 3, 10, 8, 9, 2, 4, 6, 11, 14],
    register: [1, 11, 7, 3, 4, 8, 9, 12, 10, 6, 5, 14],
    recovery: [13, 5, 7, 3, 14, 8, 9, 2, 4, 6, 11, 10],
    invite: [1, 12, 7, 6, 10, 8, 9, 2, 4, 3, 11, 14],
} as const satisfies Record<SceneFamily, Slots>

const POR_ID = new Map<TestimonialId, Testimonial>(TESTIMONIALS.map((t) => [t.id, t]))

/** Os doze depoimentos da família, na ordem dos lugares (o índice é o `slot` do `ShowcaseScatterItem`). */
export function testimonialsFor(family: SceneFamily): Testimonial[] {
    return TESTIMONIAL_SLOTS[family].map((id) => POR_ID.get(id)!)
}

/**
 * O selo vai do lado voltado para o centro do palco, lido do `data-edge` que o
 * `ShowcaseScatterItem` publica (classes por extenso):
 * - `end` (a borda direita corta): no topo, à **esquerda**, antes do autor;
 * - `start`: no topo, à direita;
 * - `bottom`: no topo, à direita;
 * - `top`: na linha de baixo, depois da frase.
 */
const SELO_NO_TOPO = cn(
    "ms-auto",
    "group-data-[edge=end]/showcase-item:order-first group-data-[edge=end]/showcase-item:ms-0 group-data-[edge=end]/showcase-item:me-auto",
    "group-data-[edge=top]/showcase-item:hidden"
)
const SELO_EMBAIXO = "hidden self-start group-data-[edge=top]/showcase-item:inline-flex"

/**
 * Um cartão da colagem. A largura é do lugar (o `ShowcaseScatterItem` a mede
 * por nível: XS `w-44`, S `w-48`, M e L `w-56`); a sombra também.
 *
 * **A frase cabe em três linhas em todo nível, sem reticências** — medido com
 * as 14 frases: `text-2xs` no XS, `text-xs` no S e `text-sm` do M em diante,
 * sempre `tracking-tight`. No XS (176px) metade das frases pedia uma quarta
 * linha em `text-xs`, e a do aviso de vencimento pedia quatro linhas no S e no
 * M sem o `tracking-tight`. O `line-clamp-3` fica de rede.
 */
export function AuthTestimonialCard({ testimonial, className }: { testimonial: Testimonial; className?: string }) {
    const { name, quote } = testimonial
    const tom = identityToneFor(null, name)
    return (
        <Card variant="elevated" padding="sm" data-slot="auth-testimonial" className={className}>
            <CardContent className="flex flex-col gap-2">
                {/* No XS a linha tem 150px: o nome mais longo (`text-2xs`) e o selo cabem lado a lado com `gap-1.5`, por 3px. */}
                <div className="flex items-center gap-1.5">
                    <Avatar size="xs">
                        <AvatarFallback tint="soft" className={cn(tom.surface, tom.ink)}>
                            {getInitials(name)}
                        </AvatarFallback>
                    </Avatar>
                    <span className="truncate text-2xs font-medium @md/showcase:text-xs">{name}</span>
                    <Badge variant="soft" tone="neutral" size="xs" className={SELO_NO_TOPO}>
                        exemplo
                    </Badge>
                </div>
                <p className="line-clamp-3 text-2xs leading-snug tracking-tight text-pretty @md/showcase:text-xs @xl/showcase:text-sm">“{quote}”</p>
                <Badge variant="soft" tone="neutral" size="xs" className={SELO_EMBAIXO}>
                    exemplo
                </Badge>
            </CardContent>
        </Card>
    )
}
