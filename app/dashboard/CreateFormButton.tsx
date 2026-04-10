"use client";

import { useState } from "react";
import CreateFormModal from "@/app/components/CreateFormModal";

export default function CreateFormButton() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="w-full py-3 bg-gradient-to-r from-primary to-primary-container text-white rounded-lg font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all"
            >
                <span className="material-symbols-outlined text-sm">add</span>
                <span>Create New Form</span>
            </button>

            <CreateFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
}