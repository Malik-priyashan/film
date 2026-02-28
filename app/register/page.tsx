"use client";

import { useState } from "react";
import Link from "next/link";
import { registerUser } from "@/lib/authapi";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<unknown>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setResult(null);

    if (!fullName.trim() || !email.trim() || !password) {
      setError("Full name, email, and password are required.");
      return;
    }

    try {
      setLoading(true);
      const data = await registerUser({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-black via-red-950 to-black py-12 px-4">
      <div className="w-full max-w-md mx-auto bg-black/70 border border-red-500/30 rounded-3xl p-8 shadow-2xl shadow-red-900/50">
        <h1 className="text-3xl font-extrabold text-center mb-2 text-red-400">
          Register
        </h1>
        <p className="text-center text-gray-300 mb-8">
          Create your account to get started.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-red-300">Full name</label>
            <input
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-black/60 border border-red-900/50 text-white placeholder-gray-500 px-4 py-3 rounded-xl focus:outline-none focus:border-red-500"
              placeholder="Test User"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-red-300">Email</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/60 border border-red-900/50 text-white placeholder-gray-500 px-4 py-3 rounded-xl focus:outline-none focus:border-red-500"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-red-300">Password</label>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/60 border border-red-900/50 text-white placeholder-gray-500 px-4 py-3 rounded-xl focus:outline-none focus:border-red-500"
              placeholder="At least 8 characters"
            />
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-950/40 border border-red-500/30 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 rounded-full font-bold text-lg bg-linear-to-r from-red-600 via-red-500 to-red-600 text-white shadow-xl shadow-red-900/50 disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>

        {Boolean(result) && (
          <div className="mt-6 text-sm text-gray-200 bg-black/60 border border-red-900/40 rounded-xl p-4">
            <div className="font-semibold text-red-300 mb-2">Response</div>
            <pre className="whitespace-pre-wrap break-words text-xs">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <p className="text-center text-gray-300 mt-6 text-sm">
          Already have an account?{" "}
          <Link className="text-red-400 hover:text-red-300" href="/login">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
