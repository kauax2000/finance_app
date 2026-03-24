"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Bell, BellOff, Mail, Smartphone, Trash2, Check, X } from "lucide-react"
import { useState } from "react"

interface Notification {
    id: string
    title: string
    description: string
    type: "transaction" | "budget" | "system" | "promotion"
    read: boolean
    date: string
}

const initialNotifications: Notification[] = [
    {
        id: "1",
        title: "Nova transação registrada",
        description: "Você registrou uma nova despesa de R$ 150,00 em Alimentação",
        type: "transaction",
        read: false,
        date: "Hoje, 14:30",
    },
    {
        id: "2",
        title: "Alerta de orçamento",
        description: "Você atingiu 80% do orçamento de Alimentação este mês",
        type: "budget",
        read: false,
        date: "Hoje, 10:15",
    },
    {
        id: "3",
        title: "Bem-vindo ao Finance App",
        description: "Obrigado por se juntar a nós! Explore todos os recursos do app.",
        type: "system",
        read: true,
        date: "Ontem",
    },
]

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
    const [settings, setSettings] = useState({
        email: true,
        push: true,
        budget: true,
        transaction: true,
        promotions: false,
    })

    const unreadCount = notifications.filter((n) => !n.read).length

    const markAsRead = (id: string) => {
        setNotifications(
            notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
        )
    }

    const markAllAsRead = () => {
        setNotifications(notifications.map((n) => ({ ...n, read: true })))
    }

    const deleteNotification = (id: string) => {
        setNotifications(notifications.filter((n) => n.id !== id))
    }

    const clearAll = () => {
        setNotifications([])
    }

    const getIcon = (type: Notification["type"]) => {
        switch (type) {
            case "transaction":
                return <Bell className="h-5 w-5 text-blue-500" />
            case "budget":
                return <Bell className="h-5 w-5 text-amber-500" />
            case "system":
                return <Bell className="h-5 w-5 text-gray-500" />
            case "promotion":
                return <Bell className="h-5 w-5 text-purple-500" />
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Notificações</h2>
                    <p className="text-muted-foreground">
                        Gerencie suas notificações e preferências
                    </p>
                </div>
                {unreadCount > 0 && (
                    <Button variant="outline" onClick={markAllAsRead}>
                        <Check className="h-4 w-4 mr-2" />
                        Marcar todas como lidas
                    </Button>
                )}
            </div>

            {/* Lista de Notificações */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Histórico de Notificações
                        {unreadCount > 0 && (
                            <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                                {unreadCount} nova{unreadCount > 1 ? "s" : ""}
                            </span>
                        )}
                    </CardTitle>
                    <CardDescription>
                        Suas notificações mais recentes
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {notifications.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <BellOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Nenhuma notificação</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`flex items-start gap-4 p-4 rounded-lg border ${!notification.read ? "bg-muted/50" : ""
                                        }`}
                                >
                                    <div className="mt-1">{getIcon(notification.type)}</div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium">{notification.title}</p>
                                            {!notification.read && (
                                                <span className="h-2 w-2 rounded-full bg-primary" />
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {notification.description}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {notification.date}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!notification.read && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => markAsRead(notification.id)}
                                            >
                                                <Check className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => deleteNotification(notification.id)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {notifications.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                            <Button
                                variant="ghost"
                                className="text-red-500"
                                onClick={clearAll}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Limpar todas as notificações
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Configurações de Notificações */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Smartphone className="h-5 w-5" />
                        Preferências de Notificações
                    </CardTitle>
                    <CardDescription>
                        Escolha como deseja receber suas notificações
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Canais de notificação */}
                    <div>
                        <h4 className="font-medium mb-4">Canais de entrega</h4>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Notificações por email</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Receba notificações na sua caixa de email
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.email}
                                    onCheckedChange={(checked) =>
                                        setSettings({ ...settings, email: checked })
                                    }
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Notificações push</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Receba notificações no navegador
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.push}
                                    onCheckedChange={(checked) =>
                                        setSettings({ ...settings, push: checked })
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    {/* Tipos de notificação */}
                    <div>
                        <h4 className="font-medium mb-4">Tipos de notificação</h4>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Transações</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Notificações sobre novas transações
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.transaction}
                                    onCheckedChange={(checked) =>
                                        setSettings({ ...settings, transaction: checked })
                                    }
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Alertas de orçamento</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Quando atingir limites de orçamento
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.budget}
                                    onCheckedChange={(checked) =>
                                        setSettings({ ...settings, budget: checked })
                                    }
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Promoções e ofertas</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Ofertas especiais e novidades
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.promotions}
                                    onCheckedChange={(checked) =>
                                        setSettings({ ...settings, promotions: checked })
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
