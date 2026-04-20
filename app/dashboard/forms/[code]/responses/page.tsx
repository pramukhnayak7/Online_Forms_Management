import { createClient } from "@/utils/supabase";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import ExportCSVButton from "@/app/components/ExportCSVButton";

type FormRow = {
    form_id: string;
    title: string;
    description: string | null;
    creator_id: number;
};

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

type PageProps = {
    params: Promise<{ code: string }>;
};

export default async function FormResponsesPage({ params }: PageProps) {
    const supabase = createClient();
    const { code: formId } = await params;
    const cookieStore = await cookies();
    const cookieUserId = cookieStore.get("formdb_user_id")?.value;
    const currentUserId = Number(cookieUserId);

    if (!cookieUserId || Number.isNaN(currentUserId)) {
        notFound();
    }

    const { data: form, error: formError } = await supabase
        .from("forms")
        .select("form_id, title, description, creator_id")
        .eq("form_id", formId)
        .single<FormRow>();

    if (formError || !form) {
        notFound();
    }

    if (form.creator_id !== currentUserId) {
        notFound();
    }

    const [{ data: questions }, { data: responses }] = await Promise.all([
        supabase
            .from("questions")
            .select("question_id, question_text, question_type, is_required")
            .eq("form_id", formId)
            .order("question_id", { ascending: true }),
        supabase
            .from("responses")
            .select("response_id, user_id, submitted_at")
            .eq("form_id", formId)
            .order("submitted_at", { ascending: false }),
    ]);

    const responseRows = (responses ?? []) as ResponseRow[];
    const questionRows = (questions ?? []) as QuestionRow[];

    const responseIds = responseRows.map((response) => response.response_id);
    const userIds = Array.from(new Set(responseRows.map((response) => response.user_id)));

    const [{ data: answers }, { data: users }] = await Promise.all([
        responseIds.length > 0
            ? supabase
                .from("answers")
                .select("response_id, question_id, answer_text")
                .in("response_id", responseIds)
            : Promise.resolve({ data: [] as AnswerRow[] }),
        userIds.length > 0
            ? supabase
                .from("users")
                .select("user_id, username, name")
                .in("user_id", userIds)
            : Promise.resolve({ data: [] as UserRow[] }),
    ]);

    const answerRows = (answers ?? []) as AnswerRow[];
    const userRows = (users ?? []) as UserRow[];

    const answerMap = new Map<string, string>();
    for (const answer of answerRows) {
        answerMap.set(`${answer.response_id}:${answer.question_id}`, answer.answer_text ?? "");
    }

    const userMap = new Map<number, UserRow>();
    for (const user of userRows) {
        userMap.set(user.user_id, user);
    }

    return (
        <main className="min-h-screen bg-surface px-6 py-10 text-on-surface">
            <div className="mx-auto max-w-7xl space-y-8">
                <section className="overflow-hidden rounded-[2rem] border border-outline-variant/15 bg-surface-container-lowest shadow-[0_24px_48px_-20px_rgba(26,27,34,0.12)]">
                    <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_280px]">
                        <div className="p-8 md:p-10 lg:p-12">
                            <div className="mb-6 flex flex-wrap items-center gap-3">
                                <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-primary">
                                    <span className="material-symbols-outlined text-[16px]">inbox</span>
                                    Responses
                                </span>
                            </div>

                            <h1 className="text-4xl font-extrabold tracking-tight text-on-surface md:text-5xl">{form.title}</h1>
                            {form.description && <p className="mt-5 max-w-3xl text-base leading-7 text-on-surface-variant md:text-lg">{form.description}</p>}

                            <div className="mt-8 flex flex-wrap gap-3 text-sm text-on-surface-variant">
                                <div className="rounded-full border border-outline-variant/15 bg-surface-container-high px-4 py-2 font-semibold">
                                    {responseRows.length} Responses
                                </div>
                                <div className="rounded-full border border-outline-variant/15 bg-surface-container-high px-4 py-2 font-semibold">
                                    {questionRows.length} Questions
                                </div>
                                <div className="rounded-full border border-outline-variant/15 bg-surface-container-high px-4 py-2 font-semibold">
                                    Code: <span className="font-mono text-on-surface">{form.form_id}</span>
                                </div>
                            </div>
                        </div>

                        <aside className="border-t border-outline-variant/15 bg-surface-container-low p-8 lg:border-l lg:border-t-0">
                            <div className="sticky top-8 space-y-4">
                                <div className="rounded-[1.5rem] bg-surface-container-high p-5">
                                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-on-surface-variant">Submissions</p>
                                    <div className="mt-3 text-4xl font-black tracking-tight text-on-surface">{responseRows.length}</div>
                                    <p className="mt-2 text-sm text-on-surface-variant">All responses for this form are listed below, newest first.</p>
                                </div>

                                <ExportCSVButton
                                    questions={questionRows}
                                    responses={responseRows}
                                    answers={answerRows}
                                    users={userRows}
                                    formTitle={form.title}
                                />

                                <Link
                                    href="/dashboard"
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-3xl border border-outline-variant/15 bg-surface-container-high px-5 py-3 text-sm font-semibold text-on-surface transition hover:bg-surface-container-base"
                                >
                                    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                                    Back to dashboard
                                </Link>
                            </div>
                        </aside>
                    </div>
                </section>

                {responseRows.length === 0 ? (
                    <div className="rounded-[2rem] border border-outline-variant/15 bg-surface-container-lowest p-10 text-center shadow-sm">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <span className="material-symbols-outlined text-[28px]">drafts</span>
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight text-on-surface">No responses yet</h2>
                        <p className="mt-3 text-on-surface-variant">Once users submit this form, their answers will appear here.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {responseRows.map((response, index) => {
                            const respondent = userMap.get(response.user_id);

                            return (
                                <section key={response.response_id} className="overflow-hidden rounded-[2rem] border border-outline-variant/15 bg-surface-container-lowest shadow-sm">
                                    <div className="flex flex-col gap-4 border-b border-outline-variant/15 p-6 md:flex-row md:items-start md:justify-between">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-3">
                                                <h2 className="text-xl font-bold tracking-tight text-on-surface">Response {responseRows.length - index}</h2>
                                                <span className="rounded-full border border-outline-variant/15 bg-surface-container-high px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                                                    ID {response.response_id}
                                                </span>
                                            </div>
                                            <p className="mt-2 text-sm text-on-surface-variant">
                                                Submitted by {respondent?.name || respondent?.username || `User ${response.user_id}`}
                                            </p>
                                        </div>
                                        <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-high px-4 py-3 text-sm font-semibold text-on-surface-variant">
                                            {new Date(response.submitted_at).toLocaleString()}
                                        </div>
                                    </div>

                                    <div className="grid gap-4 p-6">
                                        {questionRows.map((question) => {
                                            const answer = answerMap.get(`${response.response_id}:${question.question_id}`) || "No answer provided";

                                            return (
                                                <div key={question.question_id} className="rounded-[1.5rem] border border-outline-variant/15 bg-surface-container-low p-5">
                                                    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-on-surface">{question.question_text}</p>
                                                            {question.is_required && <p className="text-xs text-on-surface-variant">Required question</p>}
                                                        </div>
                                                        <span className="self-start rounded-full border border-outline-variant/15 bg-surface-container-high px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                                                            {question.question_type === "long_text" ? "Paragraph" : "Answer"}
                                                        </span>
                                                    </div>
                                                    <div className="whitespace-pre-wrap rounded-2xl border border-outline-variant/15 bg-surface-container-high px-4 py-3 text-sm leading-6 text-on-surface-variant">
                                                        {answer}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}