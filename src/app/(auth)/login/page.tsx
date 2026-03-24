import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
            <div className="flex w-full max-w-sm flex-col gap-6">
                <a href="#" className="flex items-center gap-2 self-center font-medium">
                    <svg
                        width="32"
                        height="32"
                        viewBox="0 0 32 32"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="size-8 shrink-0 text-primary dark:text-white transition-all duration-200"
                    >
                        <path
                            d="M27.8004 6.52056C27.9105 7.06413 27.5571 7.59341 27.0129 7.70023L20.6453 8.95007C18.9288 9.2876 17.5787 10.5992 17.2119 12.2821L16.103 17.363H26.6451C27.1974 17.363 27.6451 17.8107 27.6451 18.363V19.9393C27.6451 20.4916 27.1974 20.9393 26.6451 20.9393H15.3222L14.7012 23.7959C13.4842 29.3797 5.39049 29.4098 4.1305 23.8352C3.3812 20.5144 5.9536 17.363 9.41364 17.363H12.3857L13.6588 11.532C14.3292 8.45614 16.7938 6.06486 19.9311 5.44795L26.3144 4.19201C26.8542 4.0858 27.3784 4.43558 27.4876 4.97481L27.8004 6.52056ZM9.41364 20.9393C8.27769 20.9393 7.43279 21.973 7.67921 23.0632C8.09367 24.8914 10.7479 24.8815 11.1481 23.0501L11.6094 20.9393H9.41364Z"
                            fill="currentColor"
                        />
                    </svg>
                    <span className="text-lg font-semibold">
                        Finance App
                    </span>
                </a>
                <LoginForm />
            </div>
        </div>
    )
}
