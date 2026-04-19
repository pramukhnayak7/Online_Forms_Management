"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { createClient } from "@/utils/supabase";
import { generateShareCode } from "@/utils/generateCode";

interface CreateFormModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CreateFormModal({ isOpen, onClose }: CreateFormModalProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        setMounted(true);
    }, []);

    // Helper to read our custom cookie
    const getUserIdFromCookie = () => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; formdb_user_id=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return null;
    };

    const getUserId = () => {
        const cookieUserId = getUserIdFromCookie();
        if (cookieUserId) return cookieUserId;

        const stored = localStorage.getItem("formdb_user");
        if (!stored) return null;

        try {
            const parsed = JSON.parse(stored) as { user_id?: number };
            if (typeof parsed.user_id === "number") {
                return String(parsed.user_id);
            }
            return null;
        } catch {
            return null;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const userId = getUserId();

        if (!userId) {
            setError("Authentication error. Please log in again.");
            setIsLoading(false);
            return;
        }

        const newFormId = generateShareCode(); // e.g., 'A1B2C3'

        // 1. Insert into our custom forms table
        const { error: dbError } = await supabase
            .from('forms')
            .insert([
                {
                    form_id: newFormId,
                    creator_id: parseInt(userId),
                    title: title,
                    description: description
                }
            ]);

        if (dbError) {
            console.error("DB Error:", dbError);
            setError(dbError.message);
            setIsLoading(false);
            return;
        }

        // 2. Success! Close the modal first, then redirect to the builder page.
        setIsLoading(false);
        onClose();
        router.push(`/dashboard/forms/${newFormId}/edit`);
    };

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-outline-variant/20 animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low">
                    <h3 className="text-xl font-bold text-on-surface">Create New Form</h3>
                    <button
                        onClick={onClose}
                        className="text-on-surface-variant hover:text-on-surface rounded-full p-1 transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-3 bg-error-container text-on-error-container text-sm rounded-lg flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">error</span>
                            {error}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant px-1">
                            Form Title
                        </label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Database Feedback Survey"
                            className="w-full px-4 py-3 bg-surface-container-high border-0 border-b-2 border-transparent focus:border-primary focus:ring-0 rounded-t-lg transition-all text-on-surface"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant px-1">
                            Description (Optional)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What is this form for?"
                            rows={3}
                            className="w-full px-4 py-3 bg-surface-container-high border-0 border-b-2 border-transparent focus:border-primary focus:ring-0 rounded-t-lg transition-all text-on-surface resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-5 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !title.trim()}
                            className="px-5 py-2.5 text-sm font-bold primary-gradient text-on-primary rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-70 flex items-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                                    Creating...
                                </>
                            ) : (
                                "Create Form"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}