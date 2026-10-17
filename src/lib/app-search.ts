import { commandFilter } from "@/lib/command-filter"

/**
 * Os `limite` melhores pela nota do `commandFilter` (0 fica fora); empate
 * mantém a ordem de entrada. Termo vazio devolve os primeiros `limite`.
 *
 * É a paleta que filtra (`shouldFilter: false` no cmdk): cada grupo escolhe as
 * suas linhas aqui, e o cmdk só desenha o que recebeu, na ordem recebida.
 */
export function ranquear<T>(
    itens: readonly T[],
    termo: string,
    chave: (item: T) => { valor: string; palavras?: string[] },
    limite: number,
): T[] {
    return itens
        .map((item) => {
            const { valor, palavras } = chave(item)
            return { item, nota: commandFilter(valor, termo, palavras) }
        })
        .filter((x) => x.nota > 0)
        // o `sort` é estável: no empate (e no termo vazio, tudo 1) vale a entrada
        .sort((a, b) => b.nota - a.nota)
        .slice(0, limite)
        .map((x) => x.item)
}
