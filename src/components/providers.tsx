"use client"

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from "react"
import { User, Session } from "@supabase/supabase-js"
import { useQueryClient } from "@tanstack/react-query"
import { supabase, type Profile } from "@/lib/supabase"
import { clearCurrentSession, createSession, validateCurrentSession } from "@/lib/sessions"
import { callDeleteUserAccount } from "@/lib/delete-account"
import { ThemeProvider } from "@/components/theme-provider"
import { PwaShellProvider } from "@/components/pwa/pwa-shell-provider"
import { Toaster } from "@/components/ui/sonner"
import { clearAllOutbox } from "@/lib/offline/outbox"
import { unsubscribeFromPush } from "@/lib/push/subscribe"
import { ensureUserSettingsRow } from "@/lib/settings"
import { clearFinanceQueryIdb } from "@/lib/queries/idb-persister"
import { profileKeys } from "@/lib/queries/keys"
import { useProfileQuery } from "@/lib/queries/use-profile"

interface AuthContextType {
    user: User | null
    profile: Profile | null
    session: Session | null
    loading: boolean
    /** True once the profiles row fetch finished for the signed-in user (avoids email fallback flash before `avatar_color` loads). */
    profileReady: boolean
    signOut: () => Promise<void>
    initializeUserData: () => Promise<void>
    updateProfile: (data: {
        full_name?: string
        avatar_url?: string
    }) => Promise<{ error: string | null }>
    updateEmail: (
        newEmail: string,
        password: string
    ) => Promise<{ error: string | null; needsConfirmation: boolean }>
    uploadAvatar: (
        file: File
    ) => Promise<{ error: string | null; avatarUrl: string | null }>
    deleteAccount: (password: string) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    session: null,
    loading: true,
    profileReady: false,
    signOut: async () => {},
    initializeUserData: async () => {},
    updateProfile: async () => ({ error: "Not initialized" }),
    updateEmail: async () => ({
        error: "Not initialized",
        needsConfirmation: false,
    }),
    uploadAvatar: async () => ({ error: "Not initialized", avatarUrl: null }),
    deleteAccount: async () => ({ error: "Not initialized" }),
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient()
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)
    const prevSignedInUserIdRef = useRef<string | null>(null)

    const profileQuery = useProfileQuery(user?.id)
    const profile = profileQuery.data ?? null
    const profileReady = user?.id == null || profileQuery.isFetched

    const clearClientCaches = useCallback(async () => {
        await queryClient.cancelQueries()
        queryClient.clear()
        await clearFinanceQueryIdb()
        await clearAllOutbox()
        try {
            await unsubscribeFromPush()
        } catch {
            /* best effort */
        }
    }, [queryClient])

    const initializeUserData = useCallback(async () => {
        if (!user) return

        try {
            await ensureUserSettingsRow(user.id)
        } catch {
            /* non-blocking; settings page will retry */
        }
    }, [user])

    useEffect(() => {
        if (user) {
            initializeUserData()
        }
    }, [user, initializeUserData])

    useEffect(() => {
        void supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (session?.user) {
                setSession(session)
                setUser(session.user)
                prevSignedInUserIdRef.current = session.user.id
                setLoading(false)

                validateCurrentSession().then((ok) => {
                    if (!ok) {
                        setSession(null)
                        setUser(null)
                        prevSignedInUserIdRef.current = null
                    }
                }).catch(() => {})
            } else {
                setSession(null)
                setUser(null)
                prevSignedInUserIdRef.current = null
                setLoading(false)
            }
        })

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "TOKEN_REFRESHED" && session) {
                setSession((prev) =>
                    prev?.access_token === session.access_token ? prev : session,
                )
                setUser((prev) =>
                    prev && session.user && prev.id === session.user.id
                        ? prev
                        : (session.user ?? null),
                )
                setLoading(false)
                void validateCurrentSession().then((ok) => {
                    if (!ok) {
                        setSession(null)
                        setUser(null)
                        prevSignedInUserIdRef.current = null
                    }
                })
                return
            }

            if (event === "SIGNED_OUT") {
                prevSignedInUserIdRef.current = null
                setSession(null)
                setUser(null)
                setLoading(false)
                void clearClientCaches()
                return
            }

            const nextUser = session?.user ?? null
            const prevId = prevSignedInUserIdRef.current
            if (
                nextUser?.id &&
                prevId &&
                prevId !== nextUser.id &&
                (event === "SIGNED_IN" || event === "USER_UPDATED")
            ) {
                void clearClientCaches()
            }
            prevSignedInUserIdRef.current = nextUser?.id ?? null

            setSession(session)
            setUser(nextUser)
            setLoading(false)

            if (event === "SIGNED_IN" && session) {
                void (async () => {
                    try {
                        await createSession()
                        await validateCurrentSession()
                    } catch {
                        /* rede / edge indisponível */
                    }
                })()
            }
        })

        return () => subscription.unsubscribe()
    }, [clearClientCaches])

    const signOut = useCallback(async () => {
        clearCurrentSession()
        await clearClientCaches()
        await supabase.auth.signOut()
    }, [clearClientCaches])

    const updateProfile = useCallback(async (data: {
        full_name?: string
        avatar_url?: string
    }) => {
        if (!user) return { error: "Usuário não autenticado" }

        const { error } = await supabase.auth.updateUser({
            data: {
                full_name: data.full_name,
                avatar_url: data.avatar_url,
            },
        })

        if (error) return { error: error.message }

        const { data: refreshData } = await supabase.auth.getUser()
        if (refreshData?.user) {
            setUser(refreshData.user)
        }

        await queryClient.invalidateQueries({
            queryKey: profileKeys.detail(user.id),
        })

        return { error: null }
    }, [user, queryClient])

    const updateEmail = useCallback(async (newEmail: string, password: string) => {
        if (!user)
            return { error: "Usuário não autenticado", needsConfirmation: false }

        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email || "",
            password: password,
        })

        if (signInError) {
            return { error: "Senha incorreta", needsConfirmation: false }
        }

        const { error } = await supabase.auth.updateUser({
            email: newEmail,
        })

        if (error) {
            return { error: error.message, needsConfirmation: false }
        }

        const { data: refreshData } = await supabase.auth.getUser()
        if (refreshData?.user) {
            setUser(refreshData.user)
        }

        return { error: null, needsConfirmation: true }
    }, [user])

    const uploadAvatar = useCallback(async (
        file: File,
    ): Promise<{ error: string | null; avatarUrl: string | null }> => {
        if (!user) {
            return { error: "Usuário não autenticado", avatarUrl: null }
        }

        try {
            if (!file.type.startsWith("image/")) {
                return { error: "Por favor, selecione uma imagem", avatarUrl: null }
            }

            if (file.size > 5 * 1024 * 1024) {
                return { error: "A imagem deve ter no máximo 5MB", avatarUrl: null }
            }

            const fileExt = file.name.split(".").pop()
            const fileName = `${user.id}/avatar.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from("avatars")
                .upload(fileName, file, {
                    upsert: true,
                    contentType: file.type,
                })

            if (uploadError) {
                console.error("Upload error:", uploadError)
                return { error: "Erro ao fazer upload da imagem", avatarUrl: null }
            }

            const { data: urlData } = supabase.storage
                .from("avatars")
                .getPublicUrl(fileName)

            return { error: null, avatarUrl: urlData.publicUrl }
        } catch (error) {
            console.error("Upload exception:", error)
            return { error: "Erro ao processar imagem", avatarUrl: null }
        }
    }, [user])

    const deleteAccount = useCallback(async (
        password: string,
    ): Promise<{ error: string | null }> => {
        if (!user) return { error: "Usuário não autenticado" }

        const { data: signInData, error: signInError } =
            await supabase.auth.signInWithPassword({
                email: user.email || "",
                password: password,
            })

        if (signInError) {
            return { error: "Senha incorreta" }
        }

        if (!signInData.session?.access_token) {
            return { error: "Sessão inválida ou expirada; faça login novamente." }
        }

        try {
            await callDeleteUserAccount(password)
        } catch (e) {
            const message =
                e instanceof Error
                    ? e.message
                    : "Erro ao excluir conta. Tente novamente."
            console.error("deleteAccount:", e)
            return { error: message }
        }

        await clearClientCaches()
        await supabase.auth.signOut()

        return { error: null }
    }, [user, clearClientCaches])

    const authValue = useMemo(
        () => ({
            user,
            profile,
            session,
            loading,
            profileReady,
            signOut,
            initializeUserData,
            updateProfile,
            updateEmail,
            uploadAvatar,
            deleteAccount,
        }),
        [
            user,
            profile,
            session,
            loading,
            profileReady,
            signOut,
            initializeUserData,
            updateProfile,
            updateEmail,
            uploadAvatar,
            deleteAccount,
        ],
    )

    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
        >
            <AuthContext.Provider value={authValue}>
                <PwaShellProvider>{children}</PwaShellProvider>
            </AuthContext.Provider>
            <Toaster />
        </ThemeProvider>
    )
}
