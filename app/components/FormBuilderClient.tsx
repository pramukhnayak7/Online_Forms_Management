"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase";

// Defining the shapes of our database rows
type Form = { form_id: string; title: string; description: string };
type Question = {
    question_id: number;
    form_id: string;
    question_text: string;
    question_type: string;
    is_required: boolean;
    order_num: number;
};

export default function FormBuilderClient({ initialForm, initialQuestions }: { initialForm: Form, initialQuestions: Question[] }) {
    const [questions, setQuestions] = useState<Question[]>(initialQuestions);
    const [isAdding, setIsAdding] = useState(false);

    const supabase = createClient();
    const handleAddQuestion = async () => {
        setIsAdding(true);
        const nextOrderNum = questions.length + 1;

        const { data: newQuestion, error } = await supabase
            .from('questions')
            .insert([
                {
                    form_id: initialForm.form_id,
                    question_text: "Untitled Question",
                    question_type: "text",
                    is_required: false,
                }
            ])
            .select()
            .single();

        if (error) {
            console.error("Failed to add question:", error);
        } else if (newQuestion) {
            // Update the UI instantly
            setQuestions([...questions, newQuestion]);
        }
        setIsAdding(false);
    };

    const handleDeleteQuestion = async (questionId: number) => {
        // Optimistic UI update (remove it instantly for a snappy feel)
        setQuestions(questions.filter(q => q.question_id !== questionId));

        // Delete from database
        const { error } = await supabase
            .from('questions')
            .delete()
            .eq('question_id', questionId);

        if (error) console.error("Failed to delete:", error);
    };

    return (
        <div className="space-y-6">
            {/* Form Header Card */}
            <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm border-t-8 border-t-primary border-l border-r border-b border-outline-variant/20">
                <h1 className="text-4xl font-extrabold text-on-surface mb-4">{initialForm.title}</h1>
                {initialForm.description && (
                    <p className="text-on-surface-variant text-lg">{initialForm.description}</p>
                )}
            </div>

            {/* Questions List */}
            {questions.map((q, index) => (
                <div key={q.question_id} className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/20 flex flex-col gap-4 group">
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <input
                                type="text"
                                defaultValue={q.question_text}
                                className="w-full text-lg font-semibold bg-transparent border-b border-transparent focus:border-outline-variant focus:ring-0 px-0 transition-colors"
                                placeholder="Question Text"
                            />
                        </div>
                        {/* <select
                            defaultValue={q.question_type}
                            className="ml-4 bg-surface-container-high border-none rounded-lg text-sm focus:ring-primary focus:bg-surface-bright"
                        >
                            <option value="text">Short Answer</option>
                            <option value="long_text">Paragraph</option>
                            <option value="multiple_choice">Multiple Choice</option>
                        </select> */}
                    </div>

                    {/* Footer Actions for this question */}
                    <div className="flex justify-end items-center pt-4 border-t border-outline-variant/10 gap-4 opacity-50 group-hover:opacity-100 transition-opacity">
                        <label className="flex items-center gap-2 text-sm text-on-surface-variant font-medium cursor-pointer">
                            <input type="checkbox" defaultChecked={q.is_required} className="rounded text-primary focus:ring-primary" />
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

            {/* Floating Action Button for Adding Questions */}
            <div className="flex justify-center pt-4">
                <button
                    onClick={handleAddQuestion}
                    disabled={isAdding}
                    className="flex items-center gap-2 px-6 py-3 bg-secondary-container text-on-secondary-container font-bold rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span className="material-symbols-outlined">add</span>
                    {isAdding ? "Adding..." : "Add Question"}
                </button>
            </div>
        </div>
    );
}