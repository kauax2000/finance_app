import type { Metadata } from "next"
import { PrecosWireframe } from "@/components/wireframe/precos-wireframe"

export const metadata: Metadata = { title: "Preços - Finance App" }

/** O fim da oferta de fundadores é lido ao gerar a página: refaz de hora em hora. */
export const revalidate = 3600

/** Pública: fora de `(app)`, então sem `AuthGuard` nem a casca do app. */
export default function PrecosPage() {
    return <PrecosWireframe />
}
