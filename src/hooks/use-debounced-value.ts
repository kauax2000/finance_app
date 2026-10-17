import * as React from "react"

/** O valor só muda `ms` depois da última troca (a busca espera a pessoa parar de digitar). */
export function useDebouncedValue<T>(valor: T, ms: number): T {
    const [atrasado, setAtrasado] = React.useState(valor)
    React.useEffect(() => {
        const id = setTimeout(() => setAtrasado(valor), ms)
        return () => clearTimeout(id)
    }, [valor, ms])
    return atrasado
}
