"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase";

// Defining the shapes of our database rows
type Form = { form_id: string; title: string; description: string | null; design_code?: any };
type Question = {
    question_id: number;
    form_id: string;
    question_text: string;
    question_type: string;
    is_required: boolean;
};

type DraftQuestion = Omit<Question, "question_id"> & {
    question_id: number | string;
    isPersisted: boolean;
};

export default function FormBuilderClient({ initialForm, initialQuestions }: { initialForm: Form, initialQuestions: Question[] }) {
    const [formTitle, setFormTitle] = useState(initialForm.title);
    const [formDescription, setFormDescription] = useState(initialForm.description ?? "");
    const [designCode, setDesignCode] = useState<Record<string, string | null>>(initialForm.design_code || {});
    const [questions, setQuestions] = useState<DraftQuestion[]>(
        initialQuestions.map((q) => ({ ...q, isPersisted: true }))
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

    const handleAddQuestion = () => {
        const text = newQuestionText.trim() || "Untitled Question";

        setQuestions((prev) => [
            ...prev,
            {
                question_id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                form_id: initialForm.form_id,
                question_text: text,
                question_type: "text",
                is_required: false,
                isPersisted: false,
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
            const updateResults = await Promise.all(
                existing.map((q) =>
                    supabase
                        .from("questions")
                        .update({
                            question_text: q.question_text,
                            question_type: q.question_type,
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

            let finalDesignCode = { ...designCode };

            if (newOnes.length > 0) {
                const { data: insertedQuestions, error: insertError } = await supabase
                    .from("questions")
                    .insert(
                        newOnes.map((q) => ({
                            form_id: q.form_id,
                            question_text: q.question_text,
                            question_type: q.question_type,
                            is_required: q.is_required,
                        }))
                    )
                    .select();

                if (insertError) {
                    setSaveMessage(`Save failed: ${insertError.message}`);
                    setIsSaving(false);
                    return;
                }

                if (insertedQuestions) {
                    newOnes.forEach((tempQ, index) => {
                        const realId = insertedQuestions[index].question_id;
                        if (finalDesignCode[tempQ.question_id]) {
                            finalDesignCode[realId] = finalDesignCode[tempQ.question_id];
                            delete finalDesignCode[tempQ.question_id];
                        }
                    });
                }
            }

            const { error: formUpdateError } = await supabase
                .from("forms")
                .update({
                    title: formTitle.trim() || initialForm.title,
                    description: formDescription.trim() || null,
                    design_code: finalDesignCode
                })
                .eq("form_id", initialForm.form_id);

            if (formUpdateError) {
                setSaveMessage(`Save failed: ${formUpdateError.message}`);
                setIsSaving(false);
                return;
            }
            
            setDesignCode(finalDesignCode);

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
                <div key={q.question_id} style={designCode[q.question_id] ? { backgroundColor: designCode[q.question_id] as string } : {}} className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/20 flex flex-col gap-4 group transition-colors">
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

                    {/* Footer Actions for this question */}
                    <div className="flex justify-between items-center pt-4 border-t border-outline-variant/10 gap-4 opacity-50 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setDesignCode(prev => ({ ...prev, [q.question_id]: '' }))}
                                className={`w-6 h-6 rounded-full border-2 ${!designCode[q.question_id] ? 'border-primary' : 'border-transparent'} bg-surface-container-high hover:scale-110 transition`}
                                title="Default"
                                type="button"
                            />
                            <button
                                onClick={() => setDesignCode(prev => ({ ...prev, [q.question_id]: '#e0f2fe' }))}
                                className={`w-6 h-6 rounded-full border-2 ${designCode[q.question_id] === '#e0f2fe' ? 'border-primary' : 'border-transparent'} bg-[#e0f2fe] hover:scale-110 transition`}
                                title="Light Blue"
                                type="button"
                            />
                            <button
                                onClick={() => setDesignCode(prev => ({ ...prev, [q.question_id]: '#dcfce7' }))}
                                className={`w-6 h-6 rounded-full border-2 ${designCode[q.question_id] === '#dcfce7' ? 'border-primary' : 'border-transparent'} bg-[#dcfce7] hover:scale-110 transition`}
                                title="Light Green"
                                type="button"
                            />
                            <button
                                onClick={() => setDesignCode(prev => ({ ...prev, [q.question_id]: '#fef9c3' }))}
                                className={`w-6 h-6 rounded-full border-2 ${designCode[q.question_id] === '#fef9c3' ? 'border-primary' : 'border-transparent'} bg-[#fef9c3] hover:scale-110 transition`}
                                title="Light Yellow"
                                type="button"
                            />
                            <button
                                onClick={() => setDesignCode(prev => ({ ...prev, [q.question_id]: '#f3f4f6' }))}
                                className={`w-6 h-6 rounded-full border-2 ${designCode[q.question_id] === '#f3f4f6' ? 'border-primary' : 'border-transparent'} bg-[#f3f4f6] hover:scale-110 transition`}
                                title="Light Gray"
                                type="button"
                            />
                        </div>
                        <div className="flex items-center gap-4">
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