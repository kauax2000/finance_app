"use client"

import { useState, useEffect } from "react"
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
import { Activity, LogIn, LogOut, Shield, User, AlertTriangle, CheckCircle2, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

interface Activity {
    id: string
    type: "login" | "logout" | "password_change" | "profile_update" | "2fa_enabled" | "2fa_disabled" | "security_alert"
    description: string
    ip_address: string
    location: string
    created_at: string
}

interface ActivityLogDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ActivityLogDialog({ open, onOpenChange }: ActivityLogDialogProps) {
    const [loading, setLoading] = useState(true)
    const [activities, setActivities] = useState<Activity[]>([])

    useEffect(() => {
        if (open) {
            fetchActivities()
        }
    }, [open])

    const fetchActivities = async () => {
        setLoading(true)
        // Mock activities for demo
        const mockActivities: Activity[] = [
            {
                id: "1",
                type: "login",
                description: "Login realizado com sucesso",
                ip_address: "192.168.1.100",
                location: "São Paulo, Brasil",
                created_at: new Date().toISOString(),
            },
            {
                id: "2",
                type: "profile_update",
                description: "Perfil atualizado",
                ip_address: "192.168.1.100",
                location: "São Paulo, Brasil",
                created_at: new Date(Date.now() - 3600000).toISOString(),
            },
            {
                id: "3",
                type: "login",
                description: "Login realizado com sucesso",
                ip_address: "192.168.1.100",
                location: "São Paulo, Brasil",
                created_at: new Date(Date.now() - 86400000).toISOString(),
            },
        ]
        setActivities(mockActivities)
        setLoading(false)
    }

    const getActivityIcon = (type: Activity["type"]) => {
        switch (type) {
            case "login":
                return LogIn
            case "logout":
                return LogOut
            case "password_change":
                return Shield
            case "profile_update":
                return User
            case "2fa_enabled":
                return Shield
            case "2fa_disabled":
                return Shield
            case "security_alert":
                return AlertTriangle
            default:
                return Activity
        }
    }

    const getActivityColor = (type: Activity["type"]) => {
        switch (type) {
            case "login":
                return "text-green-500 bg-green-500/10"
            case "logout":
                return "text-muted-foreground bg-muted"
            case "password_change":
                return "text-blue-500 bg-blue-500/10"
            case "profile_update":
                return "text-purple-500 bg-purple-500/10"
            case "2fa_enabled":
                return "text-green-500 bg-green-500/10"
            case "2fa_disabled":
                return "text-amber-500 bg-amber-500/10"
            case "security_alert":
                return "text-red-500 bg-red-500/10"
            default:
                return "text-muted-foreground bg-muted"
        }
    }

    const formatDate = (date: string) => {
        const d = new Date(date)
        const now = new Date()
        const diff = now.getTime() - d.getTime()
        const hours = Math.floor(diff / 3600000)

        if (hours < 1) return "Agora"
        if (hours < 24) return `${hours}h atrás`
        return d.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Log de Atividades
                    </DialogTitle>
                    <DialogDescription>
                        Histórico de ações realizadas na sua conta
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-2 max-h-80 overflow-y-auto">
                    {loading ? (
                        <>
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border">
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-3 w-32" />
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : (
                        <>
                            {activities.map((activity) => {
                                const Icon = getActivityIcon(activity.type)
                                return (
                                    <div
                                        key={activity.id}
                                        className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                                    >
                                        <div className={cn("p-2 rounded-full", getActivityColor(activity.type))}>
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm">{activity.description}</p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span>{activity.ip_address}</span>
                                                <span>•</span>
                                                <span>{formatDate(activity.created_at)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}

                            {activities.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <FileText className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                                    <p>Nenhuma atividade registrada</p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Fechar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
