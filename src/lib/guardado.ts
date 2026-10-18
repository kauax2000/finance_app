// O último valor que o servidor devolveu, guardado no localStorage para a
// próxima abertura pintar na hora em vez de esperar a fila das consultas da
// abertura (o perfil chegava aos 3,7 s; o sino aos 2,2 s). Quem lê ainda busca,
// e corrige o que mudou. Sai junto com a conta (`esquecerGuardados`).
const PREFIXO = "finance:guardado:"

export function lerGuardado<T>(chave: string): T | undefined {
    try {
        const texto = localStorage.getItem(PREFIXO + chave)
        return texto ? (JSON.parse(texto) as T) : undefined
    } catch {
        return undefined
    }
}

/** `null` ou `undefined` apaga. */
export function guardar(chave: string, valor: unknown) {
    try {
        if (valor == null) localStorage.removeItem(PREFIXO + chave)
        else localStorage.setItem(PREFIXO + chave, JSON.stringify(valor))
    } catch {
        /* sem armazenamento, a abertura só espera a busca */
    }
}

export function esquecerGuardados() {
    try {
        for (const chave of Object.keys(localStorage)) {
            if (chave.startsWith(PREFIXO)) localStorage.removeItem(chave)
        }
    } catch {
        /* best effort */
    }
}
