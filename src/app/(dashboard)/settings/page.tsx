"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/providers"
import { supabase, Profile } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Settings, User, Mail, Save, Palette } from "lucide-react"

export default function SettingsPage() {
    const { user } = useAuth()
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [success, setSuccess] = useState(false)

    const [fullName, setFullName] = useState("")

    useEffect(() => {
        if (user) {
            fetchProfile()
        }
    }, [user])

    const fetchProfile = async () => {
        setLoading(true)
        const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user!.id)
            .single()

        if (data) {
            setProfile(data)
            setFullName(data.full_name || "")
        }
        setLoading(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setSaving(true)
        setSuccess(false)

        const { error } = await supabase
            .from("profiles")
            .update({
                full_name: fullName,
                updated_at: new Date().toISOString(),
            })
            .eq("id", user.id)

        if (!error) {
            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)
        }

        setSaving(false)
    }

    if (loading) {
        return (
            <div className="space-y-6 max-w-2xl">
                {/* Header Skeleton */}
                <div className="space-y-2">
                    <Skeleton className="h-9 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>

                {/* Profile Card Skeleton */}
                <Card>
                    <CardHeader>
                        <Skeleton className="h-5 w-32 mb-2" />
                        <Skeleton className="h-4 w-48" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <Skeleton className="h-10 w-32" />
                    </CardContent>
                </Card>

                {/* Account Info Card Skeleton */}
                <Card>
                    <CardHeader>
                        <Skeleton className="h-5 w-48 mb-2" />
                        <Skeleton className="h-4 w-56" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between py-2 border-b">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-48" />
                        </div>
                        <div className="flex justify-between py-2 border-b">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-2xl">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Configurações</h1>
                <p className="text-muted-foreground">Gerencie suas preferências e conta</p>
            </div>

            {/* Profile Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Perfil
                    </CardTitle>
                    <CardDescription>
                        Informações do seu perfil
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={user?.email || ""}
                                disabled
                                className="bg-gray-50"
                            />
                            <p className="text-xs text-muted-foreground">
                                O email não pode ser alterado
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="fullName">Nome completo</Label>
                            <Input
                                id="fullName"
                                type="text"
                                value={fullName}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
                                placeholder="Seu nome"
                            />
                        </div>

                        {success && (
                            <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm">
                                Perfil atualizado com sucesso!
                            </div>
                        )}

                        <Button type="submit" disabled={saving}>
                            <Save className="mr-2 h-4 w-4" />
                            {saving ? "Salvando..." : "Salvar"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Account Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Informações da Conta
                    </CardTitle>
                    <CardDescription>
                        Dados da sua conta no Finance App
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">ID do usuário</span>
                        <span className="font-mono text-sm">{user?.id}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Criado em</span>
                        <span>{user?.created_at ? new Date(user.created_at).toLocaleDateString("pt-BR") : "-"}</span>
                    </div>
                </CardContent>
            </Card>

            {/* Preferências */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Palette className="h-5 w-5 text-muted-foreground" />
                        Preferências
                    </CardTitle>
                    <CardDescription>
                        Customize sua experiência
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Tema escuro</Label>
                            <p className="text-sm text-muted-foreground">Use tema escuro</p>
                        </div>
                        <Switch id="dark-mode" />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Notificações</Label>
                            <p className="text-sm text-muted-foreground">Receba alertas por email</p>
                        </div>
                        <Switch id="notifications" defaultChecked />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Relatórios mensais</Label>
                            <p className="text-sm text-muted-foreground">Resumo financeiro mensal</p>
                        </div>
                        <Switch id="reports" />
                    </div>
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200">
                <CardHeader>
                    <CardTitle className="text-red-600">Zona de Perigo</CardTitle>
                    <CardDescription>
                        Ações irreversíveis
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                        Para excluir sua conta e todos os dados associados, entre em contato com o suporte.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
