"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/providers"
import { supabase, Transaction, Wallet, Category } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, TrendingUp, TrendingDown, Pencil, Trash2, ArrowLeftRight } from "lucide-react"
import Link from "next/link"

export default function TransactionsPage() {
    const { user } = useAuth()
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [wallets, setWallets] = useState<Wallet[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
    const [filterType, setFilterType] = useState<string>("all")
    const [filterWallet, setFilterWallet] = useState<string>("all")

    // Form state
    const [type, setType] = useState<"income" | "expense">("expense")
    const [amount, setAmount] = useState<string>("")
    const [description, setDescription] = useState<string>("")
    const [walletId, setWalletId] = useState<string>("")
    const [categoryId, setCategoryId] = useState<string>("")
    const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0])
    const [isRecurring, setIsRecurring] = useState<boolean>(false)
    const [recurringInterval, setRecurringInterval] = useState<string>("")
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (user) {
            fetchData()
        }
    }, [user])

    const fetchData = async () => {
        setLoading(true)

        const [walletsRes, categoriesRes, transactionsRes] = await Promise.all([
            supabase.from("wallets").select("*").eq("user_id", user!.id),
            supabase.from("categories").select("*").eq("user_id", user!.id),
            supabase
                .from("transactions")
                .select("*, wallet:wallets(*), category:categories(*)")
                .eq("user_id", user!.id)
                .order("date", { ascending: false })
        ])

        if (walletsRes.data) setWallets(walletsRes.data)
        if (categoriesRes.data) setCategories(categoriesRes.data)
        if (transactionsRes.data) setTransactions(transactionsRes.data)

        setLoading(false)
    }

    const resetForm = () => {
        setType("expense")
        setAmount("")
        setDescription("")
        setWalletId("")
        setCategoryId("")
        setDate(new Date().toISOString().split("T")[0])
        setIsRecurring(false)
        setRecurringInterval("")
        setEditingTransaction(null)
    }

    const openDialog = (transaction?: Transaction) => {
        if (transaction) {
            setEditingTransaction(transaction)
            setType(transaction.type)
            setAmount(transaction.amount.toString())
            setDescription(transaction.description || "")
            setWalletId(transaction.wallet_id)
            setCategoryId(transaction.category_id || "")
            setDate(new Date(transaction.date).toISOString().split("T")[0])
            setIsRecurring(transaction.is_recurring)
            setRecurringInterval(transaction.recurring_interval || "")
        } else {
            resetForm()
        }
        setDialogOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setSaving(true)

        const transactionData = {
            user_id: user.id,
            wallet_id: walletId,
            category_id: categoryId || null,
            type,
            amount: parseFloat(amount),
            description: description || null,
            date: new Date(date).toISOString(),
            is_recurring: isRecurring,
            recurring_interval: isRecurring ? recurringInterval : null,
        }

        // Update wallet balance
        const wallet = wallets.find(w => w.id === walletId)
        if (wallet) {
            const balanceChange = type === "income" ? parseFloat(amount) : -parseFloat(amount)
            await supabase
                .from("wallets")
                .update({ balance: (wallet.balance || 0) + balanceChange })
                .eq("id", walletId)
        }

        if (editingTransaction) {
            // Get old transaction to reverse balance change
            const oldWallet = wallets.find(w => w.id === editingTransaction.wallet_id)
            const oldChange = editingTransaction.type === "income"
                ? -Number(editingTransaction.amount)
                : Number(editingTransaction.amount)

            if (oldWallet) {
                await supabase
                    .from("wallets")
                    .update({ balance: (oldWallet.balance || 0) + oldChange })
                    .eq("id", editingTransaction.wallet_id)
            }

            await supabase
                .from("transactions")
                .update(transactionData)
                .eq("id", editingTransaction.id)
        } else {
            await supabase
                .from("transactions")
                .insert(transactionData)
        }

        setSaving(false)
        setDialogOpen(false)
        resetForm()
        fetchData()
    }

    const handleDelete = async (id: string, walletId: string, transactionAmount: number, transactionType: string) => {
        if (!confirm("Tem certeza que deseja excluir esta transação?")) return

        // Reverse wallet balance
        const wallet = wallets.find(w => w.id === walletId)
        if (wallet) {
            const balanceChange = transactionType === "income"
                ? -transactionAmount
                : transactionAmount
            await supabase
                .from("wallets")
                .update({ balance: (wallet.balance || 0) + balanceChange })
                .eq("id", walletId)
        }

        await supabase
            .from("transactions")
            .delete()
            .eq("id", id)

        fetchData()
    }

    const filteredTransactions = transactions.filter(t => {
        if (filterType !== "all" && t.type !== filterType) return false
        if (filterWallet !== "all" && t.wallet_id !== filterWallet) return false
        return true
    })

    const filteredCategories = categories.filter(c => c.type === type)

    if (loading) {
        return (
            <div className="space-y-6">
                {/* Header Skeleton */}
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-9 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-10 w-44" />
                </div>

                {/* Filters Skeleton */}
                <div className="flex gap-4">
                    <Skeleton className="h-10 w-[150px]" />
                    <Skeleton className="h-10 w-[200px]" />
                </div>

                {/* Transactions List Skeleton */}
                <Card>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-48" />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="h-5 w-20" />
                                        <Skeleton className="h-8 w-8" />
                                        <Skeleton className="h-8 w-8" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Transações</h1>
                    <p className="text-muted-foreground">Gerencie suas receitas e despesas</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => openDialog()} disabled={wallets.length === 0}>
                            <Plus className="mr-2 h-4 w-4" />
                            Nova Transação
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form onSubmit={handleSubmit}>
                            <DialogHeader>
                                <DialogTitle>
                                    {editingTransaction ? "Editar Transação" : "Nova Transação"}
                                </DialogTitle>
                                <DialogDescription>
                                    {editingTransaction
                                        ? "Atualize os dados da transação"
                                        : "Adicione uma nova receita ou despesa"}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                {/* Type Selector */}
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant={type === "income" ? "default" : "outline"}
                                        className={`flex-1 ${type === "income" ? "bg-green-600 hover:bg-green-700" : ""}`}
                                        onClick={() => setType("income")}
                                    >
                                        <TrendingUp className="mr-2 h-4 w-4" />
                                        Receita
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={type === "expense" ? "default" : "outline"}
                                        className={`flex-1 ${type === "expense" ? "bg-red-600 hover:bg-red-700" : ""}`}
                                        onClick={() => setType("expense")}
                                    >
                                        <TrendingDown className="mr-2 h-4 w-4" />
                                        Despesa
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="amount">Valor</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        step="0.01"
                                        value={amount}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Descrição</Label>
                                    <Input
                                        id="description"
                                        value={description}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
                                        placeholder="Ex: Supermercado"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="wallet">Carteira</Label>
                                    <Select value={walletId} onValueChange={setWalletId} required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione uma carteira" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {wallets.map((w) => (
                                                <SelectItem key={w.id} value={w.id}>
                                                    {w.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="category">Categoria</Label>
                                    <Select value={categoryId} onValueChange={setCategoryId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione uma categoria" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filteredCategories.map((c) => (
                                                <SelectItem key={c.id} value={c.id}>
                                                    {c.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="date">Data</Label>
                                    <Input
                                        id="date"
                                        type="date"
                                        value={date}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="recurring"
                                        checked={isRecurring}
                                        onChange={(e) => setIsRecurring(e.target.checked)}
                                        className="w-4 h-4"
                                    />
                                    <Label htmlFor="recurring" className="cursor-pointer">
                                        Transação recorrente
                                    </Label>
                                </div>

                                {isRecurring && (
                                    <div className="space-y-2">
                                        <Label htmlFor="interval">Intervalo</Label>
                                        <Select value={recurringInterval} onValueChange={setRecurringInterval}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione o intervalo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="daily">Diário</SelectItem>
                                                <SelectItem value="weekly">Semanal</SelectItem>
                                                <SelectItem value="monthly">Mensal</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={saving || wallets.length === 0}>
                                    {saving ? "Salvando..." : "Salvar"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="income">Receitas</SelectItem>
                        <SelectItem value="expense">Despesas</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={filterWallet} onValueChange={setFilterWallet}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Carteira" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {wallets.map((w) => (
                            <SelectItem key={w.id} value={w.id}>
                                {w.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Transactions List */}
            {filteredTransactions.length > 0 ? (
                <Card>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {filteredTransactions.map((transaction) => (
                                <div
                                    key={transaction.id}
                                    className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-full ${transaction.type === "income" ? "bg-green-100" : "bg-red-100"}`}>
                                            {transaction.type === "income" ? (
                                                <TrendingUp className="h-5 w-5 text-green-600" />
                                            ) : (
                                                <TrendingDown className="h-5 w-5 text-red-600" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium">
                                                {transaction.description || transaction.category?.name || "Sem descrição"}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {transaction.wallet?.name} • {new Date(transaction.date).toLocaleDateString("pt-BR")}
                                                {transaction.is_recurring && " • Recorrente"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className={`text-lg font-bold ${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}>
                                            {transaction.type === "income" ? "+" : "-"}R$ {Number(transaction.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openDialog(transaction)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-600"
                                                onClick={() => handleDelete(transaction.id, transaction.wallet_id, Number(transaction.amount), transaction.type)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <ArrowLeftRight className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4">Nenhuma transação encontrada</p>
                        <Button onClick={() => openDialog()} disabled={wallets.length === 0}>
                            <Plus className="mr-2 h-4 w-4" />
                            Criar Primeira Transação
                        </Button>
                    </CardContent>
                </Card>
            )}

            {wallets.length === 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                        <p className="text-muted-foreground mb-4">Você precisa criar uma carteira primeiro</p>
                        <Link href="/dashboard/wallets">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Criar Carteira
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
