"use client"

import { Construction, ArrowLeft, Home } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function PlansPage() {
    return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
            <Card className="w-full max-w-md border-none shadow-none bg-transparent">
                <CardContent className="flex flex-col items-center text-center space-y-6 pt-6">
                    {/* Ícone de construção animado */}
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <Construction className="w-12 h-12 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center animate-bounce">
                            <span className="text-white text-lg">🔨</span>
                        </div>
                    </div>

                    {/* Título e descrição */}
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold tracking-tight">
                            Em Construção
                        </h2>
                        <p className="text-muted-foreground max-w-xs mx-auto">
                            Estamos trabalhando para trazer planos exclusivos que vão potencializar sua gestão financeira.
                            Em breve você terá acesso a benefícios incríveis!
                        </p>
                    </div>

                    {/* Elementos decorativos */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="flex gap-1">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse delay-75" />
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse delay-150" />
                        </div>
                        <span>Aguarde um momento</span>
                    </div>

                    {/* Botão para voltar ao dashboard */}
                    <div className="pt-4">
                        <Button asChild variant="outline">
                            <Link href="/dashboard">
                                <Home className="w-4 h-4 mr-2" />
                                Voltar ao início
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
