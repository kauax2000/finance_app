export default function MembersLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="mx-auto w-full min-w-0 max-w-xl">
            {children}
        </div>
    )
}
