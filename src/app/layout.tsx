import type { Metadata } from "next"
import { Geist_Mono, Inter, Ledger } from "next/font/google"
import "./globals.css"
import { QueryProvider } from "@/components/query-provider"
import { AuthProvider } from "@/components/providers"
import { WorkspaceProvider } from "@/components/workspace-provider"
import { PushNotificationProvider } from "@/components/push/push-notification-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SwRegister } from "@/app/sw-register"
import { pwaIconSrc } from "@/lib/pwa/icon-url"

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
})

/**
 * A serifa de display.
 *
 * O caminho até ela, porque cada passo descartou uma família por um motivo
 * diferente:
 *
 * - **Plus Jakarta Sans** não trabalhava. Só renderizava entre 16 e 20px, e uma
 *   geométrica a 20px ao lado de Inter a 14 é uma diferença que ninguém enxerga.
 * - **Fraunces** era acolhedora, não elegante: contraste baixo, desenho largo.
 * - **Instrument Serif** errou para o outro lado — condensada demais, as
 *   palavras ficavam compridas.
 * - **Playfair Display** acertava a proporção, mas é vista em todo lugar.
 *
 * Ledger é peso único (400) e desenho robusto: serifas em cunha quase de slab,
 * juntas angulosas, caixa generosa. Ela é mais pesada do que a busca original
 * pedia — a decisão foi trocar leveza por solidez, que é o registro de um
 * produto que fala de dinheiro. O nome é coincidência feliz, não argumento.
 *
 * Ela é `--font-display`, e não `--font-heading`: uma serifa de display a 16px
 * perde hierarquia contra o corpo em Inter — vira texto menor, não título. Vive
 * em `.page-title` e `.wordmark`, e os títulos de cartão e de diálogo seguem na
 * sans. Guardar a face para onde ela tem tamanho é o que a mantém bonita.
 */
const ledger = Ledger({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
})

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
    title: "Finance App - Controle de Finanças",
    description: "Aplicativo para controle de finanças pessoais",
    applicationName: "Finance",
    appleWebApp: {
        capable: true,
        title: "Finance",
        statusBarStyle: "default",
    },
    formatDetection: {
        telephone: false,
    },
    icons: {
        icon: [
            {
                url: pwaIconSrc("icon-32.png"),
                sizes: "32x32",
                type: "image/png",
            },
            {
                url: pwaIconSrc("icon-192.png"),
                sizes: "192x192",
                type: "image/png",
            },
        ],
        apple: [
            {
                url: pwaIconSrc("apple-touch-icon.png"),
                sizes: "180x180",
                type: "image/png",
            },
        ],
    },
}

export const viewport = {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover" as const,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${ledger.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <SwRegister />
        <TooltipProvider>
          <QueryProvider>
            <AuthProvider>
              <WorkspaceProvider>
                <PushNotificationProvider>{children}</PushNotificationProvider>
              </WorkspaceProvider>
            </AuthProvider>
          </QueryProvider>
        </TooltipProvider>
      </body>
    </html>
  )
}
