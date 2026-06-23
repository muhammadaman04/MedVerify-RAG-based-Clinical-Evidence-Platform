"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

const Logo = () => (
  <div className="flex items-center gap-2 justify-center mb-8">
    <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    </div>
    <span className="font-bold text-xl text-slate-900">MedVerify</span>
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

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ chars", pass: password.length >= 8 },
    { label: "Number", pass: /\d/.test(password) },
    { label: "Letter", pass: /[a-zA-Z]/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;
  const colors = ["bg-red-500", "bg-amber-500", "bg-emerald-500"];

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`flex-1 h-1 rounded-full transition-colors duration-300 ${
              i < score ? colors[score - 1] : "bg-slate-200"
            }`}
          />
        ))}
      </div>
      <div className="flex gap-3">
        {checks.map((c) => (
          <span
            key={c.label}
            className={`text-xs ${c.pass ? "text-emerald-600 font-medium" : "text-slate-400"}`}
          >
            {c.pass ? "✓" : "·"} {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function Field({
  label, id, type = "text", value, onChange, placeholder, error, rightElement, autoComplete
}: any) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder} autoComplete={autoComplete}
          className={`input-field ${error ? "error" : ""}`}
          style={{ paddingRight: rightElement ? "2.75rem" : undefined }}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            {rightElement}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const set = (field: string) => (val: string) => {
    setForm((f) => ({ ...f, [field]: val }));
    setErrors((e) => ({ ...e, [field]: "" }));
    setApiError("");
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.email) e.email = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email";
    if (!form.password) e.password = "Required";
    else if (form.password.length < 8 || !/\d/.test(form.password)) e.password = "Does not meet requirements";
    if (!form.confirm) e.confirm = "Required";
    else if (form.password !== form.confirm) e.confirm = "Passwords do not match";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const res = await api.post("/auth/signup", {
        name: form.name.trim(),
        email: form.email.toLowerCase(),
        password: form.password,
      });
      login(res.data.access_token, res.data.user);
      router.push("/admin/dashboard");
    } catch (err: any) {
      setApiError(err?.response?.data?.detail || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="block"><Logo /></Link>
        <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900">
          Create an admin account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Or{" "}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            log in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 sm:rounded-xl sm:px-10">
          {apiError && (
            <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-100">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{apiError}</h3>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <Field label="Full name" id="name" value={form.name} onChange={set("name")} error={errors.name} />
            <Field label="Work email" id="email" type="email" value={form.email} onChange={set("email")} error={errors.email} />
            
            <div>
              <Field
                label="Password" id="password" type={showPw ? "text" : "password"}
                value={form.password} onChange={set("password")} error={errors.password}
                rightElement={
                  <button type="button" onClick={() => setShowPw(!showPw)} className="hover:text-slate-600">
                    <EyeIcon show={showPw} />
                  </button>
                }
              />
              <PasswordStrength password={form.password} />
            </div>

            <Field
              label="Confirm password" id="confirm" type={showConfirm ? "text" : "password"}
              value={form.confirm} onChange={set("confirm")} error={errors.confirm}
              rightElement={
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="hover:text-slate-600">
                  <EyeIcon show={showConfirm} />
                </button>
              }
            />

            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? "Creating account..." : "Sign up"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
