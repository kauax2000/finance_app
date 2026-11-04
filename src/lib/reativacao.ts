/** Dias sem acesso que fazem a pessoa "voltar" (e o app deixar de contar como recente). */
export const PRAZO_DIAS = 10

const DIA_MS = 86_400_000

/** Dias inteiros pela data local: 23h30 de ontem já é 1 dia, não 0. */
export function diasDesde(iso: string, agora: Date): number {
    const antes = new Date(iso)
    const a = Date.UTC(antes.getFullYear(), antes.getMonth(), antes.getDate())
    const b = Date.UTC(agora.getFullYear(), agora.getMonth(), agora.getDate())
    return Math.round((b - a) / DIA_MS)
}

/** Sem acesso anterior (conta nova) o primeiro registro não é volta. */
export function voltouDeAusencia(anterior: string | null, agora: Date): boolean {
    return anterior !== null && diasDesde(anterior, agora) >= PRAZO_DIAS
}

export function appRecente(appAbertoEm: string | null, agora: Date): boolean {
    return appAbertoEm !== null && diasDesde(appAbertoEm, agora) < PRAZO_DIAS
}

/** `marca` é a data (aaaa-mm-dd) da última gravação neste aparelho. */
export function deveGravar(marca: string | null, hoje: string): boolean {
    return marca !== hoje
}
