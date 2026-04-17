import Link from "next/link";

export default function CreateFormPage() {
  return (
    <main className="min-h-screen bg-surface text-on-surface p-8">
      <div className="max-w-3xl mx-auto rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-10 shadow-sm">
        <h1 className="text-4xl font-bold mb-4">Create a New Form</h1>
        <p className="text-on-surface-variant mb-8">
          Use the dashboard button to open the form creation modal and start building your form.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-3xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:shadow-xl transition"
        >
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
