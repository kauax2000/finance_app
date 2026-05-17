"use client"

import { useState, type ReactNode } from "react"
import { QueryClient } from "@tanstack/react-query"
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"
import { createFinanceQueryPersister } from "@/lib/queries/idb-persister"
import { PERSIST_BUSTER, shouldPersistQuery } from "@/lib/queries/persist"

const MAX_AGE_MS = 24 * 60 * 60 * 1000

function createQueryClient() {
    return new QueryClient({
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
