"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

// ─── Password strength ────────────────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ chars", pass: password.length >= 8 },
    { label: "Number", pass: /\d/.test(password) },
    { label: "Letter", pass: /[a-zA-Z]/.test(password) },
  ];
  const score = checks.filter(c => c.pass).length;
  const colors = ["bg-red-500", "bg-amber-500", "bg-emerald-500"];
  if (!password) return null;
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1.5">
        {[0, 1, 2].map(i => (
          <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${i < score ? colors[score - 1] : "bg-slate-200"}`} />
        ))}
      </div>
      <div className="flex gap-3">
        {checks.map(c => (
          <span key={c.label} className={`text-xs ${c.pass ? "text-emerald-600 font-medium" : "text-slate-400"}`}>
            {c.pass ? "✓" : "·"} {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

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

// ─── States ───────────────────────────────────────────────────────────────────
type PageState = "loading" | "valid" | "error" | "success";

export default function AcceptInvitePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [state, setState] = useState<PageState>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // ── Validate token on mount ────────────────────────────────────────────────
  useEffect(() => {
    if (!token) {
      setState("error");
      setErrorMsg("No invite token found. Please use the link from your invite email.");
      return;
    }
    api.get(`/auth/accept-invite?token=${token}`)
      .then(res => {
        setEmail(res.data.email);
        setName(res.data.name || "");
        setState("valid");
      })
      .catch(err => {
        setState("error");
        setErrorMsg(err?.response?.data?.detail || "This invite link is invalid or has expired.");
      });
  }, [token]);

  // ── Form submit ────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Please enter your full name.";
    if (password.length < 8 || !/\d/.test(password)) errs.password = "Does not meet requirements.";
    if (password !== confirm) errs.confirm = "Passwords do not match.";
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }

    setSubmitting(true);
    try {
      await api.post("/auth/set-password", { token, password, name: name.trim() });
      setState("success");
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Renders ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 h-14 flex items-center">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
          <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          MedVerify
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* Loading */}
          {state === "loading" && (
            <div className="card bg-white p-8 text-center border-0 shadow-sm">
              <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-600 text-sm">Validating your invite link…</p>
            </div>
          )}

          {/* Error state */}
          {state === "error" && (
            <div className="card bg-white p-8 text-center border-0 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-lg font-semibold text-slate-900 mb-2">Invalid invite link</h1>
              <p className="text-sm text-slate-600 mb-6">{errorMsg}</p>
              <Link href="/login" className="btn-primary w-full justify-center">Go to login</Link>
            </div>
          )}

          {/* Success state */}
          {state === "success" && (
            <div className="card bg-white p-8 text-center border-0 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-lg font-semibold text-slate-900 mb-2">Account activated!</h1>
              <p className="text-sm text-slate-600 mb-6">
                Your account is ready. You can now log in with your email and the password you just set.
              </p>
              <button onClick={() => router.push("/login")} className="btn-primary w-full justify-center">
                Go to login
              </button>
            </div>
          )}

          {/* Valid — show form */}
          {state === "valid" && (
            <div className="card bg-white border-0 shadow-sm overflow-hidden">
              <div className="px-8 pt-8 pb-6 border-b border-slate-100">
                <h1 className="text-xl font-bold text-slate-900 mb-1">Set up your account</h1>
                <p className="text-sm text-slate-500">
                  You have been invited to join MedVerify as{" "}
                  <span className="font-medium text-slate-700">{email}</span>.
                  Set a password to activate your account.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5" noValidate>
                {/* Global error */}
                {errorMsg && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                    </svg>
                    {errorMsg}
                  </div>
                )}

                {/* Full name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Full name</label>
                  <input
                    type="text" value={name} onChange={e => { setName(e.target.value); setFieldErrors(p => ({ ...p, name: "" })); }}
                    className={`input-field ${fieldErrors.name ? "error" : ""}`}
                    placeholder="Dr. James Wilson"
                  />
                  {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>}
                </div>

                {/* Email (display only) */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
                  <div className="input-field bg-slate-50 text-slate-500 cursor-not-allowed">{email}</div>
                  <p className="text-xs text-slate-400 mt-1">Your email is set by the admin and cannot be changed.</p>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"} value={password}
                      onChange={e => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: "" })); }}
                      className={`input-field pr-10 ${fieldErrors.password ? "error" : ""}`}
                      placeholder="Min 8 chars, includes a number"
                    />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <EyeIcon show={showPw} />
                    </button>
                  </div>
                  <PasswordStrength password={password} />
                  {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
                </div>

                {/* Confirm */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"} value={confirm}
                      onChange={e => { setConfirm(e.target.value); setFieldErrors(p => ({ ...p, confirm: "" })); }}
                      className={`input-field pr-10 ${fieldErrors.confirm ? "error" : ""}`}
                    />
                    <button type="button" onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <EyeIcon show={showConfirm} />
                    </button>
                  </div>
                  {fieldErrors.confirm && <p className="mt-1 text-xs text-red-600">{fieldErrors.confirm}</p>}
                </div>

                <button type="submit" className="btn-primary w-full mt-2" disabled={submitting}>
                  {submitting ? "Activating account..." : "Activate account"}
                </button>

                <p className="text-center text-xs text-slate-400">
                  Already have an account?{" "}
                  <Link href="/login" className="text-blue-600 hover:underline font-medium">Log in</Link>
                </p>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
