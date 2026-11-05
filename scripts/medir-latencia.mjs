// Uso: node scripts/medir-latencia.mjs <url-do-projeto> [vezes=20]
// A chave vem de SUPABASE_ANON_KEY (ou NEXT_PUBLIC_SUPABASE_ANON_KEY).
import { resumo } from "./lib/latencia.mjs"

const [url, vezesArg] = process.argv.slice(2)
const chave = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url) {
  console.error("Uso: node scripts/medir-latencia.mjs <url-do-projeto> [vezes=20]")
  process.exit(1)
}
if (!chave) {
  console.error("Defina SUPABASE_ANON_KEY (ou NEXT_PUBLIC_SUPABASE_ANON_KEY).")
  process.exit(1)
}

const vezes = Number(vezesArg ?? 20)
const alvo = `${url.replace(/\/$/, "")}/rest/v1/profiles?select=id&limit=1`

async function pedido() {
  const t0 = performance.now()
  try {
    const r = await fetch(alvo, { headers: { apikey: chave, Authorization: `Bearer ${chave}` } })
    await r.arrayBuffer()
    return r.ok ? performance.now() - t0 : null
  } catch {
    return null
  }
}

await pedido() // aquecimento (TLS e conexão), descartado
const amostras = []
for (let i = 0; i < vezes; i++) amostras.push(await pedido())

const r = resumo(amostras)
console.log(
  `${new URL(url).host} n=${r.n} falhas=${r.falhas} mediana=${r.mediana} p95=${r.p95} min=${r.min} max=${r.max}`,
)
