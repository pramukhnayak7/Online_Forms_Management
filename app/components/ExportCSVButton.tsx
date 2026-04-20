'use client';

import { useState } from 'react';

type QuestionRow = {
    question_id: number;
    question_text: string;
    question_type: string;
    is_required: boolean;
};

type ResponseRow = {
    response_id: number;
    user_id: number;
    submitted_at: string;
};

type AnswerRow = {
    response_id: number;
    question_id: number;
    answer_text: string | null;
};

type UserRow = {
    user_id: number;
    username: string;
    name: string | null;
};

type Props = {
    questions: QuestionRow[];
    responses: ResponseRow[];
    answers: AnswerRow[];
    users: UserRow[];
    formTitle: string;
};

export default function ExportCSVButton({ questions, responses, answers, users, formTitle }: Props) {
    const handleExport = () => {
        // Create maps for quick lookup
        const answerMap = new Map<string, string>();
        for (const answer of answers) {
            answerMap.set(`${answer.response_id}:${answer.question_id}`, answer.answer_text ?? '');
        }

        const userMap = new Map<number, UserRow>();
        for (const user of users) {
            userMap.set(user.user_id, user);
        }

        // CSV headers: question texts + Submitted At + Respondent
        const headers = questions.map(q => q.question_text).concat(['Submitted At', 'Respondent']);

        // CSV rows: one per response
        const rows = responses.map(response => {
            const row = questions.map(q => {
                return answerMap.get(`${response.response_id}:${q.question_id}`) || '';
            });
            const user = userMap.get(response.user_id);
            const respondent = user?.name || user?.username || `User ${response.user_id}`;
            row.push(response.submitted_at, respondent);
            return row;
        });

        // Generate CSV content with proper escaping
        const csvContent = [headers, ...rows]
            .map(row => 
                row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
            )
            .join('\n');

        // Create and trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${formTitle.replace(/[^a-zA-Z0-9]/g, '_')}_responses.csv`;
        link.click();
    };

    return (
        <button
            onClick={handleExport}
            className="inline-flex w-full items-center justify-center gap-2 rounded-3xl border border-outline-variant/15 bg-primary px-5 py-3 text-sm font-semibold text-on-primary transition hover:bg-primary/90"
        >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export as CSV
        </button>
    );
}