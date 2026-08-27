/**
 * A cor de uma pessoa — qual das seis identidades ela é.
 *
 * Antes isto devolvia classe crua da paleta do Tailwind (`bg-red-500` e
 * companhia) com texto branco por cima, e o catálogo registrava a troca pelos
 * tons de identidade como bloqueada por "migração de dados".
 *
 * Ela não estava. `profiles.avatar_color` é gravado **uma vez, por trigger no
 * signup**, sorteando entre estas 17 classes; nenhuma tela do app o atualiza, e
 * a RPC do diretório de membros preenche o vazio com `bg-sky-500`. Ou seja:
 * todo valor gravado é um destes 17, e um valor conhecido não precisa migrar —
 * precisa ser lido. O que estava guardado continua decidindo **qual** pessoa é
 * qual; só o desenho passa a ser de token.
 */

/**
 * As 17 classes que o trigger sorteia, na ordem do círculo de matiz. A ordem é
 * o que permite dobrá-las nas seis identidades sem embaralhar quem era
 * avermelhado com quem era azulado.
 */
const LEGACY_AVATAR_CLASSES = [
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-sky-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-purple-500",
    "bg-fuchsia-500",
    "bg-pink-500",
    "bg-rose-500",
] as const

/**
 * Os seis pares, escritos por extenso porque o Tailwind precisa ver a classe no
 * fonte para gerá-la — nome montado em runtime não existe no CSS.
 *
 * Superfície opaca e não alpha: avatares que se sobrepõem em pilha mostrariam
 * o de baixo através do de cima, e as iniciais leriam sobre a cor do vizinho.
 */
export const IDENTITY_TONES = [
    { surface: "bg-identity-1-surface", ink: "text-identity-1" },
    { surface: "bg-identity-2-surface", ink: "text-identity-2" },
    { surface: "bg-identity-3-surface", ink: "text-identity-3" },
    { surface: "bg-identity-4-surface", ink: "text-identity-4" },
    { surface: "bg-identity-5-surface", ink: "text-identity-5" },
    { surface: "bg-identity-6-surface", ink: "text-identity-6" },
] as const

export type IdentityTone = (typeof IDENTITY_TONES)[number]

function hashIndex(seed: string, buckets: number): number {
    let hash = 0
    for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash)
    }
    return Math.abs(hash) % buckets
}

/**
 * O tom de uma pessoa, a partir do que está gravado — ou do nome, quando não
 * há nada gravado.
 *
 * Uma classe legada vira a identidade da mesma região do círculo de matiz: quem
 * era avermelhado segue avermelhado. Dezessete matizes dobrados em seis colidem,
 * e tudo bem: identidade só precisa distinguir uma pessoa da seguinte, não
 * carregar significado.
 */
export function identityToneFor(
    stored: string | null | undefined,
    fallbackSeed: string
): IdentityTone {
    const legado = stored?.trim()
    if (legado) {
        const i = LEGACY_AVATAR_CLASSES.indexOf(
            legado as (typeof LEGACY_AVATAR_CLASSES)[number]
        )
        if (i >= 0) {
            return IDENTITY_TONES[
                Math.floor((i * IDENTITY_TONES.length) / LEGACY_AVATAR_CLASSES.length)
            ]
        }
        // Valor fora da lista — dado velho ou escrito à mão. O próprio valor
        // vira semente, para a pessoa continuar com a mesma cor a cada carga.
        return IDENTITY_TONES[hashIndex(legado, IDENTITY_TONES.length)]
    }
    return IDENTITY_TONES[hashIndex(fallbackSeed, IDENTITY_TONES.length)]
}
