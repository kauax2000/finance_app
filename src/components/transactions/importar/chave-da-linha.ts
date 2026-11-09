/** Só o que a linha tem de si: o Inverter vira o sinal, então o valor entra em módulo. */
type Chavavel = { data: string; descricao: string; valor: number }

const base = (i: Chavavel) => `${i.data}|${i.descricao.trim().toLowerCase()}|${Math.abs(i.valor)}`

/**
 * A chave de cada linha da lista, estável entre leituras (o `clientId` nasce de novo a cada uma) e que sobrevive
 * ao Inverter. Iguais na mesma lista ganham um contador, para a chave nunca repetir.
 */
export function chavesDasLinhas(itens: readonly Chavavel[]): string[] {
    const vistas = new Map<string, number>()
    return itens.map((i) => {
        const b = base(i)
        const n = vistas.get(b) ?? 0
        vistas.set(b, n + 1)
        return `${b}#${n}`
    })
}
