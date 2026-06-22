"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

// ─── Icons (inline SVGs to avoid extra deps on landing) ────────────────────
const ShieldCheck = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);
const Brain = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
  </svg>
);
const Document = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);
const ChartBar = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);
const Users = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);
const ArrowRight = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);
const CheckCircle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const AlertTriangle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
);

// ─── Feature cards data ─────────────────────────────────────────────────────
const features = [
  {
    icon: <ShieldCheck />,
    title: "Evidence Verification",
    desc: "Every answer is backed by retrieved, scored, and ranked medical evidence — not model memorisation.",
    color: "#0ea5e9",
  },
  {
    icon: <Brain />,
    title: "Confidence Scoring",
    desc: "A dedicated verifier agent scores evidence quality 0–1 before any answer is generated. Low scores flag for review.",
    color: "#06b6d4",
  },
  {
    icon: <Document />,
    title: "Knowledge Gap Tracking",
    desc: "Questions with insufficient evidence are logged, not guessed. Sorted by frequency to prioritise documentation.",
    color: "#10b981",
  },
  {
    icon: <ChartBar />,
    title: "Freshness Monitoring",
    desc: "Nightly agent scans all ingested documents and flags outdated guidelines before they reach clinicians.",
    color: "#f59e0b",
  },
  {
    icon: <Users />,
    title: "Human-in-the-Loop Review",
    desc: "Borderline answers go to a review queue. Senior clinicians approve, edit, or reject before answers are delivered.",
    color: "#a78bfa",
  },
  {
    icon: <ShieldCheck />,
    title: "Audit-Ready Citations",
    desc: "Every confident answer includes inline citations: document title and page number. Full traceability built-in.",
    color: "#f472b6",
  },
];

// ─── How it works steps ─────────────────────────────────────────────────────
const steps = [
  {
    num: "01",
    title: "Ask a Clinical Question",
    desc: "Clinician types any medical question in plain language.",
  },
  {
    num: "02",
    title: "Hybrid Retrieval",
    desc: "Vector search + BM25 keyword search across trusted medical documents, fused with Reciprocal Rank Fusion.",
  },
  {
    num: "03",
    title: "Neural Reranking",
    desc: "CrossEncoder reranker scores (query, chunk) pairs and selects the top 5 most relevant passages.",
  },
  {
    num: "04",
    title: "Evidence Verification",
    desc: "A dedicated verifier agent scores evidence quality 0–1. This is the step no basic RAG system has.",
  },
  {
    num: "05",
    title: "Confidence Routing",
    desc: "High confidence → cited answer. Medium → expert review. Low → knowledge gap logged.",
  },
];

// ─── Stats ──────────────────────────────────────────────────────────────────
const stats = [
  { value: "0%", label: "Hallucination tolerance" },
  { value: "3×", label: "Evidence retrieval layers" },
  { value: "100%", label: "Answers cited" },
  { value: "<0.5s", label: "Evidence verification time" },
];

// ─── Component ──────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>

      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(2,11,24,0.92)" : "transparent",
          backdropFilter: scrolled ? "blur(16px)" : "none",
          borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #0ea5e9, #0284c7)" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <span className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>
              Med<span className="gradient-text">Verify</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {["Features", "How It Works", "Who It's For"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/[^a-z]/g, "-")}`}
                className="text-sm transition-colors duration-200"
                style={{ color: "var(--text-secondary)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
              >
                {item}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="btn-secondary text-sm px-4 py-2"
              style={{ width: "auto" }}
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="btn-primary text-sm px-4 py-2"
              style={{ width: "auto" }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Background glow */}
        <div className="hero-glow absolute inset-0 pointer-events-none" />
        {/* Floating orbs */}
        <div
          className="animate-pulse-slow absolute top-20 left-1/4 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(14,165,233,0.08) 0%, transparent 70%)" }}
        />
        <div
          className="animate-pulse-slow delay-500 absolute top-40 right-1/4 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)" }}
        />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6 animate-fade-up"
            style={{
              background: "rgba(14,165,233,0.1)",
              border: "1px solid rgba(14,165,233,0.25)",
              color: "var(--primary)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: "var(--primary)" }}
            />
            AI-Powered Clinical Evidence Verification
          </div>

          {/* Headline */}
          <h1
            className="text-5xl md:text-7xl font-bold leading-tight mb-6 animate-fade-up delay-100"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
          >
            Medical AI that{" "}
            <span className="gradient-text">knows</span>
            <br />
            when to say{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #ef4444, #f97316)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              "I don't know"
            </span>
          </h1>

          {/* Subheadline */}
          <p
            className="text-lg md:text-xl mb-10 max-w-2xl mx-auto animate-fade-up delay-200"
            style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}
          >
            MedVerify retrieves, reranks, and verifies clinical evidence before every answer.
            High-confidence queries get cited responses. Uncertain cases get flagged — never guessed.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up delay-300">
            <Link
              href="/signup"
              className="btn-primary text-base px-8 py-3.5"
              style={{ width: "auto" }}
            >
              Create Admin Account
              <ArrowRight />
            </Link>
            <Link
              href="/login"
              className="btn-secondary text-base px-8 py-3.5"
            >
              Log In
            </Link>
          </div>

          {/* Trust line */}
          <p className="mt-6 text-sm animate-fade-up delay-400" style={{ color: "var(--text-muted)" }}>
            No credit card required · Invite-only clinician access · Full audit trail
          </p>
        </div>

        {/* Hero visual — confidence score demo card */}
        <div className="max-w-2xl mx-auto mt-16 animate-fade-up delay-500">
          <div
            className="glass rounded-2xl p-6"
            style={{ boxShadow: "0 24px 80px rgba(14,165,233,0.12)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full" style={{ background: "#ef4444" }} />
              <div className="w-3 h-3 rounded-full" style={{ background: "#f59e0b" }} />
              <div className="w-3 h-3 rounded-full" style={{ background: "#10b981" }} />
              <span className="ml-2 text-xs" style={{ color: "var(--text-muted)" }}>
                MedVerify · Clinical Q&A
              </span>
            </div>
            {/* Simulated query */}
            <div
              className="rounded-xl p-4 mb-3 text-sm"
              style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}
            >
              <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Clinician asks:</span>
              <p className="mt-1" style={{ color: "var(--text-primary)" }}>
                What is the first-line treatment for H. pylori infection?
              </p>
            </div>
            {/* Simulated answer */}
            <div className="rounded-xl p-4" style={{ background: "var(--surface-1)" }}>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: "var(--success-dim)", color: "var(--success)" }}
                >
                  <CheckCircle /> High Confidence · 0.91
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                The recommended first-line therapy is <strong style={{ color: "var(--text-primary)" }}>triple therapy</strong> combining
                a proton pump inhibitor (PPI) with clarithromycin and amoxicillin for 7–14 days{" "}
                <span
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-xs cursor-pointer"
                  style={{ background: "var(--primary-dim)", color: "var(--primary)" }}
                >
                  BSG Guidelines, p.14
                </span>
              </p>
            </div>
            {/* Low confidence example */}
            <div className="rounded-xl p-4 mt-3" style={{ background: "var(--surface-1)" }}>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: "var(--warning-dim)", color: "var(--warning)" }}
                >
                  <AlertTriangle /> Under Review · 0.61
                </span>
              </div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                A clinical specialist is reviewing this before it reaches you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      <section className="py-16 px-6" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div
                className="text-4xl font-bold mb-2 gradient-text"
              >
                {s.value}
              </div>
              <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span
              className="text-xs font-semibold tracking-widest uppercase mb-3 block"
              style={{ color: "var(--primary)" }}
            >
              Platform Capabilities
            </span>
            <h2
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              Built for clinical safety, not just speed
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: "var(--text-secondary)" }}>
              Every feature exists to reduce hallucinations and increase trust in AI-generated clinical answers.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="glass rounded-2xl p-6 card-hover"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${f.color}18`, color: f.color }}
                >
                  {f.icon}
                </div>
                <h3
                  className="font-semibold text-base mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────── */}
      <section
        id="how-it-works"
        className="py-24 px-6"
        style={{ background: "var(--surface-1)" }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span
              className="text-xs font-semibold tracking-widest uppercase mb-3 block"
              style={{ color: "var(--primary)" }}
            >
              The Pipeline
            </span>
            <h2
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              How MedVerify works
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: "var(--text-secondary)" }}>
              Seven distinct steps where a basic RAG system has three. Each step is explainable and auditable.
            </p>
          </div>
          <div className="relative">
            {/* Connector line */}
            <div
              className="absolute left-8 top-8 bottom-8 w-px hidden md:block"
              style={{ background: "var(--border)" }}
            />
            <div className="space-y-6">
              {steps.map((step, i) => (
                <div
                  key={step.num}
                  className="flex gap-6 items-start relative"
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 font-bold text-lg z-10"
                    style={{
                      background: i === 3
                        ? "linear-gradient(135deg, #0ea5e9, #0284c7)"
                        : "var(--surface-2)",
                      color: i === 3 ? "white" : "var(--primary)",
                      border: i === 3 ? "none" : "1px solid var(--border)",
                      boxShadow: i === 3 ? "var(--glow-primary)" : "none",
                    }}
                  >
                    {step.num}
                  </div>
                  <div
                    className="glass rounded-2xl p-5 flex-1"
                    style={{
                      border: i === 3 ? "1px solid rgba(14,165,233,0.35)" : undefined,
                    }}
                  >
                    <h3
                      className="font-semibold mb-1"
                      style={{ color: i === 3 ? "var(--primary)" : "var(--text-primary)" }}
                    >
                      {step.title}
                      {i === 3 && (
                        <span
                          className="ml-2 text-xs px-2 py-0.5 rounded-full"
                          style={{
                            background: "var(--primary-dim)",
                            color: "var(--primary)",
                          }}
                        >
                          The key differentiator
                        </span>
                      )}
                    </h3>
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Who it's for ───────────────────────────────────────────────── */}
      <section id="who-it-s-for" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span
              className="text-xs font-semibold tracking-widest uppercase mb-3 block"
              style={{ color: "var(--primary)" }}
            >
              Two Roles, One Platform
            </span>
            <h2
              className="text-3xl md:text-4xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              Who uses MedVerify
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Clinician */}
            <div className="glass rounded-2xl p-8">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: "rgba(16,185,129,0.12)", color: "var(--success)" }}
              >
                <Users />
              </div>
              <h3
                className="text-xl font-bold mb-3"
                style={{ color: "var(--text-primary)" }}
              >
                Clinicians
              </h3>
              <p className="text-sm mb-5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Doctors, nurses, and pharmacists who need reliable answers fast. They get
                a simple chat interface — no system internals, no configuration.
              </p>
              <ul className="space-y-2">
                {[
                  "Ask clinical questions in plain language",
                  "Get evidence-backed answers with citations",
                  "See confidence level for every response",
                  "Review their own question history",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <span style={{ color: "var(--success)", marginTop: 2 }}>
                      <CheckCircle />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <div
                className="mt-6 text-xs px-3 py-1.5 rounded-full inline-block"
                style={{
                  background: "rgba(16,185,129,0.1)",
                  color: "var(--success)",
                  border: "1px solid rgba(16,185,129,0.2)",
                }}
              >
                Invite-only access
              </div>
            </div>
            {/* Admin */}
            <div className="glass rounded-2xl p-8" style={{ border: "1px solid rgba(14,165,233,0.3)" }}>
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: "var(--primary-dim)", color: "var(--primary)" }}
              >
                <ShieldCheck />
              </div>
              <h3
                className="text-xl font-bold mb-3"
                style={{ color: "var(--text-primary)" }}
              >
                Admin Reviewers
              </h3>
              <p className="text-sm mb-5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Senior clinicians and knowledge managers who control the platform.
                They curate documents, review held answers, and manage the clinical team.
              </p>
              <ul className="space-y-2">
                {[
                  "Upload and manage medical documents",
                  "Review and approve borderline answers",
                  "Track knowledge gaps by frequency",
                  "Monitor document freshness and usage analytics",
                  "Invite clinicians and manage team access",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <span style={{ color: "var(--primary)", marginTop: 2 }}>
                      <CheckCircle />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <Link
                  href="/signup"
                  className="btn-primary text-sm px-5 py-2.5"
                  style={{ width: "auto", display: "inline-flex" }}
                >
                  Create Admin Account <ArrowRight />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Section ────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div
            className="glass rounded-3xl p-12"
            style={{ boxShadow: "0 0 60px rgba(14,165,233,0.08)" }}
          >
            <h2
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              Ready to verify your{" "}
              <span className="gradient-text">clinical evidence?</span>
            </h2>
            <p className="text-lg mb-8" style={{ color: "var(--text-secondary)" }}>
              Create your admin account in 60 seconds. Upload your first document.
              Invite your clinical team.
            </p>
            <Link
              href="/signup"
              className="btn-primary text-base px-10 py-4"
              style={{ width: "auto", display: "inline-flex" }}
            >
              Get Started Free <ArrowRight />
            </Link>
            <p className="mt-4 text-sm" style={{ color: "var(--text-muted)" }}>
              Already have an account?{" "}
              <Link href="/login" style={{ color: "var(--primary)" }}>
                Log in
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer
        className="py-10 px-6"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #0ea5e9, #0284c7)" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
              MedVerify
            </span>
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            AI-powered clinical evidence verification · Built for healthcare professionals
          </p>
          <div className="flex gap-6">
            {["Privacy", "Security", "Contact"].map((item) => (
              <a
                key={item}
                href="#"
                className="text-xs transition-colors"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
