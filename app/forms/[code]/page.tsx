"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase";

type FormRow = {
  form_id: string;
  title: string;
  description: string | null;
};

type QuestionRow = {
  question_id: number;
  question_text: string;
  question_type: string;
  question_options?: string[];
  is_required: boolean;
};

type StoredUser = {
  user_id: number;
  username: string;
  name: string;
};

export default function FormAnswerPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [form, setForm] = useState<FormRow | null>(null);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  const normalizedCode = useMemo(() => {
    const code = pathname?.split("/").filter(Boolean).pop();
    return code ? code.trim().toUpperCase() : "";
  }, [pathname]);

  useEffect(() => {
    async function loadForm() {
      setIsLoading(true);
      setErrorMessage(null);

      const stored = localStorage.getItem("formdb_user");
      if (!stored) {
        router.replace(`/login?next=/forms/${encodeURIComponent(normalizedCode)}`);
        return;
      }

      let currentUser: StoredUser;
      try {
        currentUser = JSON.parse(stored) as StoredUser;
      } catch {
        router.replace(`/login?next=/forms/${encodeURIComponent(normalizedCode)}`);
        return;
      }

      const { data: formData, error: formError } = await supabase
        .from("forms")
        .select("form_id, title, description")
        .eq("form_id", normalizedCode)
        .single();

      if (formError || !formData) {
        setErrorMessage("That form code does not exist.");
        setIsLoading(false);
        return;
      }

      const { data: questionData, error: questionsError } = await supabase
        .from("questions")
        .select("question_id, question_text, question_type, question_options, is_required")
        .eq("form_id", normalizedCode)
        .order("question_id", { ascending: true });

      if (questionsError) {
        setErrorMessage("Unable to load form questions.");
        setIsLoading(false);
        return;
      }

      const { data: responseRow, error: responseError } = await supabase
        .from("responses")
        .select("response_id")
        .eq("form_id", normalizedCode)
        .eq("user_id", currentUser.user_id)
        .single();

      if (!responseError && responseRow) {
        setAlreadySubmitted(true);

        const { data: answerRows, error: answersError } = await supabase
          .from("answers")
          .select("question_id, answer_text")
          .eq("response_id", responseRow.response_id);

        if (!answersError && answerRows) {
          const loadedAnswers = (answerRows as { question_id: number; answer_text: string }[]).reduce(
            (acc, row) => ({ ...acc, [row.question_id]: row.answer_text ?? "" }),
            {} as Record<number, string>
          );
          setAnswers(loadedAnswers);
        }
      }

      setForm(formData as FormRow);
      setQuestions((questionData ?? []) as QuestionRow[]);
      setIsLoading(false);
    }

    loadForm();
  }, [normalizedCode, router, supabase]);

  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (alreadySubmitted) {
      setErrorMessage("You have already submitted this form.");
      return;
    }

    const stored = localStorage.getItem("formdb_user");
    if (!stored) {
      router.replace(`/login?next=/forms/${encodeURIComponent(normalizedCode)}`);
      return;
    }

    let currentUser: StoredUser;
    try {
      currentUser = JSON.parse(stored) as StoredUser;
    } catch {
      router.replace(`/login?next=/forms/${encodeURIComponent(normalizedCode)}`);
      return;
    }

    for (const question of questions) {
      if (question.is_required && !answers[question.question_id]?.trim()) {
        setErrorMessage("Please answer all required questions before submitting.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const { data: responseData, error: responseError } = await supabase
        .from("responses")
        .insert([
          {
            form_id: normalizedCode,
            user_id: currentUser.user_id,
          },
        ])
        .select("response_id")
        .single();

      if (responseError) {
        if (responseError.code === "23505") {
          setAlreadySubmitted(true);
          setErrorMessage("You have already submitted this form.");
        } else {
          setErrorMessage(responseError.message || "Failed to submit your response.");
        }
        setIsSubmitting(false);
        return;
      }

      const responseId = responseData?.response_id;
      if (!responseId) {
        setErrorMessage("Unable to save your response.");
        setIsSubmitting(false);
        return;
      }

      const answerPayload = questions.map((question) => ({
        response_id: responseId,
        question_id: question.question_id,
        answer_text: answers[question.question_id] ?? "",
      }));

      const { error: answersError } = await supabase
        .from("answers")
        .insert(answerPayload);

      if (answersError) {
        setErrorMessage(answersError.message || "Failed to save answer details.");
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage("Response submitted successfully.");
      setAlreadySubmitted(true);
    } catch (error) {
      console.error(error);
      setErrorMessage("An unexpected error occurred while submitting.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen py-16 px-6 bg-surface text-on-surface">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-lg text-on-surface-variant">Loading form...</p>
        </div>
      </main>
    );
  }

  if (errorMessage && !form) {
    return (
      <main className="min-h-screen py-16 px-6 bg-surface text-on-surface">
        <div className="max-w-4xl mx-auto rounded-3xl bg-surface-container-lowest border border-outline-variant/20 p-10 text-center">
          <p className="text-xl font-semibold mb-4">Unable to open this form</p>
          <p className="text-on-surface-variant mb-8">{errorMessage}</p>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="px-6 py-3 primary-gradient text-on-primary rounded-full font-semibold"
          >
            Back to dashboard
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-16 px-6 bg-surface text-on-surface">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="rounded-3xl bg-surface-container-lowest border border-outline-variant/15 p-10 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary/80 mb-2">Form Code</p>
              <h1 className="text-4xl font-extrabold tracking-tight">{form?.title}</h1>
              {form?.description && <p className="mt-4 text-on-surface-variant">{form.description}</p>}
            </div>
            <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-high p-4 text-sm font-semibold text-on-surface-variant w-full sm:w-auto">
              <p className="text-[10px] uppercase tracking-[0.28em] mb-2 text-on-surface-variant">Share this code</p>
              <div className="flex items-center gap-3">
                <span className="font-mono text-lg tracking-[0.28em] text-on-surface">{normalizedCode}</span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(normalizedCode)}
                  className="rounded-full border border-outline-variant/20 bg-surface-container-low px-3 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container-base transition"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>

        {alreadySubmitted && (
          <div className="rounded-3xl border border-amber-300/30 bg-amber-50/80 p-6 text-amber-900">
            <p className="font-semibold">You have already submitted this form.</p>
            <p className="text-sm text-amber-700/90">Your previous response is recorded and additional submissions are not allowed. Your answers are shown below in read-only mode.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMessage && (
            <div className="rounded-3xl border border-error/20 bg-error-container p-4 text-on-error-container">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="rounded-3xl border border-primary/20 bg-primary/10 p-4 text-primary">
              {successMessage}
            </div>
          )}

          {questions.length === 0 ? (
            <div className="rounded-3xl border border-outline-variant/15 bg-surface-container-low p-8 text-on-surface-variant">
              No questions have been added to this form yet.
            </div>
          ) : (
            questions.map((question) => {
              const value = answers[question.question_id] ?? "";
              return (
                <div key={question.question_id} className="rounded-3xl border border-outline-variant/15 bg-surface-container-low p-6">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                      <p className="text-base font-semibold">{question.question_text}</p>
                      {question.is_required && <p className="text-xs text-on-surface-variant">Required</p>}
                    </div>
                    <span className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">{question.question_type === "long_text" ? "Paragraph" : question.question_type === "multiple_choice" ? "Multiple Choice" : "Short Answer"}</span>
                  </div>
                  {question.question_type === "long_text" ? (
                    <textarea
                      value={value}
                      onChange={(event) => handleAnswerChange(question.question_id, event.target.value)}
                      rows={4}
                      className="w-full rounded-3xl border border-outline-variant/15 bg-surface-container-high px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                      placeholder="Type your answer here"
                      disabled={alreadySubmitted}
                    />
                  ) : question.question_type === "multiple_choice" ? (
                    <div className="space-y-3">
                      {question.question_options && question.question_options.length > 0 ? (
                        question.question_options.map((option) => (
                          <label key={`${question.question_id}-${option}`} className="flex items-center gap-3 rounded-3xl border border-outline-variant/15 bg-surface-container-high px-4 py-3 cursor-pointer">
                            <input
                              type="radio"
                              name={`question-${question.question_id}`}
                              value={option}
                              checked={value === option}
                              onChange={(event) => handleAnswerChange(question.question_id, event.target.value)}
                              disabled={alreadySubmitted}
                              className="h-4 w-4 text-primary focus:ring-primary"
                            />
                            <span className="text-base">{option}</span>
                          </label>
                        ))
                      ) : (
                        <p className="text-sm text-on-surface-variant">No options have been added for this question yet.</p>
                      )}
                    </div>
                  ) : (
                    <input
                      value={value}
                      onChange={(event) => handleAnswerChange(question.question_id, event.target.value)}
                      className="w-full rounded-3xl border border-outline-variant/15 bg-surface-container-high px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                      placeholder="Type your answer here"
                      disabled={alreadySubmitted}
                    />
                  )}
                </div>
              );
            })
          )}

          <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="rounded-3xl border border-outline-variant/15 bg-surface-container-high px-6 py-3 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-base transition"
            >
              Back to dashboard
            </button>
            <button
              type="submit"
              disabled={isSubmitting || alreadySubmitted || questions.length === 0}
              className="rounded-3xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Submitting..." : alreadySubmitted ? "Already Submitted" : "Submit Response"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
