import type { Metadata } from "next"

import { NotFoundShell } from "../not-found-shell"

export const metadata: Metadata = {
    title: "Página não encontrada",
    robots: {
        index: false,
        follow: false,
    },
}

export default function CatchAllUnknownPage() {
    return <NotFoundShell />
}
