"use client"

import { useState, type ReactNode } from "react"
import { QueryCache, QueryClient } from "@tanstack/react-query"
import { toastError } from "@/lib/toast"
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"
import { createFinanceQueryPersister } from "@/lib/queries/idb-persister"
import { PERSIST_BUSTER, shouldPersistQuery } from "@/lib/queries/persist"

const MAX_AGE_MS = 24 * 60 * 60 * 1000

function createQueryClient() {
    return new QueryClient({
        // Uma consulta que falha avisa. Antes os bundles trocavam erro por lista
        // vazia e a tela mostrava zero calada; agora eles lançam, e é daqui que a
        // pessoa fica sabendo. Offline fica quieto (o dado vem do cache), e quem já
        // mostra o erro na própria tela marca `meta: { errorToast: false }`.
        queryCache: new QueryCache({
            onError: (error, query) => {
                if (query.meta?.errorToast === false) return
                if (typeof navigator !== "undefined" && !navigator.onLine) return
                const message =
                    error instanceof Error && error.message
                        ? error.message
                        : "Não foi possível carregar os dados."
                toastError(message, { id: `query-error:${message}` })
            },
        }),
        defaultOptions: {
            queries: {
                staleTime: 60_000,
                gcTime: MAX_AGE_MS,
                refetchOnWindowFocus: false,
                refetchOnReconnect: "always",
                retry: 1,
            },
        },
    })
}

export function QueryProvider({ children }: { children: ReactNode }) {
    const [queryClient] = useState(createQueryClient)
    const [persister] = useState(createFinanceQueryPersister)

    return (
        <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{
                persister,
                maxAge: MAX_AGE_MS,
                buster: PERSIST_BUSTER,
                dehydrateOptions: {
                    shouldDehydrateQuery: shouldPersistQuery,
                },
            }}
        >
            {children}
        </PersistQueryClientProvider>
    )
}
