"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LogOut, Monitor, Smartphone, Globe, CheckCircle2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { SessionsSkeleton } from "@/components/skeletons"

interface Session {
    id: string
    user_agent: string
    created_at: string
    last_active_at: string
    ip_address: string
    is_current: boolean
    device_type: string
    device_name: string
}

export default function SessionsPage() {
    const [loading, setLoading] = useState(true)
    const [sessions, setSessions] = useState<Session[]>([])
    const [revoking, setRevoking] = useState<string | null>(null)

    const fetchSessions = async () => {
        setLoading(true)
        // Simulated sessions for demo
        const mockSessions: Session[] = [
            {
                id: "1",
                user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0",
                created_at: new Date().toISOString(),
                last_active_at: new Date().toISOString(),
                ip_address: "192.168.1.100",
                is_current: true,
                device_type: "desktop",
                device_name: "Mac",
            },
            {
                id: "2",
                user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
                created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
                last_active_at: new Date(Date.now() - 3600000).toISOString(),
                ip_address: "192.168.1.101",
                is_current: false,
                device_type: "mobile",
                device_name: "iPhone",
            },
            {
                id: "3",
                user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
                last_active_at: new Date(Date.now() - 86400000 * 2).toISOString(),
                ip_address: "192.168.1.102",
                is_current: false,
                device_type: "desktop",
                device_name: "Windows",
            },
        ]
        setSessions(mockSessions)
        setLoading(false)
    }

    useEffect(() => {
        fetchSessions()
    }, [])

    const handleRevokeSession = async (sessionId: string) => {
        setRevoking(sessionId)
        // In production, call supabase to revoke session
        await new Promise((resolve) => setTimeout(resolve, 1000))
        setSessions((prev) => prev.filter((s) => s.id !== sessionId))
        setRevoking(null)
    }

    const handleRevokeAll = async () => {
        setRevoking("all")
        // In production, call supabase to revoke all sessions except current
        await new Promise((resolve) => setTimeout(resolve, 1500))
        setSessions((prev) => prev.filter((s) => s.is_current))
        setRevoking(null)
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diff = now.getTime() - date.getTime()

        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(diff / 3600000)
        const days = Math.floor(diff / 86400000)

        if (minutes < 60) return `Há ${minutes} minuto${minutes !== 1 ? 's' : ''}`
        if (hours < 24) return `Há ${hours} hora${hours !== 1 ? 's' : ''}`
        if (days < 7) return `Há ${days} dia${days !== 1 ? 's' : ''}`

        return date.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        })
    }

    const DeviceIcon = ({ deviceType }: { deviceType: string }) => {
        if (deviceType === "mobile") {
            return <Smartphone className="h-5 w-5" />
        }
        return <Monitor className="h-5 w-5" />
    }

    // Show skeleton while loading
    if (loading) {
        return <SessionsSkeleton />
    }

    return (
        <div className="space-y-8 max-w-xl mx-auto">
            {/* Sessions List */}
            <Card>
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Suas sessões</CardTitle>
                            <CardDescription>
                                {sessions.filter(s => s.is_current).length} sessão ativa no momento
                            </CardDescription>
                        </div>
                        {sessions.filter((s) => !s.is_current).length > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRevokeAll}
                                disabled={revoking === "all"}
                                className="text-destructive hover:text-destructive"
                            >
                                {revoking === "all" ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <LogOut className="h-4 w-4 mr-2" />
                                )}
                                Encerrar todas
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {sessions.map((session) => (
                            <div
                                key={session.id}
                                className={cn(
                                    "flex items-center gap-4 p-4 rounded-lg border transition-colors",
                                    session.is_current
                                        ? "bg-primary/5 border-primary/30"
                                        : "bg-muted/30 hover:bg-muted/50"
                                )}
                            >
                                {/* Device Icon */}
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted">
                                    <DeviceIcon deviceType={session.device_type} />
                                </div>

                                {/* Session Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-medium">
                                            {session.device_name}
                                        </p>
                                        {session.is_current && (
                                            <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                                                Sessão atual
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                        <span className="flex items-center gap-1">
                                            <Globe className="h-3.5 w-3.5" />
                                            {session.ip_address}
                                        </span>
                                        <span>
                                            {formatDate(session.last_active_at)}
                                        </span>
                                    </div>
                                </div>

                                {/* Revoke Button */}
                                {!session.is_current && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                                        onClick={() => handleRevokeSession(session.id)}
                                        disabled={revoking === session.id}
                                    >
                                        {revoking === session.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <>
                                                <LogOut className="h-4 w-4 mr-2" />
                                                Encerrar
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        ))}

                        {sessions.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                                <p className="text-lg font-medium">Todas as sessões foram encerradas</p>
                                <p className="text-sm mt-1">Você só verá esta sessão ativa neste dispositivo</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-muted/50">
                <CardContent className="pt-6">
                    <div className="flex gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                            <Globe className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <h3 className="font-medium">Sobre sessões</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Quando você entra na sua conta, uma sessão é criada.
                                Você pode encerrar sessões em outros dispositivos a qualquer momento.
                                Se você não reconhecer um dispositivo,encerrar a sessão e alterar sua senha.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
