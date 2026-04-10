import { createClient } from "@/utils/supabase";
import { notFound } from "next/navigation";
import FormBuilderClient from "@/app/components/FormBuilderClient";

export default async function FormEditPage({ params }: { params: Promise<{ code: string }> }) {
    const supabase = createClient();
    const { code: formId } = await params;

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

    //Fetch all existing questions, ordered correctly
    const { data: questions } = await supabase
        .from('questions')
        .select('*')
        .eq('form_id', formId)
        .order('order_num', { ascending: true });

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