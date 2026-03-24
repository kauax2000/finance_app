import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validate that environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        'Missing Supabase environment variables. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your .env.local file.'
    )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for the database
export interface Profile {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
    created_at: string
    updated_at: string
}

export interface Wallet {
    id: string
    user_id: string
    name: string
    type: 'checking' | 'savings' | 'digital' | 'cash' | 'other'
    balance: number
    color: string | null
    icon: string | null
    created_at: string
    updated_at: string
}

export interface Category {
    id: string
    user_id: string
    name: string
    type: 'income' | 'expense'
    color: string | null
    icon: string | null
    created_at: string
    updated_at: string
}

export interface Transaction {
    id: string
    user_id: string
    wallet_id: string
    category_id: string | null
    type: 'income' | 'expense'
    amount: number
    description: string | null
    date: string
    is_recurring: boolean
    recurring_interval: 'daily' | 'weekly' | 'monthly' | null
    created_at: string
    updated_at: string
    // Related data
    wallet?: Wallet
    category?: Category
}

export interface TransactionSplit {
    id: string
    transaction_id: string
    category_id: string | null
    amount: number
    percentage: number
    created_at: string
}
