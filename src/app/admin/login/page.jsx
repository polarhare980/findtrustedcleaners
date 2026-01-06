"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setMsg(data?.message || "Login failed");
        setLoading(false);
        return;
      }

      router.push("/admin/blog");
    } catch (err) {
      setMsg("Login error");
      setLoading(false);
    }
  };

  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-2">Admin Login</h1>
      <p className="text-gray-600 mb-8">Enter your admin password to manage blog posts.</p>

      <form onSubmit={onSubmit} className="space-y-4">
        <input
          type="password"
          className="w-full p-3 rounded-xl border"
          placeholder="Admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full p-3 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700 disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        {msg ? <p className="text-sm text-red-600">{msg}</p> : null}
      </form>
    </main>
  );
}
