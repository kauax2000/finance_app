export type ResultadoPdf =
    | { ok: true; texto: string }
    | { ok: false; precisaSenha: true; senhaIncorreta: boolean }
    | { ok: false; erro: string }

type PedacoDeTexto = { str: string; transform: number[] }

/**
 * O texto do PDF, uma linha por coordenada y (arredondada), cada linha em ordem
 * de x. O pdfjs só carrega aqui, quando alguém abre um PDF. PDF com senha volta
 * `precisaSenha`, e a senha errada volta `senhaIncorreta` (Foco 1).
 */
export async function pdfParaTexto(arquivo: File, senha?: string): Promise<ResultadoPdf> {
    const pdfjs = await import("pdfjs-dist")
    pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString()

    // O `task` destrói o documento e o worker no `finally`, também na senha
    // errada: cada tentativa criava um worker que ficava vivo até a navegação.
    let task: ReturnType<typeof pdfjs.getDocument> | undefined
    try {
        task = pdfjs.getDocument({ data: new Uint8Array(await arquivo.arrayBuffer()), password: senha })
        const doc = await task.promise
        const linhas: string[] = []
        for (let n = 1; n <= doc.numPages; n++) {
            const pagina = await doc.getPage(n)
            const { items } = await pagina.getTextContent()
            const porY = new Map<number, PedacoDeTexto[]>()
            for (const it of items as Array<Partial<PedacoDeTexto>>) {
                if (!it.str?.trim() || !it.transform) continue
                const y = Math.round(it.transform[5])
                porY.set(y, [...(porY.get(y) ?? []), it as PedacoDeTexto])
            }
            for (const y of [...porY.keys()].sort((a, b) => b - a)) {
                const pedacos = porY.get(y)!.sort((a, b) => a.transform[4] - b.transform[4])
                linhas.push(pedacos.map((p) => p.str.trim()).join(" "))
            }
        }
        return { ok: true, texto: linhas.join("\n") }
    } catch (e) {
        const err = e as { name?: string; code?: number; message?: string }
        if (err?.name === "PasswordException") {
            return {
                ok: false,
                precisaSenha: true,
                senhaIncorreta: err.code === pdfjs.PasswordResponses.INCORRECT_PASSWORD,
            }
        }
        return { ok: false, erro: `Não foi possível ler o PDF${err?.message ? `: ${err.message}` : "."}` }
    } finally {
        await task?.destroy()
    }
}
