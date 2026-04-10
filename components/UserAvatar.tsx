"use client";

import { getUserSession } from "@/utils/session";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UserAvatar() {
    const session = getUserSession();
    const initial = session?.username?.[0]?.toUpperCase() ?? "?";
    const [open, setOpen] = useState(false);
    const router = useRouter();

    function handleSignOut() {
        localStorage.removeItem("formdb_user");
        router.push("/login");
    }

    return (
        <div className="relative">
            <div
                onClick={() => setOpen((v) => !v)}
                className="h-9 w-9 rounded-full primary-gradient overflow-hidden border border-primary/10 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-primary/20 cursor-pointer"
            >
                {initial}
            </div>

            {open && (
                <>
                    {/* Backdrop to close on outside click */}
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    
                    <div className="absolute right-0 mt-2 w-48 bg-surface-container-lowest border border-outline-variant/20 rounded-xl shadow-lg z-50 overflow-hidden">
                        <div className="px-4 py-3 border-b border-outline-variant/15">
                            <p className="text-sm font-bold text-on-surface">{session?.username}</p>
                            <p className="text-xs text-on-surface-variant">{session?.name}</p>
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-error hover:bg-error/5 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px]">logout</span>
                            Sign Out
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
