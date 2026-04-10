"use client";

import { useRouter } from "next/navigation";

export default function SignOutButton() {
    const router = useRouter();

    function handleSignOut() {
        localStorage.removeItem("formdb_user");
        document.cookie = "formdb_session=; Path=/; Max-Age=0; SameSite=Lax";
        router.push("/login");
        router.refresh();
    }

    return (
        <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-all"
        >
            <span className="material-symbols-outlined">logout</span>
            <span>Sign Out</span>
        </button>
    );
}
