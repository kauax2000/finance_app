/**
 * Route paths and helpers — single import surface for typed navigation.
 * Canonical definitions live in `@/config/navigation`.
 */
export { ROUTES, isExactPath } from "@/config/navigation"

type RoutesConst = typeof import("@/config/navigation").ROUTES

export type RoutePath = RoutesConst[keyof RoutesConst]
