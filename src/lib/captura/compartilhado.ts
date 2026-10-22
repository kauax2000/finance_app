/**
 * O compartilhar de arquivo do Android (Bloco 3B, Decisão 12). O `share_target`
 * manda um POST multipart para `ROTA_COMPARTILHAR`, que só existe no service
 * worker: ele guarda o arquivo no Cache Storage e redireciona com 303 para a
 * tela de transações, que lê o arquivo pela chave e o apaga.
 *
 * Este módulo roda nos dois lados — `receberCompartilhar` no service worker,
 * `lerArquivoCompartilhado` na página — e por isso não importa nada.
 */

export const ROTA_COMPARTILHAR = "/transactions/compartilhar"
export const CACHE_COMPARTILHADO = "captura-compartilhada"

/** Os campos de texto do `share_target`, com os nomes do `?frase=` do 3A. */
export const CAMPOS_DE_TEXTO = ["frase", "frase_titulo", "frase_url"] as const

const LIMITE_BYTES = 10 * 1024 * 1024
const VALIDADE_MS = 60 * 60 * 1000
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** A chave vem da URL: só um UUID vira caminho no cache. */
export function ehChaveCompartilhada(chave: string | null | undefined): chave is string {
    return typeof chave === "string" && UUID.test(chave)
}

const caminhoDoArquivo = (chave: string) => `/__compartilhado/${chave}`

/** O primeiro arquivo de imagem ou PDF, não vazio e com até 10 MB. */
export function escolherArquivoCompartilhado(entradas: FormDataEntryValue[]): File | null {
    for (const e of entradas) {
        if (typeof e === "string" || e.size === 0 || e.size > LIMITE_BYTES) continue
        if (e.type.startsWith("image/") || e.type === "application/pdf") return e
    }
    return null
}

const vencido = (r: Response, agora: number) => !(agora - Number(r.headers.get("x-criado")) < VALIDADE_MS)

/**
 * A rota do service worker: com arquivo, guarda e manda para
 * `?compartilhado=<chave>` (`&tipo=pdf` no PDF); só com texto, para o
 * `?frase=`; sem nada, para a tela. Sempre 303, para o navegador trocar o POST
 * por um GET.
 */
export async function receberCompartilhar(request: Request, agora = Date.now()): Promise<Response> {
    const destino = new URL("/transactions", request.url)
    let form: FormData | null = null
    try {
        form = await request.formData()
    } catch {
        // Corpo que não é formulário: só abre a tela.
    }
    const arquivo = form ? escolherArquivoCompartilhado(form.getAll("files")) : null
    if (arquivo) {
        const chave = crypto.randomUUID()
        try {
            const cache = await caches.open(CACHE_COMPARTILHADO)
            for (const k of await cache.keys()) {
                const r = await cache.match(k)
                if (!r || vencido(r, agora)) await cache.delete(k)
            }
            await cache.put(
                new URL(caminhoDoArquivo(chave), request.url).href,
                new Response(arquivo, {
                    headers: {
                        "content-type": arquivo.type,
                        "x-nome": encodeURIComponent(arquivo.name),
                        "x-criado": String(agora),
                    },
                })
            )
        } catch (erro) {
            // Sem guardar, a tela não acha a chave e avisa que o arquivo sumiu.
            console.error("compartilhar:", erro)
        }
        destino.searchParams.set("compartilhado", chave)
        if (arquivo.type === "application/pdf") destino.searchParams.set("tipo", "pdf")
    } else if (form) {
        for (const campo of CAMPOS_DE_TEXTO) {
            const valor = form.get(campo)
            if (typeof valor === "string" && valor.trim()) destino.searchParams.set(campo, valor)
        }
    }
    return Response.redirect(destino.href, 303)
}

/**
 * O arquivo do compartilhar, lido uma vez: sai do cache assim que é lido.
 * Chave inválida, já lida ou com mais de 1 hora dá `null`.
 */
export async function lerArquivoCompartilhado(chave: string, agora = Date.now()): Promise<File | null> {
    if (!ehChaveCompartilhada(chave) || typeof caches === "undefined") return null
    try {
        const cache = await caches.open(CACHE_COMPARTILHADO)
        const caminho = caminhoDoArquivo(chave)
        const res = await cache.match(caminho)
        if (!res) return null
        await cache.delete(caminho)
        if (vencido(res, agora)) return null
        const blob = await res.blob()
        let nome = "compartilhado"
        try {
            nome = decodeURIComponent(res.headers.get("x-nome") ?? "") || nome
        } catch {
            // Nome mal codificado: fica o genérico.
        }
        return new File([blob], nome, { type: res.headers.get("content-type") ?? blob.type })
    } catch (erro) {
        console.error("arquivo compartilhado:", erro)
        return null
    }
}
