"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; // Added for redirection
import { createClient } from "@/utils/supabase"; // Added your Supabase client

export default function RegisterForm() {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const router = useRouter();
    const supabase = createClient();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);
        setErrorMessage(null); // Clear old errors

        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        const username = formData.get("username") as string;
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const confirm = formData.get("confirm") as string;
        if (confirm !== password) {
            setErrorMessage("Please re-try with correct password");
            setIsLoading(false);
            return;
        }

        try {
            //New users insertion
            const { data: newUser, error } = await supabase
                .from('users')
                .insert([
                    {
                        name: name,
                        username: username,
                        email: email,
                        password: password
                    }
                ])
                .select() //Supabase to return the newly created row
                .single();

            //DB Errors
            if (error) {

                if (error.code === '23505') {
                    setErrorMessage("An account with that email or username already exists.");
                } else {
                    setErrorMessage(error.message || "Failed to create account.");
                }
                setIsLoading(false);
                return;
            }

            // Success
            if (newUser) {
                document.cookie = "formdb_session=active; Path=/; Max-Age=604800; SameSite=Lax";
                document.cookie = `formdb_user_id=${newUser.user_id}; Path=/; Max-Age=604800; SameSite=Lax`;
                localStorage.setItem('formdb_user', JSON.stringify({
                    user_id: newUser.user_id,
                    username: newUser.username,
                    name: newUser.name
                }));

                // Redirect to dashboard
                router.push("/dashboard");
            }

        } catch (err) {
            console.error("Registration Error:", err);
            setErrorMessage("An unexpected error occurred.");
            setIsLoading(false);
        }
    }
    return (
        <div className="w-full max-w-[440px] z-10">
            {/* Branding */}
            <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 mb-6">
                    <div className="w-10 h-10 rounded-lg primary-gradient flex items-center justify-center shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined text-white text-2xl">
                            architecture
                        </span>
                    </div>
                    <h1 className="text-2xl font-extrabold tracking-tight">
                        FormFlow
                    </h1>
                </div>
                <h2 className="text-3xl font-bold tracking-tight mb-2">Create an account</h2>
                <p className="text-on-surface-variant">Sign up to get started</p>
            </div>
            {/* Error Message*/}
            {errorMessage && (
                <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-lg border border-error/20 flex items-center gap-3">
                    <span className="material-symbols-outlined text-error">error</span>
                    <span className="text-sm font-medium">{errorMessage}</span>
                </div>
            )}
            {/* Card */}
            <div className="bg-surface-container-lowest p-10 rounded-xl shadow-[0_24px_48px_-12px_rgba(26,27,34,0.04)] border border-outline-variant/15">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Full Name */}
                    <div className="space-y-1.5">
                        <label
                            htmlFor="name"
                            className="text-xs font-bold uppercase tracking-wider text-on-surface-variant px-1"
                        >
                            Full Name
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
                                <span className="material-symbols-outlined text-[20px]">person</span>
                            </div>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                placeholder="John Doe"
                                autoComplete="given-name"
                                suppressHydrationWarning
                                className="w-full pl-11 pr-4 py-3.5 bg-surface-container-high border-0 border-b-2 border-transparent focus:border-primary focus:ring-0 rounded-t-lg transition-all text-on-surface placeholder:text-outline/60"
                                required
                            />
                        </div>
                    </div>

                    {/* Username */}
                    <div className="space-y-1.5">
                        <label
                            htmlFor="username"
                            className="text-xs font-bold uppercase tracking-wider text-on-surface-variant px-1"
                        >
                            Username
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
                                <span className="material-symbols-outlined text-[20px]">account_circle</span>
                            </div>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                placeholder="johndoe12"
                                autoComplete="username"
                                suppressHydrationWarning
                                className="w-full pl-11 pr-4 py-3.5 bg-surface-container-high border-0 border-b-2 border-transparent focus:border-primary focus:ring-0 rounded-t-lg transition-all text-on-surface placeholder:text-outline/60"
                                required
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                        <label
                            htmlFor="email"
                            className="text-xs font-bold uppercase tracking-wider text-on-surface-variant px-1"
                        >
                            Email Address
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
                                <span className="material-symbols-outlined text-[20px]">mail</span>
                            </div>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="name@company.com"
                                autoComplete="email"
                                suppressHydrationWarning
                                className="w-full pl-11 pr-4 py-3.5 bg-surface-container-high border-0 border-b-2 border-transparent focus:border-primary focus:ring-0 rounded-t-lg transition-all text-on-surface placeholder:text-outline/60"
                                required
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                        <label
                            htmlFor="password"
                            className="text-xs font-bold uppercase tracking-wider text-on-surface-variant px-1"
                        >
                            Password
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
                                <span className="material-symbols-outlined text-[20px]">lock</span>
                            </div>
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                autoComplete="new-password"
                                suppressHydrationWarning
                                className="w-full pl-11 pr-12 py-3.5 bg-surface-container-high border-0 border-b-2 border-transparent focus:border-primary focus:ring-0 rounded-t-lg transition-all text-on-surface placeholder:text-outline/60"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-on-surface-variant hover:text-on-surface"
                            >
                                <span className="material-symbols-outlined text-[20px]">
                                    {showPassword ? "visibility_off" : "visibility"}
                                </span>
                            </button>
                        </div>

                    </div>
                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                        <label
                            htmlFor="confirm"
                            className="text-xs font-bold uppercase tracking-wider text-on-surface-variant px-1"
                        >
                            Confirm Password
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
                                <span className="material-symbols-outlined text-[20px]">lock</span>
                            </div>
                            <input
                                id="confirm"
                                name="confirm"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                autoComplete="new-password"
                                suppressHydrationWarning
                                className="w-full pl-11 pr-12 py-3.5 bg-surface-container-high border-0 border-b-2 border-transparent focus:border-primary focus:ring-0 rounded-t-lg transition-all text-on-surface placeholder:text-outline/60"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-on-surface-variant hover:text-on-surface"
                            >
                                <span className="material-symbols-outlined text-[20px]">
                                    {showPassword ? "visibility_off" : "visibility"}
                                </span>
                            </button>
                        </div>

                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full primary-gradient text-on-primary font-bold py-4 rounded-lg shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-[0.98] mt-4 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                                Creating account...
                            </>
                        ) : (
                            "Create Account"
                        )}
                    </button>
                </form>
            </div>

            <p className="mt-8 text-center text-on-surface-variant">
                Already have an account?{" "}
                <Link
                    href="/login"
                    className="text-primary font-bold hover:text-primary-container transition-colors ml-1"
                >
                    Sign In
                </Link>
            </p>
        </div>
    );
}
