/**
 * Generates PWA icons from public/logo.svg.
 * Run: node scripts/generate-pwa-icons.mjs
 */
import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import sharp from "sharp"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, "..")
const logoPath = path.join(root, "public", "logo.svg")
const iconsDir = path.join(root, "public", "icons")

const BRAND_BG = { r: 52, g: 140, b: 110, alpha: 1 } // primary green tint

async function renderIcon(size, { maskable = false } = {}) {
    const padding = maskable ? Math.round(size * 0.2) : Math.round(size * 0.12)
    const inner = size - padding * 2

    const logo = await sharp(logoPath)
        .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer()

    return sharp({
        create: {
            width: size,
            height: size,
            channels: 4,
            background: BRAND_BG,
        },
    })
        .composite([{ input: logo, gravity: "centre" }])
        .png()
        .toBuffer()
}

async function main() {
    await fs.mkdir(iconsDir, { recursive: true })

    const sizes = [
        { name: "icon-192.png", size: 192 },
        { name: "icon-512.png", size: 512 },
        { name: "icon-512-maskable.png", size: 512, maskable: true },
        { name: "apple-touch-icon.png", size: 180 },
    ]

    for (const { name, size, maskable } of sizes) {
        const buf = await renderIcon(size, { maskable })
        await fs.writeFile(path.join(iconsDir, name), buf)
        console.log(`Wrote public/icons/${name}`)
    }

    // Multi-size favicon
    const favicon16 = await renderIcon(16)
    const favicon32 = await renderIcon(32)
    await fs.writeFile(path.join(root, "src", "app", "icon.png"), await renderIcon(32))
    await fs.writeFile(
        path.join(root, "src", "app", "apple-icon.png"),
        await renderIcon(180)
    )

    // favicon.ico from 16+32
    await sharp(favicon32)
        .toFile(path.join(root, "src", "app", "favicon.ico"))
        .catch(async () => {
            await fs.writeFile(path.join(root, "src", "app", "favicon.ico"), favicon32)
        })

    console.log("Wrote src/app/icon.png, apple-icon.png, favicon.ico")
    void favicon16
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
