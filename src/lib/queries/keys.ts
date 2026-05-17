/** Bump `PERSIST_BUSTER` in persist.ts when persisted query shapes change. */

export const queryRoot = {
    workspaces: "workspaces",
    categories: "categories",
    creditCards: "creditCards",
    /** Full credit cards list page bundle (cards + cc tx rows + installment plans). */
    creditCardsPageBundle: "creditCardsPageBundle",
    subscriptions: "subscriptions",
    /** Subscriptions app page: rows + categories + cards + billing stats. */
    subscriptionsPageBundle: "subscriptionsPageBundle",
    billsPageBundle: "billsPageBundle",
    /** Category detail screen bundle (month-scoped). */
    categoryDetailBundle: "categoryDetailBundle",
    /** Transactions list sidebar: has-any-tx + plan/sub pickers. */
    transactionsWorkspaceAux: "transactionsWorkspaceAux",
    installmentPlans: "installmentPlans",
    memberDirectory: "memberDirectory",
    transactions: "transactions",
    transactionsSummary: "transactionsSummary",
    creditCardExpenseRows: "creditCardExpenseRows",
    profile: "profile",
    sessions: "sessions",
    activity: "activity",
    userSettings: "userSettings",
} as const

export const workspaceKeys = {
    all: [queryRoot.workspaces] as const,
    list: (userId: string) => [queryRoot.workspaces, "list", userId] as const,
}

export const categoriesKeys = {
    all: [queryRoot.categories] as const,
    list: (workspaceId: string) =>
        [queryRoot.categories, "list", workspaceId] as const,
}

export const creditCardsKeys = {
    all: [queryRoot.creditCards] as const,
    list: (workspaceId: string) =>
        [queryRoot.creditCards, "list", workspaceId] as const,
}

export const creditCardsPageBundleKeys = {
    bundle: (workspaceId: string) =>
        [queryRoot.creditCardsPageBundle, workspaceId] as const,
}

export const subscriptionsKeys = {
    all: [queryRoot.subscriptions] as const,
    list: (workspaceId: string) =>
        [queryRoot.subscriptions, "list", workspaceId] as const,
}

export const subscriptionsPageBundleKeys = {
    bundle: (workspaceId: string) =>
        [queryRoot.subscriptionsPageBundle, workspaceId] as const,
}

export const billsPageBundleKeys = {
    bundle: (workspaceId: string) =>
        [queryRoot.billsPageBundle, workspaceId] as const,
}

export const categoryDetailBundleKeys = {
    bundle: (workspaceId: string, categoryId: string, yearMonth: string) =>
        [queryRoot.categoryDetailBundle, workspaceId, categoryId, yearMonth] as const,
}

export const transactionsWorkspaceAuxKeys = {
    detail: (workspaceId: string) =>
        [queryRoot.transactionsWorkspaceAux, workspaceId] as const,
}

export const installmentPlansKeys = {
    all: [queryRoot.installmentPlans] as const,
    list: (workspaceId: string) =>
        [queryRoot.installmentPlans, "list", workspaceId] as const,
}

export const memberDirectoryKeys = {
    all: [queryRoot.memberDirectory] as const,
    list: (workspaceId: string) =>
        [queryRoot.memberDirectory, "list", workspaceId] as const,
}

export type TransactionsRangeKey = {
    from: string
    to: string
}

export const transactionsKeys = {
    all: [queryRoot.transactions] as const,
    list: (
        workspaceId: string,
        range: TransactionsRangeKey,
        filtersKey: string,
    ) =>
        [
            queryRoot.transactions,
            "list",
            workspaceId,
            range.from,
            range.to,
            filtersKey,
        ] as const,
    /** Dashboard / analytics: summary rows only */
    summary: (workspaceId: string, range: TransactionsRangeKey) =>
        [
            queryRoot.transactionsSummary,
            workspaceId,
            range.from,
            range.to,
        ] as const,
}

export const creditCardExpenseRowsKeys = {
    all: [queryRoot.creditCardExpenseRows] as const,
    pack: (workspaceId: string) =>
        [queryRoot.creditCardExpenseRows, workspaceId] as const,
}

export const profileKeys = {
    all: [queryRoot.profile] as const,
    detail: (userId: string) => [queryRoot.profile, "detail", userId] as const,
}

export const sessionsKeys = {
    all: [queryRoot.sessions] as const,
    list: (userId: string) => [queryRoot.sessions, "list", userId] as const,
}

export const activityKeys = {
    all: [queryRoot.activity] as const,
    list: (userId: string) => [queryRoot.activity, "list", userId] as const,
}

export const walletsKeys = {
    all: ["wallets"] as const,
    list: (workspaceId: string) => ["wallets", "list", workspaceId] as const,
}

export const userSettingsKeys = {
    all: [queryRoot.userSettings] as const,
    detail: (userId: string) =>
        [queryRoot.userSettings, "detail", userId] as const,
}
