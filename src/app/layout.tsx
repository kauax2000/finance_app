import type { Metadata } from "next"
import { Geist_Mono, Inter, Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"
import { QueryProvider } from "@/components/query-provider"
import { AuthProvider } from "@/components/providers"
import { WorkspaceProvider } from "@/components/workspace-provider"
import { PushNotificationProvider } from "@/components/push/push-notification-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SwRegister } from "@/app/sw-register"

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
})

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
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
        icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
        apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
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
      className={`${inter.variable} ${plusJakartaSans.variable} ${geistMono.variable} h-full antialiased`}
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
