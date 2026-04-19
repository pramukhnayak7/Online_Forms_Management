"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/utils/supabase";
import { useRouter } from "next/navigation";

type FormRow = {
    form_id: string;
    title: string;
    created_at: string;
};

type DashboardForm = FormRow & {
    questionCount: number;
    responseCount: number;
};

type StoredUser = {
    user_id: number;
    username: string;
    name: string;
};

export default function DashboardPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [forms, setForms] = useState<DashboardForm[]>([]);
    const [accessCode, setAccessCode] = useState("");
    const [openMenuFormId, setOpenMenuFormId] = useState<string | null>(null);
    const router = useRouter();
    const supabase = useMemo(() => createClient(), []);
    const openMenuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        async function loadDashboardData() {
            setIsLoading(true);
            setErrorMessage(null);

            try {
                const stored = localStorage.getItem("formdb_user");
                if (!stored) {
                    setErrorMessage("No active user found. Please sign in again.");
                    setForms([]);
                    setIsLoading(false);
                    return;
                }

                const user = JSON.parse(stored) as StoredUser;

                const { data: createdForms, error: formsError } = await supabase
                    .from("forms")
                    .select("form_id, title, created_at")
                    .eq("creator_id", user.user_id)
                    .order("created_at", { ascending: false });

                if (formsError) {
                    setErrorMessage(formsError.message || "Failed to load forms.");
                    setForms([]);
                    setIsLoading(false);
                    return;
                }

                const formsData = (createdForms ?? []) as FormRow[];

                const formsWithCounts = await Promise.all(
                    formsData.map(async (form) => {
                        const [{ count: questionCount }, { count: responseCount }] = await Promise.all([
                            supabase
                                .from("questions")
                                .select("*", { count: "exact", head: true })
                                .eq("form_id", form.form_id),
                            supabase
                                .from("responses")
                                .select("*", { count: "exact", head: true })
                                .eq("form_id", form.form_id),
                        ]);

                        return {
                            ...form,
                            questionCount: questionCount ?? 0,
                            responseCount: responseCount ?? 0,
                        };
                    })
                );

                setForms(formsWithCounts);
            } catch {
                setErrorMessage("Unexpected error while loading dashboard.");
                setForms([]);
            } finally {
                setIsLoading(false);
            }
        }

        loadDashboardData();
    }, [supabase]);

    useEffect(() => {
        if (!openMenuFormId) {
            return;
        }

        const handlePointerDown = (event: PointerEvent) => {
            const menuElement = openMenuRef.current;

            if (menuElement && !menuElement.contains(event.target as Node)) {
                setOpenMenuFormId(null);
            }
        };

        document.addEventListener("pointerdown", handlePointerDown);

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
        };
    }, [openMenuFormId]);

    const totalSubmissions = useMemo(() => {
        return forms.reduce((acc, form) => acc + form.responseCount, 0);
    }, [forms]);

    const handleEditForm = (formId: string) => {
        setOpenMenuFormId(null);
        router.push(`/dashboard/forms/${formId}/edit`);
    };

    const handleViewResponses = (formId: string) => {
        setOpenMenuFormId(null);
        router.push(`/dashboard/forms/${formId}/responses`);
    };

    const handleDeleteForm = async (formId: string) => {
        setOpenMenuFormId(null);

        const shouldDelete = window.confirm(
            "Delete this form? This will also remove its questions and responses."
        );

        if (!shouldDelete) {
            return;
        }

        const { error } = await supabase.from("forms").delete().eq("form_id", formId);

        if (error) {
            setErrorMessage(error.message || "Failed to delete the form.");
            return;
        }

        setForms((currentForms) => currentForms.filter((form) => form.form_id !== formId));
    };

    return (
        <>
            {/* Welcome Header */}
            <section className="mb-12">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-on-surface mb-2">
                    Dashboard
                </h1>
                <p className="text-on-surface-variant text-lg max-w-2xl">
                    Manage your forms and review submission history.
                </p>
            </section>

            {/* Grid: Enter Code & Recent Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
                {/* Enter Form Code Block */}
                <div className="lg:col-span-2 bg-surface-container-lowest p-8 rounded-2xl shadow-[0_24px_48px_-12px_rgba(26,27,34,0.04)] border border-outline-variant/15 flex flex-col justify-between">
                    <div>
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface-container-high text-primary rounded-full text-xs font-bold tracking-wider uppercase mb-4 border border-outline-variant/20">
                            <span className="material-symbols-outlined text-[14px]">vpn_key</span>
                            Direct Access
                        </span>
                        <h2 className="text-2xl font-bold mb-4">Enter Form Code</h2>
                        <p className="text-on-surface-variant mb-8">
                            Access a form by entering its unique identification string below.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <input
                                value={accessCode}
                                onChange={(event) => setAccessCode(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                        event.preventDefault();
                                        const normalizedValue = accessCode.trim().toUpperCase();
                                        if (normalizedValue) router.push(`/forms/${normalizedValue}`);
                                    }
                                }}
                                maxLength={6}
                                className="w-full bg-surface-container-high border-b-2 border-primary border-t-0 border-l-0 border-r-0 rounded-t-lg px-6 py-4 outline-none focus:ring-0 transition-all text-xl font-mono tracking-widest placeholder:opacity-30"
                                placeholder="XXXXX"
                                type="text"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                const normalizedValue = accessCode.trim().toUpperCase();
                                if (normalizedValue) router.push(`/forms/${normalizedValue}`);
                            }}
                            disabled={!accessCode.trim()}
                            className="px-8 py-4 primary-gradient text-on-primary font-bold rounded-lg shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span>Start Form</span>
                            <span className="material-symbols-outlined">arrow_forward</span>
                        </button>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="primary-gradient text-on-primary p-8 rounded-2xl relative overflow-hidden group shadow-[0_24px_48px_-16px_rgba(63,81,255,0.45)]">
                    <div className="relative z-10 h-full flex flex-col justify-between">
                        <div className="text-7xl font-black opacity-60 group-hover:opacity-30 transition-opacity">
                            {totalSubmissions}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold mb-1">Total Submissions</h3>
                            <p className="text-white/80 text-sm">
                                Across all forms.
                            </p>
                        </div>
                    </div>
                    {/* Decorative Element */}
                    <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/20 rounded-full blur-3xl"></div>
                </div>
            </div>

            {/* Created by You Section */}
            <section className="mb-16">
                <div className="flex items-end justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-on-surface">Created by You</h2>
                        <div className="h-1 w-12 primary-gradient mt-2 rounded-full"></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {isLoading && (
                        <div className="md:col-span-2 xl:col-span-3 bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/15 text-on-surface-variant">
                            Loading your forms...
                        </div>
                    )}

                    {!isLoading && errorMessage && (
                        <div className="md:col-span-2 xl:col-span-3 bg-error-container text-on-error-container p-6 rounded-2xl border border-error/20">
                            {errorMessage}
                        </div>
                    )}

                    {!isLoading && !errorMessage && forms.length === 0 && (
                        <div className="md:col-span-2 xl:col-span-3 bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/15 text-on-surface-variant">
                            You have not created any forms yet.
                        </div>
                    )}

                    {!isLoading && !errorMessage && forms.map((form) => (
                        <div
                            key={form.form_id}
                            className={`group relative bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/15 hover:border-primary/30 hover:shadow-[0_24px_48px_-12px_rgba(26,27,34,0.08)] transition-all ${openMenuFormId === form.form_id ? "z-30" : "z-0"}`}
                        >
                            <div
                                ref={openMenuFormId === form.form_id ? openMenuRef : undefined}
                                className="absolute right-3 top-3 z-40"
                            >
                                <button
                                    type="button"
                                    aria-label={`Open actions for ${form.title}`}
                                    onClick={() =>
                                        setOpenMenuFormId((current) =>
                                            current === form.form_id ? null : form.form_id
                                        )
                                    }
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
                                >
                                    <span className="material-symbols-outlined text-[20px]">more_vert</span>
                                </button>

                                {openMenuFormId === form.form_id && (
                                    <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-2xl border border-outline-variant/15 bg-surface-container-lowest shadow-[0_20px_40px_-16px_rgba(26,27,34,0.22)] z-50">
                                        <button
                                            type="button"
                                            onClick={() => handleEditForm(form.form_id)}
                                            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleViewResponses(form.form_id)}
                                            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">quick_reference_all</span>
                                            View Responses
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteForm(form.form_id)}
                                            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-error transition-colors hover:bg-error-container/70"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>

                            <h3 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors">
                                {form.title}
                            </h3>
                            <p className="text-sm text-on-surface-variant mb-4">
                                Created on {new Date(form.created_at).toLocaleDateString()}
                            </p>
                            <div className="mb-4 rounded-lg border border-outline-variant/20 bg-surface-container-high p-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/80 mb-2">Form Code</p>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm tracking-[0.2em] text-on-surface">{form.form_id}</span>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(form.form_id)}
                                        className="rounded border border-outline-variant/20 bg-surface-container-low px-2 py-1 text-xs font-semibold text-on-surface hover:bg-surface-container-base transition"
                                    >
                                        Copy
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-xs font-bold text-outline uppercase tracking-widest mb-4">
                                <span>{form.questionCount} Questions</span>
                                <span>{form.responseCount} Responses</span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => router.push(`/dashboard/forms/${form.form_id}/edit`)}
                                    className="flex-1 px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:bg-primary/90 transition"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => router.push(`/dashboard/forms/${form.form_id}/responses`)}
                                    className="flex-1 px-4 py-2 bg-secondary-container text-on-secondary-container rounded-lg text-sm font-semibold hover:bg-secondary-container/90 transition"
                                >
                                    View Responses
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
            <footer className="border-t border-outline-variant/20 mt-auto py-8 text-center text-on-surface-variant text-sm z-10 bg-surface-container-lowest/50 backdrop-blur-sm">
                <p>FormFlow. Built for DMS project. 2026</p>
                <p>By Devdat, Pramukh, Pranav | NMAMIT - ISE C</p><br></br>
                <p>2026 | 4th Semester</p>
            </footer>
        </>
    );
}