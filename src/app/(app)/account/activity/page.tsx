"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Activity,
    LogIn,
    LogOut,
    Settings,
    User,
    Key,
    Shield,
    Trash2,
    Globe,
    Clock,
    CheckCircle2,
    AlertTriangle,
    Info
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface ActivityLog {
    id: string
    type: "login" | "logout" | "password_change" | "profile_update" | "security_settings" | "delete_account" | "device_added" | "device_removed"
    description: string
    ip_address: string
    location: string
    device: string
    created_at: string
    status: "success" | "failed" | "pending"
}

const getActivityIcon = (type: string) => {
    switch (type) {
        case "login":
            return LogIn
        case "logout":
            return LogOut
        case "password_change":
            return Key
        case "profile_update":
            return User
        case "security_settings":
            return Shield
        case "delete_account":
            return Trash2
        case "device_added":
            return CheckCircle2
        case "device_removed":
            return AlertTriangle
        default:
            return Activity
    }
}

const getActivityLabel = (type: string) => {
    switch (type) {
        case "login":
            return "Login"
        case "logout":
            return "Logout"
        case "password_change":
            return "Senha alterada"
        case "profile_update":
            return "Perfil atualizado"
        case "security_settings":
            return "Configurações de segurança"
        case "delete_account":
            return "Conta excluída"
        case "device_added":
            return "Dispositivo adicionado"
        case "device_removed":
            return "Dispositivo removido"
        default:
            return "Atividade"
    }
}

const getActivityColor = (type: string, status: string) => {
    if (status === "failed") return "text-red-500 bg-red-500/10"
    if (status === "pending") return "text-amber-500 bg-amber-500/10"

    switch (type) {
        case "login":
            return "text-green-500 bg-green-500/10"
        case "logout":
            return "text-muted-foreground bg-muted"
        case "password_change":
        case "security_settings":
        case "delete_account":
            return "text-amber-500 bg-amber-500/10"
        case "profile_update":
            return "text-blue-500 bg-blue-500/10"
        case "device_added":
            return "text-green-500 bg-green-500/10"
        case "device_removed":
            return "text-red-500 bg-red-500/10"
        default:
            return "text-muted-foreground bg-muted"
    }
}

const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "Agora mesmo"
    if (minutes < 60) return `Há ${minutes} minuto${minutes !== 1 ? 's' : ''}`
    if (hours < 24) return `Há ${hours} hora${hours !== 1 ? 's' : ''}`
    if (days < 7) return `Há ${days} dia${days !== 1 ? 's' : ''}`

    return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
    })
}

export default function ActivityPage() {
    const [loading, setLoading] = useState(true)
    const [activities, setActivities] = useState<ActivityLog[]>([])
    const [filter, setFilter] = useState<string>("all")

    useEffect(() => {
        fetchActivities()
    }, [])

    const fetchActivities = async () => {
        setLoading(true)
        // Simulated activity log for demo
        const mockActivities: ActivityLog[] = [
            {
                id: "1",
                type: "login",
                description: "Entrada na conta",
                ip_address: "192.168.1.100",
                location: "São Paulo, Brasil",
                device: "Mac - Chrome",
                created_at: new Date().toISOString(),
                status: "success",
            },
            {
                id: "2",
                type: "profile_update",
                description: "Foto de perfil atualizada",
                ip_address: "192.168.1.100",
                location: "São Paulo, Brasil",
                device: "Mac - Chrome",
                created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
                status: "success",
            },
            {
                id: "3",
                type: "device_added",
                description: "Novo dispositivo confiável adicionado",
                ip_address: "192.168.1.101",
                location: "São Paulo, Brasil",
                device: "iPhone 15 Pro - Safari",
                created_at: new Date(Date.now() - 86400000).toISOString(),
                status: "success",
            },
            {
                id: "4",
                type: "password_change",
                description: "Senha alterada com sucesso",
                ip_address: "192.168.1.100",
                location: "São Paulo, Brasil",
                device: "Mac - Chrome",
                created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
                status: "success",
            },
            {
                id: "5",
                type: "login",
                description: "Tentativa de login",
                ip_address: "45.33.32.156",
                location: "São Paulo, Brasil",
                device: "Desconhecido",
                created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
                status: "failed",
            },
            {
                id: "6",
                type: "logout",
                description: "Saída da conta",
                ip_address: "192.168.1.100",
                location: "São Paulo, Brasil",
                device: "Mac - Chrome",
                created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
                status: "success",
            },
        ]
        setActivities(mockActivities)
        setLoading(false)
    }

    const filteredActivities = filter === "all"
        ? activities
        : activities.filter(a => a.type === filter)

    const activityCounts = {
        all: activities.length,
        login: activities.filter(a => a.type === "login").length,
        security: activities.filter(a => ["password_change", "security_settings", "device_added", "device_removed"].includes(a.type)).length,
        profile: activities.filter(a => a.type === "profile_update").length,
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Atividade</h1>
                <p className="text-muted-foreground">Histórico de ações na sua conta</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 flex-wrap">
                <button
                    onClick={() => setFilter("all")}
                    className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                        filter === "all"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                >
                    Todas ({activityCounts.all})
                </button>
                <button
                    onClick={() => setFilter("login")}
                    className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                        filter === "login"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                >
                    Entradas ({activityCounts.login})
                </button>
                <button
                    onClick={() => setFilter("security")}
                    className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                        filter === "security"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                >
                    Segurança ({activityCounts.security})
                </button>
                <button
                    onClick={() => setFilter("profile")}
                    className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                        filter === "profile"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                >
                    Perfil ({activityCounts.profile})
                </button>
            </div>

            {/* Activity List */}
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Histórico de atividade</CardTitle>
                    <CardDescription>
                        {filteredActivities.length} registro{filteredActivities.length !== 1 ? 's' : ''}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center gap-4 p-4 rounded-lg border">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-64" />
                                        <Skeleton className="h-3 w-48" />
                                    </div>
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredActivities.map((activity) => {
                                const ActivityIcon = getActivityIcon(activity.type)
                                return (
                                    <div
                                        key={activity.id}
                                        className="flex items-start gap-4 p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                                    >
                                        {/* Icon */}
                                        <div className={cn(
                                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                                            getActivityColor(activity.type, activity.status)
                                        )}>
                                            <ActivityIcon className="h-5 w-5" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-medium">
                                                    {getActivityLabel(activity.type)}
                                                </p>
                                                {activity.status === "failed" && (
                                                    <Badge variant="destructive" className="text-xs">
                                                        Falha
                                                    </Badge>
                                                )}
                                                {activity.status === "pending" && (
                                                    <Badge className="bg-amber-500/10 text-amber-600 text-xs">
                                                        Pendente
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {activity.description}
                                            </p>
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2 flex-wrap">
                                                <span className="flex items-center gap-1">
                                                    <Globe className="h-3 w-3" />
                                                    {activity.ip_address}
                                                </span>
                                                <span>{activity.device}</span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {formatDate(activity.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}

                            {filteredActivities.length === 0 && (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Activity className="h-12 w-12 mx-auto mb-4" />
                                    <p className="text-lg font-medium">Nenhuma atividade encontrada</p>
                                    <p className="text-sm mt-1">
                                        {filter === "all"
                                            ? "Suas atividades aparecerão aqui"
                                            : "Tente selecionar outro filtro"}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-muted/50">
                <CardContent className="pt-6">
                    <div className="flex gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                            <Info className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <h3 className="font-medium">Sobre o histórico de atividades</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                O histórico de atividades mostra as ações realizadas na sua conta, incluindo
                                logins, alterações de senha e atualizações de perfil. Dados de atividades
                                são mantidos por 90 dias por motivos de segurança.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}