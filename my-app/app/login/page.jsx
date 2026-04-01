"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const data = await login(form.email, form.password);
    setLoading(false);

    if (data.error) {
      setError(data.error);
    } else {
      localStorage.setItem("session_id", data.session_id);
      router.push("/dashboard");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#fbf8ff] p-6">
      <div className="w-full max-w-[440px]">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-extrabold tracking-tight mb-2 text-black">Online Forms Management System</h1>
          <h2 className="text-3xl font-bold mb-1 text-black">Welcome back</h2>
          <p className="text-gray-500">Please enter your details to sign in</p>
        </div>

        <div className="bg-white p-10 rounded-xl shadow-sm border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Email or Username
              </label>
              <input
                type="text"
                placeholder="name@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3.5 bg-gray-100 rounded-lg border-b-2 border-transparent focus:border-indigo-600 focus:outline-none transition-all text-black placeholder:text-gray-400"
                required
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Password
                </label>
                <a href="#" className="text-xs font-bold text-indigo-700 hover:underline">
                  Forgot password?
                </a>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-3.5 bg-gray-100 rounded-lg border-b-2 border-transparent focus:border-indigo-600 focus:outline-none transition-all text-black placeholder:text-gray-400"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-700 text-white font-bold py-4 rounded-lg hover:bg-indigo-800 transition-all disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-gray-500">
          Don't have an account?{" "}
          <a href="/signup" className="text-indigo-700 font-bold hover:underline ml-1">
            Create an account
          </a>
        </p>
      </div>
    </main>
  );
}