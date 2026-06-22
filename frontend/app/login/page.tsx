"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

const Logo = () => (
  <div className="flex items-center gap-2 justify-center mb-8">
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center"
      style={{ background: "linear-gradient(135deg, #0ea5e9, #0284c7)", boxShadow: "0 0 24px rgba(14,165,233,0.4)" }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    </div>
    <span className="font-bold text-xl" style={{ color: "var(--text-primary)" }}>
      Med<span className="gradient-text">Verify</span>
    </span>
  </div>
);

const EyeIcon = ({ show }: { show: boolean }) =>
  show ? (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  ) : (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/login", { email: email.toLowerCase(), password });
      const { access_token, user } = res.data;
      login(access_token, user);
      // Role-based redirect
      if (user.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/chat");
      }
    } catch {
      // Generic message — never reveal which field was wrong
      setError("Incorrect email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: "var(--background)" }}
    >
      <div className="hero-glow fixed inset-0 pointer-events-none" />
      <div className="w-full max-w-md relative z-10">
        <Link href="/" className="block">
          <Logo />
        </Link>

        <div className="glass rounded-2xl p-8" style={{ boxShadow: "0 24px 80px rgba(14,165,233,0.1)" }}>
          <h1
            className="text-2xl font-bold mb-1 text-center"
            style={{ color: "var(--text-primary)" }}
          >
            Welcome back
          </h1>
          <p className="text-sm text-center mb-7" style={{ color: "var(--text-muted)" }}>
            Log in to your MedVerify account
          </p>

          {error && (
            <div
              className="mb-5 p-3 rounded-lg text-sm flex items-center gap-2"
              style={{
                background: "var(--danger-dim)",
                color: "var(--danger)",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="you@hospital.com"
                autoComplete="email"
                className="input-field"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Password
                </label>
                <a href="#" className="text-xs" style={{ color: "var(--primary)" }}>
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="Your password"
                  autoComplete="current-password"
                  className="input-field"
                  style={{ paddingRight: "2.75rem" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-muted)" }}
                >
                  <EyeIcon show={showPw} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary mt-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity={0.25} />
                    <path d="M3 12a9 9 0 019-9" />
                  </svg>
                  Logging in…
                </>
              ) : (
                "Log in"
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-5 text-sm" style={{ color: "var(--text-muted)" }}>
          Don&apos;t have an account?{" "}
          <Link href="/signup" style={{ color: "var(--primary)" }}>
            Create admin account
          </Link>
        </p>
      </div>
    </div>
  );
}
