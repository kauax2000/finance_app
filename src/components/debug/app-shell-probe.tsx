"use client"

import { usePathname } from "next/navigation"
import { useEffect, useLayoutEffect, useRef } from "react"
import { useAuth } from "@/components/providers"
import { useWorkspace } from "@/components/workspace-provider"

function sendDebug(payload: Record<string, unknown>) {
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

function snapshotDom(label: string, hypothesisId: string) {
    if (typeof document === "undefined") return
    const emptyStates = document.querySelectorAll('[data-slot="empty-state"]')
    const es0 = emptyStates[0] as HTMLElement | undefined
    const rect = es0?.getBoundingClientRect()
    sendDebug({
        location: `app-shell-probe.tsx:${label}`,
        message: `DOM snapshot (${label})`,
        hypothesisId,
        data: {
            pathname:
                typeof window !== "undefined" ? window.location.pathname : "",
            htmlClass: document.documentElement.className,
            bodyClass: document.body.className,
            bodyChildCount: document.body.children.length,
            emptyStateCount: emptyStates.length,
            emptyStateHeight: rect?.height ?? null,
            emptyStateWidth: rect?.width ?? null,
            showDetailsPresent: !!document.body.innerText?.includes(
                "Show Details",
            ),
            nextjsErrorDialPresent:
                !!document.querySelector('[data-nextjs-call-stack-root]') ||
                !!document.querySelector("[data-nextjs-dialog-overlay]"),
        },
    })
}

/**
 * Debug-only instrumentation for flaky full-app routes (404, error pages).
 */
export function AppShellProbe({ runId = "pre-fix" }: { runId?: string }) {
    const pathname = usePathname()
    const { loading: authLoading, user } = useAuth()
    const { loading: workspaceLoading, error: workspaceError } = useWorkspace()
    const prevAuth = useRef(authLoading)
    const prevWs = useRef(workspaceLoading)

    useLayoutEffect(() => {
        snapshotDom("mount-layout", "H2-H5")
    }, [pathname])

    useLayoutEffect(() => {
        const id = requestAnimationFrame(() => {
            snapshotDom("rAF1", "H2-H5")
            requestAnimationFrame(() => snapshotDom("rAF2", "H2-H5"))
        })
        return () => cancelAnimationFrame(id)
    }, [pathname, authLoading, workspaceLoading])

    useEffect(() => {
        if (prevAuth.current !== authLoading) {
            // #region agent log
            sendDebug({
                location: "app-shell-probe.tsx:auth-transition",
                message: "Auth loading transitioned",
                hypothesisId: "H2",
                runId,
                data: {
                    pathname,
                    from: prevAuth.current,
                    to: authLoading,
                    hasUser: Boolean(user?.id),
                },
            })
            // #endregion
            prevAuth.current = authLoading
        }
        if (prevWs.current !== workspaceLoading) {
            // #region agent log
            sendDebug({
                location: "app-shell-probe.tsx:workspace-transition",
                message: "Workspace loading transitioned",
                hypothesisId: "H2",
                runId,
                data: {
                    pathname,
                    from: prevWs.current,
                    to: workspaceLoading,
                    workspaceError: workspaceError ?? null,
                },
            })
            // #endregion
            prevWs.current = workspaceLoading
        }
    }, [
        pathname,
        authLoading,
        workspaceLoading,
        user?.id,
        workspaceError,
        runId,
    ])

    useEffect(() => {
        const err = (e: ErrorEvent) => {
            // #region agent log
            sendDebug({
                location: "app-shell-probe.tsx:window-error",
                message: e.message || "window.error",
                hypothesisId: "H1-H4",
                runId,
                data: {
                    pathname,
                    filename: e.filename,
                    lineno: e.lineno,
                    colno: e.colno,
                    errorName: e.error?.name,
                },
            })
            // #endregion
        }
        const rej = (e: PromiseRejectionEvent) => {
            const reason =
                e.reason instanceof Error
                    ? e.reason.message
                    : String(e.reason)
            // #region agent log
            sendDebug({
                location: "app-shell-probe.tsx:unhandledrejection",
                message: reason,
                hypothesisId: "H1",
                runId,
                data: { pathname },
            })
            // #endregion
        }
        window.addEventListener("error", err)
        window.addEventListener("unhandledrejection", rej)
        return () => {
            window.removeEventListener("error", err)
            window.removeEventListener("unhandledrejection", rej)
        }
    }, [pathname, runId])

    return null
}
