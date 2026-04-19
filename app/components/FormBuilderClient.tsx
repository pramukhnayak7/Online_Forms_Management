"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase";

// Defining the shapes of our database rows
type Form = { form_id: string; title: string; description: string | null };
type Question = {
    question_id: number;
    form_id: string;
    question_text: string;
    question_type: string;
    question_options?: string[];
    is_required: boolean;
};

type DraftQuestion = Omit<Question, "question_id"> & {
    question_id: number | string;
    isPersisted: boolean;
    newOptionText?: string;
};

export default function FormBuilderClient({ initialForm, initialQuestions }: { initialForm: Form, initialQuestions: Question[] }) {
    const [formTitle, setFormTitle] = useState(initialForm.title);
    const [formDescription, setFormDescription] = useState(initialForm.description ?? "");
    const [questions, setQuestions] = useState<DraftQuestion[]>(
        initialQuestions.map((q) => ({ ...q, question_options: q.question_options ?? [], isPersisted: true }))
    );
    const [newQuestionText, setNewQuestionText] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);

    const supabase = createClient();

    const updateQuestionInState = (questionId: number | string, updates: Partial<DraftQuestion>) => {
        setQuestions((prev) =>
            prev.map((q) => (q.question_id === questionId ? { ...q, ...updates } : q))
        );
    };

    const updateQuestionOption = (questionId: number | string, optionIndex: number, value: string) => {
        setQuestions((prev) =>
            prev.map((q) => {
                if (q.question_id !== questionId) return q;
                const options = [...(q.question_options ?? [])];
                options[optionIndex] = value;
                return { ...q, question_options: options };
            })
        );
    };

    const addOptionToQuestion = (questionId: number | string) => {
        setQuestions((prev) =>
            prev.map((q) => {
                if (q.question_id !== questionId) return q;
                const options = [...(q.question_options ?? []), q.newOptionText?.trim() || `Option ${((q.question_options ?? []).length || 0) + 1}`];
                return { ...q, question_options: options, newOptionText: "" };
            })
        );
    };

    const removeOptionFromQuestion = (questionId: number | string, optionIndex: number) => {
        setQuestions((prev) =>
            prev.map((q) => {
                if (q.question_id !== questionId) return q;
                const options = [...(q.question_options ?? [])];
                options.splice(optionIndex, 1);
                return { ...q, question_options: options };
            })
        );
    };

    const handleAddQuestion = () => {
        const text = newQuestionText.trim() || "Untitled Question";

        setQuestions((prev) => [
            ...prev,
            {
                question_id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                form_id: initialForm.form_id,
                question_text: text,
                question_type: "text",
                question_options: [],
                is_required: false,
                isPersisted: false,
                newOptionText: "",
            },
        ]);

        setNewQuestionText("");
        setSaveMessage(null);
    };

    const handleDeleteQuestion = async (questionId: number | string) => {
        const questionToDelete = questions.find((q) => q.question_id === questionId);
        setQuestions((prev) => prev.filter((q) => q.question_id !== questionId));
        setSaveMessage(null);

        if (!questionToDelete?.isPersisted) {
            return;
        }

        const { error } = await supabase
            .from('questions')
            .delete()
            .eq('question_id', Number(questionId));

        if (error) console.error("Failed to delete:", error);
    };

    const handleSaveQuestions = async () => {
        setIsSaving(true);
        setSaveMessage(null);

        const normalized = questions;

        const existing = normalized.filter((q) => q.isPersisted);
        const newOnes = normalized.filter((q) => !q.isPersisted);

        try {
            const { error: formUpdateError } = await supabase
                .from("forms")
                .update({
                    title: formTitle.trim() || initialForm.title,
                    description: formDescription.trim() || null,
                })
                .eq("form_id", initialForm.form_id);

            if (formUpdateError) {
                setSaveMessage(`Save failed: ${formUpdateError.message}`);
                setIsSaving(false);
                return;
            }

            const updateResults = await Promise.all(
                existing.map((q) =>
                    supabase
                        .from("questions")
                        .update({
                            question_text: q.question_text,
                            question_type: q.question_type,
                            question_options: q.question_options ?? [],
                            is_required: q.is_required,
                        })
                        .eq("question_id", Number(q.question_id))
                )
            );

            const updateError = updateResults.find((r) => r.error)?.error;
            if (updateError) {
                setSaveMessage(`Save failed: ${updateError.message}`);
                setIsSaving(false);
                return;
            }

            if (newOnes.length > 0) {
                const { error: insertError } = await supabase
                    .from("questions")
                    .insert(
                        newOnes.map((q) => ({
                            form_id: q.form_id,
                            question_text: q.question_text,
                            question_type: q.question_type,
                            question_options: q.question_options ?? [],
                            is_required: q.is_required,
                        }))
                    );

                if (insertError) {
                    setSaveMessage(`Save failed: ${insertError.message}`);
                    setIsSaving(false);
                    return;
                }
            }

            const { data: refreshed, error: refreshError } = await supabase
                .from("questions")
                .select("*")
                .eq("form_id", initialForm.form_id);

            if (refreshError) {
                setSaveMessage("Saved, but failed to refresh questions.");
                setIsSaving(false);
                return;
            }

            setQuestions((refreshed || []).map((q) => ({ ...q, isPersisted: true })));
            setSaveMessage("Questions saved.");
        } catch {
            setSaveMessage("Save failed due to an unexpected error.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Form Header Card */}
            <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm border-t-8 border-t-primary border-l border-r border-b border-outline-variant/20">
                <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full text-4xl font-extrabold text-on-surface mb-4 bg-transparent border-b border-transparent focus:border-outline-variant focus:ring-0 px-0"
                    placeholder="Form Title"
                />
                <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full text-on-surface-variant text-lg bg-transparent border-b border-transparent focus:border-outline-variant focus:ring-0 px-0 resize-none"
                    rows={2}
                    placeholder="Form Description (optional)"
                />
            </div>

            {/* Questions List */}
            {questions.map((q) => (
                <div key={q.question_id} className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/20 flex flex-col gap-4 group">
                            <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <input
                                type="text"
                                value={q.question_text}
                                onChange={(e) => updateQuestionInState(q.question_id, { question_text: e.target.value })}
                                className="w-full text-lg font-semibold bg-transparent border-b border-transparent focus:border-outline-variant focus:ring-0 px-0 transition-colors"
                                placeholder="Question Text"
                            />
                        </div>
                        <select
                            value={q.question_type}
                            onChange={(e) => updateQuestionInState(q.question_id, { question_type: e.target.value })}
                            className="ml-4 bg-surface-container-high border-none rounded-lg text-sm focus:ring-primary focus:bg-surface-bright"
                        >
                            <option value="text">Short Answer</option>
                            <option value="long_text">Paragraph</option>
                            <option value="multiple_choice">Multiple Choice</option>
                        </select>
                    </div>
                    {q.question_type === "multiple_choice" && (
                        <div className="space-y-3">
                            <div className="text-sm font-medium text-on-surface-variant">Options</div>
                            {(q.question_options ?? []).map((option, optionIndex) => (
                                <div key={`${q.question_id}-${optionIndex}`} className="flex items-center gap-3">
                                    <input
                                        type="text"
                                        value={option}
                                        onChange={(e) => updateQuestionOption(q.question_id, optionIndex, e.target.value)}
                                        className="flex-1 rounded-full border border-outline-variant/20 bg-surface-container-high px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/10"
                                        placeholder={`Option ${optionIndex + 1}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeOptionFromQuestion(q.question_id, optionIndex)}
                                        className="rounded-full p-2 text-error hover:bg-error-container/20 transition"
                                        aria-label="Remove option"
                                    >
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>
                            ))}
                            <div className="flex items-center gap-3">
                                <input
                                    type="text"
                                    value={q.newOptionText ?? ""}
                                    onChange={(e) => updateQuestionInState(q.question_id, { newOptionText: e.target.value })}
                                    className="flex-1 rounded-full border border-outline-variant/20 bg-surface-container-high px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/10"
                                    placeholder="Add new option"
                                />
                                <button
                                    type="button"
                                    onClick={() => addOptionToQuestion(q.question_id)}
                                    className="rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary/90 transition"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Footer Actions for this question */}
                    <div className="flex justify-end items-center pt-4 border-t border-outline-variant/10 gap-4 opacity-50 group-hover:opacity-100 transition-opacity">
                        <label className="flex items-center gap-2 text-sm text-on-surface-variant font-medium cursor-pointer">
                            <input
                                type="checkbox"
                                checked={q.is_required}
                                onChange={(e) => updateQuestionInState(q.question_id, { is_required: e.target.checked })}
                                className="rounded text-primary focus:ring-primary"
                            />
                            Required
                        </label>
                        <div className="w-px h-6 bg-outline-variant/30"></div>
                        <button
                            onClick={() => handleDeleteQuestion(q.question_id)}
                            className="text-error hover:bg-error-container p-2 rounded-full transition-colors flex items-center justify-center"
                            title="Delete Question"
                        >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                    </div>
                </div>
            ))}

            {/* Add Questions */}
            <div className="flex justify-center pt-4">
                <div className="w-full max-w-2xl flex gap-3">
                    <input
                        type="text"
                        value={newQuestionText}
                        onChange={(e) => setNewQuestionText(e.target.value)}
                        placeholder="Type a question"
                        className="flex-1 px-4 py-3 bg-surface-container-high border border-outline-variant/30 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                        onClick={handleAddQuestion}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-3 bg-secondary-container text-on-secondary-container font-bold rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="material-symbols-outlined">add</span>
                        Add Question
                    </button>
                </div>
            </div>

            <div className="flex justify-center">
                <button
                    onClick={handleSaveQuestions}
                    disabled={isSaving || questions.length === 0}
                    className="px-8 py-3 primary-gradient text-on-primary font-bold rounded-full shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSaving ? "Saving..." : "Save Questions"}
                </button>
            </div>

            {saveMessage && (
                <p className="text-center text-sm text-on-surface-variant">{saveMessage}</p>
            )}
        </div>
    );
}