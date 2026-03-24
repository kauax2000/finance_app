"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/providers"
import { supabase, Wallet } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Wallet as WalletIcon, Pencil, Trash2 } from "lucide-react"

const walletTypes = [
    { value: "checking", label: "Conta Corrente" },
    { value: "savings", label: "Poupança" },
    { value: "digital", label: "Carteira Digital" },
    { value: "cash", label: "Dinheiro" },
    { value: "other", label: "Outro" },
]

const walletColors = [
    "#10B981", // green
    "#3B82F6", // blue
    "#F59E0B", // yellow
    "#EF4444", // red
    "#8B5CF6", // purple
    "#EC4899", // pink
    "#6366F6", // indigo
    "#14B8A6", // teal
]

export default function WalletsPage() {
    const { user } = useAuth()
    const [wallets, setWallets] = useState<Wallet[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingWallet, setEditingWallet] = useState<Wallet | null>(null)

    // Form state
    const [name, setName] = useState("")
    const [type, setType] = useState<string>("checking")
    const [balance, setBalance] = useState<string>("0")
    const [color, setColor] = useState(walletColors[0])
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (user) {
            fetchWallets()
        }
    }, [user])

    const fetchWallets = async () => {
        setLoading(true)
        const { data } = await supabase
            .from("wallets")
            .select("*")
            .eq("user_id", user!.id)
            .order("created_at", { ascending: false })

        if (data) setWallets(data)
        setLoading(false)
    }

    const resetForm = () => {
        setName("")
        setType("checking")
        setBalance("0")
        setColor(walletColors[0])
        setEditingWallet(null)
    }

    const openDialog = (wallet?: Wallet) => {
        if (wallet) {
            setEditingWallet(wallet)
            setName(wallet.name)
            setType(wallet.type)
            setBalance(wallet.balance.toString())
            setColor(wallet.color || walletColors[0])
        } else {
            resetForm()
        }
        setDialogOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setSaving(true)

        const walletData = {
            user_id: user.id,
            name,
            type,
            balance: parseFloat(balance),
            color,
        }

        if (editingWallet) {
            // Update existing wallet
            const { error } = await supabase
                .from("wallets")
                .update(walletData)
                .eq("id", editingWallet.id)

            if (error) {
                console.error("Error updating wallet:", error)
            }
        } else {
            // Create new wallet
            const { error } = await supabase
                .from("wallets")
                .insert(walletData)

            if (error) {
                console.error("Error creating wallet:", error)
            }
        }

        setSaving(false)
        setDialogOpen(false)
        resetForm()
        fetchWallets()
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir esta carteira?")) return

        const { error } = await supabase
            .from("wallets")
            .delete()
            .eq("id", id)

        if (!error) {
            fetchWallets()
        }
    }

    const getTotalBalance = () => {
        return wallets.reduce((sum, w) => sum + (w.balance || 0), 0)
    }

    if (loading) {
        return (
            <div className="space-y-6">
                {/* Header Skeleton */}
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-9 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-10 w-40" />
                </div>

                {/* Total Balance Card Skeleton */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-4 rounded-full" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-9 w-40 mb-2" />
                        <Skeleton className="h-3 w-24" />
                    </CardContent>
                </Card>

                {/* Wallets Grid Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <Card key={i}>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Skeleton className="h-3 w-3 rounded-full" />
                                        <Skeleton className="h-5 w-32" />
                                    </div>
                                    <div className="flex gap-1">
                                        <Skeleton className="h-8 w-8" />
                                        <Skeleton className="h-8 w-8" />
                                    </div>
                                </div>
                                <Skeleton className="h-3 w-24 mt-2" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-36" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Carteiras</h1>
                    <p className="text-muted-foreground">Gerencie suas contas e carteiras</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => openDialog()}>
                            <Plus className="mr-2 h-4 w-4" />
                            Nova Carteira
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form onSubmit={handleSubmit}>
                            <DialogHeader>
                                <DialogTitle>
                                    {editingWallet ? "Editar Carteira" : "Nova Carteira"}
                                </DialogTitle>
                                <DialogDescription>
                                    {editingWallet
                                        ? "Atualize os dados da carteira"
                                        : "Adicione uma nova conta ou carteira"}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                                        placeholder="Ex: Conta Corrente"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="type">Tipo</Label>
                                    <select
                                        id="type"
                                        value={type}
                                        onChange={(e) => setType(e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        required
                                    >
                                        {walletTypes.map((t) => (
                                            <option key={t.value} value={t.value}>
                                                {t.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="balance">Saldo Inicial</Label>
                                    <Input
                                        id="balance"
                                        type="number"
                                        step="0.01"
                                        value={balance}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBalance(e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Cor</Label>
                                    <div className="flex gap-2 flex-wrap">
                                        {walletColors.map((c) => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => setColor(c)}
                                                className={`w-8 h-8 rounded-full border-2 ${color === c ? "border-gray-900" : "border-transparent"
                                                    }`}
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={saving}>
                                    {saving ? "Salvando..." : "Salvar"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Total Balance */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
                    <WalletIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">
                        R$ {getTotalBalance().toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {wallets.length} carteira{wallets.length !== 1 ? "s" : ""}
                    </p>
                </CardContent>
            </Card>

            {/* Wallets Grid */}
            {wallets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {wallets.map((wallet) => (
                        <Card key={wallet.id} className="relative">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: wallet.color || "#10B981" }}
                                        />
                                        <CardTitle className="text-lg">{wallet.name}</CardTitle>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openDialog(wallet)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:text-red-600"
                                            onClick={() => handleDelete(wallet.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <CardDescription>
                                    {walletTypes.find((t) => t.value === wallet.type)?.label}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    R$ {Number(wallet.balance || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <WalletIcon className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4">Nenhuma carteira encontrada</p>
                        <Button onClick={() => openDialog()}>
                            <Plus className="mr-2 h-4 w-4" />
                            Criar Primeira Carteira
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
