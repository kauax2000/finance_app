import type { Metadata } from "next"
import { PrivacidadeWireframe } from "@/components/wireframe/privacidade-wireframe"

export const metadata: Metadata = { title: "Privacidade - Finance App" }

/** Pública: fora de `(app)`, então sem `AuthGuard` nem a casca do app. */
export default function PrivacidadePage() {
    return <PrivacidadeWireframe />
}
