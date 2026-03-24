"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/providers"
import { supabase, Wallet, Transaction, Category } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts"
import { Plus, TrendingUp, TrendingDown, Wallet as WalletIcon } from "lucide-react"
import Link from "next/link"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]

export default function DashboardPage() {
    const { user } = useAuth()
    const [wallets, setWallets] = useState<Wallet[]>([])
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (user) {
            fetchData()
        }
    }, [user])

    const fetchData = async () => {
        setLoading(true)

        // Fetch wallets
        const { data: walletsData } = await supabase
            .from("wallets")
            .select("*")
            .eq("user_id", user!.id)
            .order("created_at", { ascending: false })

        // Fetch transactions
        const { data: transactionsData } = await supabase
            .from("transactions")
            .select("*, wallet:wallets(*), category:categories(*)")
            .eq("user_id", user!.id)
            .order("date", { ascending: false })
            .limit(10)

        // Fetch categories
        const { data: categoriesData } = await supabase
            .from("categories")
            .select("*")
            .eq("user_id", user!.id)

        if (walletsData) setWallets(walletsData)
        if (transactionsData) setTransactions(transactionsData)
        if (categoriesData) setCategories(categoriesData)

        setLoading(false)
    }

    // Calculate totals
    const totalBalance = wallets.reduce((sum, w) => sum + (w.balance || 0), 0)
    const totalIncome = transactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0)
    const totalExpense = transactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0)

    // Prepare chart data
    const expensesByCategory = categories
        .filter(c => c.type === "expense")
        .map(cat => {
            const catTransactions = transactions.filter(
                t => t.category_id === cat.id && t.type === "expense"
            )
            return {
                name: cat.name,
                value: catTransactions.reduce((sum, t) => sum + Number(t.amount), 0),
                color: cat.color || "#8884d8"
            }
        })
        .filter(item => item.value > 0)

    const monthlyData = getMonthlyData(transactions)

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

                {/* Summary Cards Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <Card key={i}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-4 rounded-full" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-28 mb-2" />
                                <Skeleton className="h-3 w-20" />
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Charts Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-5 w-40 mb-2" />
                            <Skeleton className="h-4 w-56" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-[300px] w-full rounded-lg" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-5 w-40 mb-2" />
                            <Skeleton className="h-4 w-56" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-[300px] w-full rounded-lg" />
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Transactions Skeleton */}
                <Card>
                    <CardHeader>
                        <Skeleton className="h-5 w-40 mb-2" />
                        <Skeleton className="h-4 w-56" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-48" />
                                    </div>
                                </div>
                                <Skeleton className="h-5 w-20" />
                            </div>
                        ))}
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
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="text-muted-foreground">Visão geral das suas finanças</p>
                </div>
                <Link href="/dashboard/transactions/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Nova Transação
                    </Button>
                </Link>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
                        <WalletIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            R$ {totalBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {wallets.length} carteiras
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Receitas</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            R$ {totalIncome.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Este mês
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Despesas</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            R$ {totalExpense.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Este mês
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Expenses by Category */}
                <Card>
                    <CardHeader>
                        <CardTitle>Despesas por Categoria</CardTitle>
                        <CardDescription>Distribuição das suas despesas</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {expensesByCategory.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={expensesByCategory}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {expensesByCategory.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                Nenhuma despesa registrada
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Monthly Overview */}
                <Card>
                    <CardHeader>
                        <CardTitle>Receitas vs Despesas</CardTitle>
                        <CardDescription>Evolução mensal</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {monthlyData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={monthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip formatter={(value) => `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
                                    <Legend />
                                    <Bar dataKey="income" name="Receitas" fill="#10B981" />
                                    <Bar dataKey="expense" name="Despesas" fill="#EF4444" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                Nenhuma transação registrada
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent Transactions */}
            <Card>
                <CardHeader>
                    <CardTitle>Transações Recentes</CardTitle>
                    <CardDescription>Últimas movimentações</CardDescription>
                </CardHeader>
                <CardContent>
                    {transactions.length > 0 ? (
                        <div className="space-y-4">
                            {transactions.map((transaction) => (
                                <div
                                    key={transaction.id}
                                    className="flex items-center justify-between p-3 border rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${transaction.type === "income" ? "bg-green-100" : "bg-red-100"}`}>
                                            {transaction.type === "income" ? (
                                                <TrendingUp className="h-4 w-4 text-green-600" />
                                            ) : (
                                                <TrendingDown className="h-4 w-4 text-red-600" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium">{transaction.description || transaction.category?.name || "Sem descrição"}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {transaction.wallet?.name} • {new Date(transaction.date).toLocaleDateString("pt-BR")}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`font-bold ${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}>
                                        {transaction.type === "income" ? "+" : "-"}R$ {Number(transaction.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            Nenhuma transação encontrada
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

function getMonthlyData(transactions: Transaction[]) {
    const months: { [key: string]: { income: number; expense: number } } = {}

    transactions.forEach(t => {
        const month = new Date(t.date).toLocaleDateString("pt-BR", { month: "short" })
        if (!months[month]) {
            months[month] = { income: 0, expense: 0 }
        }
        if (t.type === "income") {
            months[month].income += Number(t.amount)
        } else {
            months[month].expense += Number(t.amount)
        }
    })

    return Object.entries(months).map(([name, data]) => ({
        name,
        income: data.income,
        expense: data.expense
    }))
}
