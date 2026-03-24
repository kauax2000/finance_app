"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { User, Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { ThemeProvider } from "@/components/theme-provider"

interface AuthContextType {
    user: User | null
    session: Session | null
    loading: boolean
    signOut: () => Promise<void>
    initializeUserData: () => Promise<void>
    updateProfile: (data: { full_name?: string; avatar_url?: string }) => Promise<{ error: string | null }>
    updateEmail: (newEmail: string, password: string) => Promise<{ error: string | null; needsConfirmation: boolean }>
    uploadAvatar: (file: File) => Promise<{ error: string | null; avatarUrl: string | null }>
    deleteAccount: (password: string) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    loading: true,
    signOut: async () => { },
    initializeUserData: async () => { },
    updateProfile: async () => ({ error: "Not initialized" }),
    updateEmail: async () => ({ error: "Not initialized", needsConfirmation: false }),
    uploadAvatar: async () => ({ error: "Not initialized", avatarUrl: null }),
    deleteAccount: async () => ({ error: "Not initialized" }),
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)

    const initializeUserData = async () => {
        if (!user) return

        // Check if user has wallets, if not create defaults
        const { data: wallets } = await supabase
            .from("wallets")
            .select("id")
            .eq("user_id", user.id)
            .limit(1)

        if (!wallets || wallets.length === 0) {
            // Create default wallets
            await supabase.from("wallets").insert([
                { user_id: user.id, name: "Carteira", type: "cash", balance: 0, color: "#10B981" },
                { user_id: user.id, name: "Conta Corrente", type: "checking", balance: 0, color: "#3B82F6" },
                { user_id: user.id, name: "Poupança", type: "savings", balance: 0, color: "#F59E0B" },
            ])
        }

        // Check if user has categories, if not create defaults
        const { data: categories } = await supabase
            .from("categories")
            .select("id")
            .eq("user_id", user.id)
            .limit(1)

        if (!categories || categories.length === 0) {
            // Create default categories
            await supabase.from("categories").insert([
                { user_id: user.id, name: "Alimentação", type: "expense", color: "#EF4444" },
                { user_id: user.id, name: "Transporte", type: "expense", color: "#3B82F6" },
                { user_id: user.id, name: "Moradia", type: "expense", color: "#8B5CF6" },
                { user_id: user.id, name: "Lazer", type: "expense", color: "#F59E0B" },
                { user_id: user.id, name: "Saúde", type: "expense", color: "#10B981" },
                { user_id: user.id, name: "Educação", type: "expense", color: "#6366F1" },
                { user_id: user.id, name: "Outros", type: "expense", color: "#6B7280" },
                { user_id: user.id, name: "Salário", type: "income", color: "#10B981" },
                { user_id: user.id, name: "Freelance", type: "income", color: "#3B82F6" },
                { user_id: user.id, name: "Investimentos", type: "income", color: "#F59E0B" },
                { user_id: user.id, name: "Presentes", type: "income", color: "#EC4899" },
                { user_id: user.id, name: "Outros", type: "income", color: "#6B7280" },
            ])
        }
    }

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setUser(session?.user ?? null)
            setLoading(false)
        })

        // Listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
            setUser(session?.user ?? null)
            setLoading(false)
        })

        return () => subscription.unsubscribe()
    }, [])

    // Initialize user data when user changes
    useEffect(() => {
        if (user) {
            initializeUserData()
        }
    }, [user])

    const signOut = async () => {
        await supabase.auth.signOut()
    }

    const updateProfile = async (data: { full_name?: string; avatar_url?: string }) => {
        if (!user) return { error: "Usuário não autenticado" }

        const { error } = await supabase.auth.updateUser({
            data: {
                full_name: data.full_name,
                avatar_url: data.avatar_url,
            }
        })

        if (error) return { error: error.message }

        // Refresh user data
        const { data: refreshData } = await supabase.auth.getUser()
        if (refreshData?.user) {
            setUser(refreshData.user)
        }

        return { error: null }
    }

    const updateEmail = async (newEmail: string, password: string) => {
        if (!user) return { error: "Usuário não autenticado", needsConfirmation: false }

        // First verify the password
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email || "",
            password: password,
        })

        if (signInError) {
            return { error: "Senha incorreta", needsConfirmation: false }
        }

        // Update the email
        const { error } = await supabase.auth.updateUser({
            email: newEmail,
        })

        if (error) {
            return { error: error.message, needsConfirmation: false }
        }

        // Refresh user data
        const { data: refreshData } = await supabase.auth.getUser()
        if (refreshData?.user) {
            setUser(refreshData.user)
        }

        return { error: null, needsConfirmation: true }
    }

    const uploadAvatar = async (file: File): Promise<{ error: string | null; avatarUrl: string | null }> => {
        if (!user) {
            return { error: "Usuário não autenticado", avatarUrl: null }
        }

        try {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                return { error: "Por favor, selecione uma imagem", avatarUrl: null }
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                return { error: "A imagem deve ter no máximo 5MB", avatarUrl: null }
            }

            // Create a unique filename
            const fileExt = file.name.split('.').pop()
            const fileName = `${user.id}/avatar.${fileExt}`

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, {
                    upsert: true,
                    contentType: file.type,
                })

            if (uploadError) {
                console.error("Upload error:", uploadError)
                return { error: "Erro ao fazer upload da imagem", avatarUrl: null }
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName)

            return { error: null, avatarUrl: urlData.publicUrl }
        } catch (error) {
            console.error("Upload exception:", error)
            return { error: "Erro ao processar imagem", avatarUrl: null }
        }
    }

    const deleteAccount = async (password: string): Promise<{ error: string | null }> => {
        if (!user) return { error: "Usuário não autenticado" }

        // First verify the password
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email || "",
            password: password,
        })

        if (signInError) {
            return { error: "Senha incorreta" }
        }

        const userId = user.id

        // Delete all user data from the database (in order to respect foreign keys)
        // Delete transaction splits first (dependent on transactions)
        const { data: transactions } = await supabase
            .from("transactions")
            .select("id")
            .eq("user_id", userId)

        if (transactions && transactions.length > 0) {
            const transactionIds = transactions.map(t => t.id)
            await supabase
                .from("transaction_splits")
                .delete()
                .in("transaction_id", transactionIds)
        }

        // Delete transactions
        await supabase.from("transactions").delete().eq("user_id", userId)

        // Delete wallets
        await supabase.from("wallets").delete().eq("user_id", userId)

        // Delete categories
        await supabase.from("categories").delete().eq("user_id", userId)

        // Delete profile
        await supabase.from("profiles").delete().eq("id", userId)

        // Delete avatar from storage if exists
        await supabase.storage.from("avatars").remove([`${userId}/avatar`])

        // Delete the user from auth using admin API
        const { error: deleteError } = await supabase.auth.admin.deleteUser(userId)

        if (deleteError) {
            console.error("Error deleting user from auth:", deleteError)
            return { error: "Erro ao excluir conta. Tente novamente." }
        }

        // Sign out after successful deletion
        await supabase.auth.signOut()

        return { error: null }
    }

    // ThemeProvider wraps AuthProvider (not the other way around)
    // This prevents hydration issues with Next.js
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <AuthContext.Provider value={{
                user,
                session,
                loading,
                signOut,
                initializeUserData,
                updateProfile,
                updateEmail,
                uploadAvatar,
                deleteAccount
            }}>
                {children}
            </AuthContext.Provider>
        </ThemeProvider>
    )
}
