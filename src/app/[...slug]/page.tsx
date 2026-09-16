import { notFound } from "next/navigation"

/**
 * Rota desconhecida responde 404 de verdade. Renderizar a página de "não
 * encontrada" daqui devolvia status 200 — o que buscadores e monitores leem
 * como página válida. `notFound()` cai em `src/app/not-found.tsx`.
 */
export default function CatchAllUnknownPage() {
    notFound()
}
