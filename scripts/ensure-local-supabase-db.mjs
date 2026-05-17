#!/usr/bin/env node
/**
 * Ensures local Supabase Postgres is accepting connections (default port 54322)
 * before running `supabase test db`.
 */
import { createConnection } from "node:net"

const host = process.env.SUPABASE_DB_HOST ?? "127.0.0.1"
const port = Number(process.env.SUPABASE_DB_PORT ?? "54322")

function portOpen(h, p) {
    return new Promise((resolve) => {
        const socket = createConnection({ host: h, port: p }, () => {
            socket.end()
            resolve(true)
        })
        socket.on("error", () => resolve(false))
        socket.setTimeout(4000, () => {
            socket.destroy()
            resolve(false)
        })
    })
}

const ok = await portOpen(host, port)
if (!ok) {
    console.error(
        `Cannot reach Postgres at ${host}:${port}. Start local Supabase: supabase start`
    )
    process.exit(1)
}
console.log(`OK: ${host}:${port} is reachable (local Supabase DB).`)
