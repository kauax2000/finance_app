"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { useLayoutEffect, useRef } from "react"

function send(payload: Record<string, unknown>) {
    // #region agent log
    fetch(
        "http://127.0.0.1:7286/ingest/29a04545-24cd-4da2-80fd-e80fad6b60ae",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Debug-Session-Id": "656606",
            },
            body: JSON.stringify({
                sessionId: "656606",
                timestamp: Date.now(),
                ...payload,
            }),
        },
    ).catch(() => {})
    // #endregion
}

/** Wraps not-found subtree to observe mount persistence vs remounts. */
export function NotFoundProbe({
    children,
    runId = "pre-fix",
}: {
    children: React.ReactNode
    runId?: string
}) {
    const pathname = usePathname()
    const renderRef = useRef(0)
    renderRef.current += 1

    useLayoutEffect(() => {
        // #region agent log
        send({
            location: "not-found-probe.tsx:effect",
            message: "NotFoundProbe mounted",
            hypothesisId: "H4-H5",
            runId,
            data: {
                pathname,
                renderCount: renderRef.current,
                outerHtmlSnippet:
                    typeof document !== "undefined"
                        ? document.body.children[0]?.textContent?.slice(0, 80) ??
                          ""
                        : "",
            },
        })
        // #endregion
        return () => {
            // #region agent log
            send({
                location: "not-found-probe.tsx:cleanup",
                message: "NotFoundProbe unmounted",
                hypothesisId: "H4-H5",
                runId,
                data: { pathname },
            })
            // #endregion
        }
    }, [pathname, runId])

    return children
}
