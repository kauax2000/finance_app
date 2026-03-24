"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/providers"
import { supabase } from "@/lib/supabase"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { LogOut, Monitor, Smartphone, Globe, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Session {
    id: string
    user_agent: string
    created_at: string
    last_active_at: string
    ip_address: string
    is_current: boolean
}

interface SessionsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function SessionsDialog({ open, onOpenChange }: SessionsDialogProps) {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [sessions, setSessions] = useState<Session[]>([])
    const [revoking, setRevoking] = useState<string | null>(null)

    useEffect(() => {
        if (open) {
            fetchSessions()
        }
    }, [open])

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
            },
        ]
        setSessions(mockSessions)
        setLoading(false)
    }

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

    const getDeviceIcon = (userAgent: string) => {
        if (userAgent.includes("Mobile") || userAgent.includes("Android") || userAgent.includes("iPhone")) {
            return Smartphone
        }
        return Monitor
    }

    const getDeviceName = (userAgent: string) => {
        if (userAgent.includes("Macintosh")) return "Mac"
        if (userAgent.includes("Windows")) return "Windows"
        if (userAgent.includes("Android")) return "Android"
        if (userAgent.includes("iPhone") || userAgent.includes("iPad")) return "iOS"
        return "Computador"
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <LogOut className="h-5 w-5" />
                        Sessões Ativas
                    </DialogTitle>
                    <DialogDescription>
                        Gerencie suas sessões ativas em diferentes dispositivos
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-3 max-h-80 overflow-y-auto">
                    {loading ? (
                        <>
                            {[1, 2].map((i) => (
                                <div key={i} className="flex items-center gap-4 p-4 rounded-lg border">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-48" />
                                        <Skeleton className="h-3 w-32" />
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : (
                        <>
                            {sessions.map((session) => {
                                const DeviceIcon = getDeviceIcon(session.user_agent)
                                return (
                                    <div
                                        key={session.id}
                                        className={cn(
                                            "flex items-center gap-4 p-4 rounded-lg border",
                                            session.is_current && "bg-primary/5 border-primary/30"
                                        )}
                                    >
                                        <div className="p-2 rounded-full bg-muted">
                                            <DeviceIcon className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium truncate">
                                                    {getDeviceName(session.user_agent)}
                                                </p>
                                                {session.is_current && (
                                                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                                        Atual
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Globe className="h-3 w-3" />
                                                    {session.ip_address}
                                                </span>
                                                <span>
                                                    Ativo agora
                                                </span>
                                            </div>
                                        </div>
                                        {!session.is_current && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => handleRevokeSession(session.id)}
                                                disabled={revoking === session.id}
                                            >
                                                {revoking === session.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    "Revogar"
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                )
                            })}

                            {sessions.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                                    <p>Todas as sessões foram encerradas</p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <DialogFooter className="flex-row justify-between">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Fechar
                    </Button>
                    {sessions.filter((s) => !s.is_current).length > 0 && (
                        <Button
                            variant="destructive"
                            onClick={handleRevokeAll}
                            disabled={revoking === "all" || sessions.filter((s) => !s.is_current).length === 0}
                        >
                            {revoking === "all" ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                "Encerrar todas"
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
