"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase";

type StoredUser = {
    user_id: number;
    username: string;
    name: string;
};

type ResponseRow = {
    form_id: string;
    submitted_at: string;
};

type FormTitleRow = {
    form_id: string;
    title: string;
};

type AttemptRow = {
    form_id: string;
    title: string;
    submitted_at: string;
};

export default function HistoryPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [attempts, setAttempts] = useState<AttemptRow[]>([]);
    const supabase = useMemo(() => createClient(), []);

    useEffect(() => {
        async function loadHistory() {
            setIsLoading(true);
            setErrorMessage(null);

            try {
                const stored = localStorage.getItem("formdb_user");
                if (!stored) {
                    setErrorMessage("No active user found. Please sign in again.");
                    setAttempts([]);
                    setIsLoading(false);
                    return;
                }

                const user = JSON.parse(stored) as StoredUser;

                const { data: responseRows, error: responsesError } = await supabase
                    .from("responses")
                    .select("form_id, submitted_at")
                    .eq("user_id", user.user_id)
                    .order("submitted_at", { ascending: false });

                if (responsesError) {
                    setErrorMessage(responsesError.message || "Failed to load response history.");
                    setAttempts([]);
                    setIsLoading(false);
                    return;
                }

                const responses = (responseRows ?? []) as ResponseRow[];

                if (responses.length === 0) {
                    setAttempts([]);
                    setIsLoading(false);
                    return;
                }

                const uniqueFormIds = Array.from(new Set(responses.map((r) => r.form_id)));
                const { data: formsData, error: formsError } = await supabase
                    .from("forms")
                    .select("form_id, title")
                    .in("form_id", uniqueFormIds);

                if (formsError) {
                    setErrorMessage(formsError.message || "Failed to load form details.");
                    setAttempts([]);
                    setIsLoading(false);
                    return;
                }

                const titleById = new Map(
                    ((formsData ?? []) as FormTitleRow[]).map((f) => [f.form_id, f.title])
                );

                const historyRows = responses.map((r) => ({
                    form_id: r.form_id,
                    title: titleById.get(r.form_id) || "Untitled Form",
                    submitted_at: r.submitted_at,
                }));

                setAttempts(historyRows);
            } catch {
                setErrorMessage("Unexpected error while loading history.");
                setAttempts([]);
            } finally {
                setIsLoading(false);
            }
        }

        loadHistory();
    }, [supabase]);

    return (
        <>
            <section className="mb-10">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-on-surface mb-2">
                    History
                </h1>
                <p className="text-on-surface-variant text-lg max-w-2xl">
                    Forms you have attempted.
                </p>
            </section>

            <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 overflow-hidden">
                <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-surface-container-low border-b border-outline-variant/15 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    <div className="col-span-5">Form Title</div>
                    <div className="col-span-3">Form Code</div>
                    <div className="col-span-4">Attempted At</div>
                </div>

                {isLoading && (
                    <div className="px-6 py-8 text-on-surface-variant">Loading history...</div>
                )}

                {!isLoading && errorMessage && (
                    <div className="px-6 py-8 text-on-error-container bg-error-container">
                        {errorMessage}
                    </div>
                )}

                {!isLoading && !errorMessage && attempts.length === 0 && (
                    <div className="px-6 py-8 text-on-surface-variant">
                        No attempted forms found yet.
                    </div>
                )}

                {!isLoading && !errorMessage && attempts.map((attempt, index) => (
                    <div
                        key={`${attempt.form_id}-${attempt.submitted_at}-${index}`}
                        className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-outline-variant/10 last:border-b-0"
                    >
                        <div className="col-span-5 font-semibold text-on-surface">{attempt.title}</div>
                        <div className="col-span-3 font-mono text-sm text-on-surface-variant">{attempt.form_id}</div>
                        <div className="col-span-4 text-on-surface-variant">
                            {new Date(attempt.submitted_at).toLocaleString()}
                        </div>
                    </div>
                ))}
            </section>
        </>
    );
}
