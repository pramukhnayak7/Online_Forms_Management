import { createClient } from "@/utils/supabase";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import FormBuilderClient from "@/app/components/FormBuilderClient";

export default async function FormEditPage({ params }: { params: Promise<{ code: string }> }) {
    const supabase = createClient();
    const { code: formId } = await params;
    const cookieStore = await cookies();
    const cookieUserId = cookieStore.get("formdb_user_id")?.value;
    const currentUserId = Number(cookieUserId);

    if (!cookieUserId || Number.isNaN(currentUserId)) {
        notFound();
    }

    //Fetch the Form Metadata
    const { data: form, error: formError } = await supabase
        .from('forms')
        .select('*')
        .eq('form_id', formId)
        .single();

    // If they typed a random code in the URL, throw a 404
    if (formError || !form) {
        notFound();
    }

    // Allow only the creator to access the edit page
    if (form.creator_id !== currentUserId) {
        notFound();
    }

    //Fetch all existing questions
    const { data: questions } = await supabase
        .from('questions')
        .select('*')
        .eq('form_id', formId);

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            {/* Pass the database rows directly into the interactive client! */}
            <FormBuilderClient
                initialForm={form}
                initialQuestions={questions || []}
            />
        </div>
    );
}