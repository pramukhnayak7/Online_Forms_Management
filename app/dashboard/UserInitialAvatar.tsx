"use client";

import { useEffect, useState } from "react";

type StoredUser = {
    name?: string;
    username?: string;
};

function getInitial(user: StoredUser | null) {
    const source = user?.name?.trim() || user?.username?.trim() || "D";
    return source.charAt(0).toUpperCase();
}

export default function UserInitialAvatar() {
    const [initial, setInitial] = useState("D");
    const [displayName, setDisplayName] = useState("User");

    useEffect(() => {
        const raw = localStorage.getItem("formdb_user");
        if (!raw) {
            setInitial("D");
            setDisplayName("User");
            return;
        }

        try {
            const user = JSON.parse(raw) as StoredUser;
            setInitial(getInitial(user));
            setDisplayName(user.name?.trim() || user.username?.trim() || "User");
        } catch {
            setInitial("D");
            setDisplayName("User");
        }
    }, []);

    return (
        <div
            title={displayName}
            aria-label={displayName}
            className="h-9 w-9 rounded-full primary-gradient overflow-hidden border border-primary/10 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-primary/20"
        >
            {initial}
        </div>
    );
}
