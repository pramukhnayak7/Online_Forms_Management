import Link from "next/link";
import SignOutButton from "./SignOutButton";
import UserInitialAvatar from "./UserInitialAvatar";
import CreateFormButton from "./CreateFormButton";


export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="bg-surface font-body text-on-surface antialiased min-h-screen relative overflow-hidden">
            <div className="absolute top-[-15%] left-[-10%] w-[40%] h-[45%] rounded-full bg-primary/8 blur-[120px] -z-10" />
            <div className="absolute bottom-[-20%] right-[-12%] w-[35%] h-[45%] rounded-full bg-secondary/10 blur-[120px] -z-10" />

            {/* TopNavBar */}
            <header className="fixed top-0 w-full z-50 bg-surface/85 backdrop-blur-md border-b border-outline-variant/20 shadow-[0_8px_24px_-16px_rgba(26,27,34,0.2)]">
                <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg primary-gradient flex items-center justify-center shadow-md shadow-primary/20">
                            <span className="material-symbols-outlined text-white">architecture</span>
                        </div>
                        <span className="text-lg font-extrabold tracking-tight">FormFlow</span>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* <div className="hidden md:flex items-center bg-surface-container-high px-4 py-2 rounded-full border border-outline-variant/20">
                            <span className="material-symbols-outlined text-on-surface-variant text-sm mr-2">search</span>
                            <input
                                className="bg-transparent border-none focus:ring-0 text-sm w-56 placeholder:text-on-surface-variant/80 outline-none"
                                placeholder="Search forms..."
                                type="text"
                            />
                        </div> 
                        <button className="p-2 text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-full active:scale-95 duration-200">
                            <span className="material-symbols-outlined">notifications</span>
                        </button>*/}
                        <UserInitialAvatar />
                    </div>

                </div>
            </header>

            <div className="flex min-h-screen pt-[72px]">
                {/* SideNavBar */}
                <aside className="h-[calc(100vh-72px)] w-64 fixed left-0 top-[72px] bg-surface-container-lowest/80 backdrop-blur-sm flex flex-col gap-2 p-4 text-sm font-medium z-40 border-r border-outline-variant/15">

                    <nav className="space-y-1">
                        <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 bg-surface-container-high text-primary shadow-sm rounded-lg transition-all border border-outline-variant/15">
                            <span className="material-symbols-outlined">description</span>
                            <span>My Forms</span>
                        </Link>
                        <Link href="/dashboard/history" className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:text-primary hover:translate-x-1 transition-all">
                            <span className="material-symbols-outlined">history</span>
                            <span>History</span>
                        </Link>
                    </nav>

                    {/* <div className="mt-6 px-2">
                        <button className="w-full py-3 primary-gradient text-on-primary rounded-lg font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all">
                            <span className="material-symbols-outlined text-sm">add</span>
                            <span>Create New Form</span>
                        </button>
                    </div> */}
                    <div className="mt-6 px-2">
                        <CreateFormButton />
                    </div>
                    <div className="mt-auto pb-4 space-y-1">
                        <SignOutButton />
                    </div>
                </aside>

                {/* Main Canvas where page.tsx renders */}
                <main className="ml-64 flex-1 p-8 lg:p-12 max-w-7xl mx-auto w-full relative z-10">
                    {children}
                </main>
            </div>
        </div>
    );
}