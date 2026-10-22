import { NextResponse } from "next/server"
import { destinoDoTexto, lerFormulario } from "@/lib/captura/compartilhado"

/**
 * O `share_target` sem service worker ativo (primeira instalação, troca de
 * versão, dev sem PWA): sem cache para guardar, o arquivo fica de fora e só o
 * texto segue para o `?frase=`. Com o service worker ativo, ele captura o POST
 * antes de chegar aqui.
 */
export async function POST(request: Request) {
    const form = await lerFormulario(request)
    return NextResponse.redirect(destinoDoTexto(form, request.url), 303)
}
