"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/providers"
import { supabase, Category } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, PieChart, Pencil, Trash2 } from "lucide-react"

const categoryColors = [
    "#10B981", // green
    "#3B82F6", // blue
    "#F59E0B", // yellow
    "#EF4444", // red
    "#8B5CF6", // purple
    "#EC4899", // pink
    "#6366F6", // indigo
    "#14B8A6", // teal
    "#F97316", // orange
    "#6B7280", // gray
]

const categoryIcons = [
    "utensils",
    "car",
    "home",
    "gamepad-2",
    "heart",
    "graduation-cap",
    "laptop",
    "briefcase",
    "trending-up",
    "gift",
    "shopping-cart",
    "coffee",
    "plane",
    "phone",
    "zap",
    "more-horizontal",
]

export default function CategoriesPage() {
    const { user } = useAuth()
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [filterType, setFilterType] = useState<string>("all")

    // Form state
    const [name, setName] = useState("")
    const [type, setType] = useState<"income" | "expense">("expense")
    const [color, setColor] = useState(categoryColors[0])
    const [icon, setIcon] = useState(categoryIcons[0])
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (user) {
            fetchCategories()
        }
    }, [user])

    const fetchCategories = async () => {
        setLoading(true)
        const { data } = await supabase
            .from("categories")
            .select("*")
            .eq("user_id", user!.id)
            .order("type", { ascending: true })
            .order("name", { ascending: true })

        if (data) setCategories(data)
        setLoading(false)
    }

    const resetForm = () => {
        setName("")
        setType("expense")
        setColor(categoryColors[0])
        setIcon(categoryIcons[0])
        setEditingCategory(null)
    }

    const openDialog = (category?: Category) => {
        if (category) {
            setEditingCategory(category)
            setName(category.name)
            setType(category.type)
            setColor(category.color || categoryColors[0])
            setIcon(category.icon || categoryIcons[0])
        } else {
            resetForm()
        }
        setDialogOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setSaving(true)

        const categoryData = {
            user_id: user.id,
            name,
            type,
            color,
            icon,
        }

        if (editingCategory) {
            await supabase
                .from("categories")
                .update(categoryData)
                .eq("id", editingCategory.id)
        } else {
            await supabase
                .from("categories")
                .insert(categoryData)
        }

        setSaving(false)
        setDialogOpen(false)
        resetForm()
        fetchCategories()
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir esta categoria?")) return

        await supabase
            .from("categories")
            .delete()
            .eq("id", id)

        fetchCategories()
    }

    const filteredCategories = categories.filter(c => {
        if (filterType !== "all" && c.type !== filterType) return false
        return true
    })

    const incomeCategories = filteredCategories.filter(c => c.type === "income")
    const expenseCategories = filteredCategories.filter(c => c.type === "expense")

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

                {/* Filter Buttons Skeleton */}
                <div className="flex gap-4">
                    <Skeleton className="h-10 w-20" />
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                </div>

                {/* Income Categories Skeleton */}
                <Card>
                    <CardHeader>
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-40" />
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <Skeleton className="h-3 w-3 rounded-full" />
                                        <Skeleton className="h-4 w-24" />
                                    </div>
                                    <div className="flex gap-1">
                                        <Skeleton className="h-8 w-8" />
                                        <Skeleton className="h-8 w-8" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Expense Categories Skeleton */}
                <Card>
                    <CardHeader>
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-40" />
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <Skeleton className="h-3 w-3 rounded-full" />
                                        <Skeleton className="h-4 w-24" />
                                    </div>
                                    <div className="flex gap-1">
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
                    <h1 className="text-3xl font-bold">Categorias</h1>
                    <p className="text-muted-foreground">Gerencie suas categorias de transações</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => openDialog()}>
                            <Plus className="mr-2 h-4 w-4" />
                            Nova Categoria
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form onSubmit={handleSubmit}>
                            <DialogHeader>
                                <DialogTitle>
                                    {editingCategory ? "Editar Categoria" : "Nova Categoria"}
                                </DialogTitle>
                                <DialogDescription>
                                    {editingCategory
                                        ? "Atualize os dados da categoria"
                                        : "Adicione uma nova categoria"}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                                        placeholder="Ex: Alimentação"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Tipo</Label>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant={type === "income" ? "default" : "outline"}
                                            className={`flex-1 ${type === "income" ? "bg-green-600 hover:bg-green-700" : ""}`}
                                            onClick={() => setType("income")}
                                        >
                                            Receita
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={type === "expense" ? "default" : "outline"}
                                            className={`flex-1 ${type === "expense" ? "bg-red-600 hover:bg-red-700" : ""}`}
                                            onClick={() => setType("expense")}
                                        >
                                            Despesa
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Cor</Label>
                                    <div className="flex gap-2 flex-wrap">
                                        {categoryColors.map((c) => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => setColor(c)}
                                                className={`w-8 h-8 rounded-full border-2 ${color === c ? "border-gray-900" : "border-transparent"}`}
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

            {/* Filter */}
            <div className="flex gap-4">
                <Button
                    variant={filterType === "all" ? "default" : "outline"}
                    onClick={() => setFilterType("all")}
                >
                    Todas
                </Button>
                <Button
                    variant={filterType === "income" ? "default" : "outline"}
                    className={filterType === "income" ? "bg-green-600 hover:bg-green-700" : ""}
                    onClick={() => setFilterType("income")}
                >
                    Receitas
                </Button>
                <Button
                    variant={filterType === "expense" ? "default" : "outline"}
                    className={filterType === "expense" ? "bg-red-600 hover:bg-red-700" : ""}
                    onClick={() => setFilterType("expense")}
                >
                    Despesas
                </Button>
            </div>

            {/* Categories by Type */}
            {(filterType === "all" || filterType === "income") && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-green-600">Categorias de Receita</CardTitle>
                        <CardDescription>Categorias para receitas</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {incomeCategories.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {incomeCategories.map((category) => (
                                    <div
                                        key={category.id}
                                        className="flex items-center justify-between p-3 border rounded-lg"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: category.color || "#10B981" }}
                                            />
                                            <span className="font-medium">{category.name}</span>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openDialog(category)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-600"
                                                onClick={() => handleDelete(category.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-4">
                                Nenhuma categoria de receita
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}

            {(filterType === "all" || filterType === "expense") && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-red-600">Categorias de Despesa</CardTitle>
                        <CardDescription>Categorias para despesas</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {expenseCategories.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {expenseCategories.map((category) => (
                                    <div
                                        key={category.id}
                                        className="flex items-center justify-between p-3 border rounded-lg"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: category.color || "#EF4444" }}
                                            />
                                            <span className="font-medium">{category.name}</span>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openDialog(category)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-600"
                                                onClick={() => handleDelete(category.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-4">
                                Nenhuma categoria de despesa
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}

            {categories.length === 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <PieChart className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4">Nenhuma categoria encontrada</p>
                        <Button onClick={() => openDialog()}>
                            <Plus className="mr-2 h-4 w-4" />
                            Criar Primeira Categoria
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
