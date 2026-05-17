#!/usr/bin/env node
/**
 * Static verification for Assinaturas (workspace subscriptions) prerequisites.
 * Does not connect to Supabase — validates migration sources are present (plan § Prerequisites).
 */

import { readFileSync, existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")
const migrationsDir = join(root, "supabase", "migrations")

const required = [
    {
        file: "20260403150000_workspace_subscriptions.sql",
        mustInclude: [
            "workspace_subscriptions",
            "is_workspace_member",
            "billing_interval",
        ],
    },
    {
        file: "20260404100000_transactions_subscription_billing.sql",
        mustInclude: [
            "run_subscription_billing",
            "subscription_id",
            "transactions_subscription_id_fkey",
            "transactions_subscription_expense_only",
        ],
    },
    {
        file: "20260404121000_transactions_subscription_installment_exclusive.sql",
        mustInclude: [
            "transactions_subscription_installment_exclusive",
            "subscription_id",
            "installment_plan_id",
        ],
    },
    {
        file: "20260403120000_transactions_wallet_optional.sql",
        mustInclude: ["wallet_id", "drop not null"],
    },
    {
        file: "20260427160000_workspace_subscriptions_seed_first_transaction.sql",
        mustInclude: [
            "seed_workspace_subscription_first_transaction",
            "seed_subscription_first_transaction",
        ],
    },
    {
        file: "20260429120000_backfill_subscription_first_transaction.sql",
        mustInclude: [
            "insert into public.transactions",
            "coalesce(ws.next_billing_date, ws.start_date)",
        ],
    },
]

let failed = false

for (const { file, mustInclude } of required) {
    const path = join(migrationsDir, file)
    if (!existsSync(path)) {
        console.error(`Missing migration: ${file}`)
        failed = true
        continue
    }
    const text = readFileSync(path, "utf8")
    for (const needle of mustInclude) {
        if (!text.includes(needle)) {
            console.error(`${file}: expected substring not found: ${needle}`)
            failed = true
        }
    }
}

if (failed) {
    console.error("\nverify-assinaturas-prereqs: FAILED")
    process.exit(1)
}

console.log(
    "verify-assinaturas-prereqs: OK (migration files and key DDL markers present)"
)
console.log(
    "Reminder: apply migrations to your Supabase project and reload PostgREST schema when needed."
)
