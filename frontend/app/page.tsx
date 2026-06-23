"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

// ─── Icons ────────────────────────────────────────────────────────────────
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
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// ─── Data ─────────────────────────────────────────────────────────────────
const features = [
  {
    icon: <ShieldCheck />,
    title: "Evidence Verification",
    desc: "Every answer is backed by retrieved, scored, and ranked medical evidence — not model memorisation.",
  },
  {
    icon: <Brain />,
    title: "Confidence Scoring",
    desc: "A dedicated verifier agent scores evidence quality before any answer is generated. Low scores flag for review.",
  },
  {
    icon: <Document />,
    title: "Knowledge Gap Tracking",
    desc: "Questions with insufficient evidence are logged, not guessed. Sorted by frequency to prioritise documentation.",
  },
];

const steps = [
  { num: "1", title: "Ask a Clinical Question", desc: "Clinician types any medical question in plain language." },
  { num: "2", title: "Hybrid Retrieval", desc: "Vector search + keyword search across trusted medical documents." },
  { num: "3", title: "Evidence Verification", desc: "A verifier agent scores evidence quality to prevent hallucinations." },
  { num: "4", title: "Confidence Routing", desc: "High confidence → cited answer. Medium → expert review." },
];

// ─── Component ────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* ── Navigation ── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
          scrolled ? "bg-white/80 backdrop-blur-md border-b border-slate-200" : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg text-slate-900">
            <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            MedVerify
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How it Works</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2">
              Log in
            </Link>
            <Link href="/signup" className="btn-primary text-sm px-4 py-2">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-32 pb-20 px-6 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-6 border border-blue-100">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          Clinical Evidence Platform
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight max-w-4xl mx-auto">
          Medical AI that knows when to say <span className="text-blue-600">"I don't know"</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
          MedVerify retrieves, reranks, and verifies clinical evidence before every answer. 
          High-confidence queries get cited responses. Uncertain cases get flagged for review.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup" className="btn-primary text-base px-8 py-3 w-full sm:w-auto">
            Create Admin Account
          </Link>
          <Link href="/login" className="btn-secondary text-base px-8 py-3 w-full sm:w-auto bg-white border-slate-200">
            View Live Demo
          </Link>
        </div>
        <p className="mt-6 text-sm text-slate-500">No credit card required. Setup your team in minutes.</p>
        
        {/* Hero Image / App Preview Box */}
        <div className="mt-16 mx-auto max-w-3xl card p-1 bg-white">
          <div className="rounded-lg bg-slate-50 border border-slate-100 p-6 text-left">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-200">
              <div className="w-8 h-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center font-bold">Q</div>
              <div className="text-sm font-medium text-slate-700">What is the first-line treatment for H. pylori infection?</div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded bg-slate-800 text-white flex flex-shrink-0 items-center justify-center font-bold">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                  <polyline points="13 2 13 9 20 9"></polyline>
                </svg>
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2 border border-emerald-100">
                  <CheckCircle /> Verified Evidence · 0.91 Confidence
                </div>
                <p className="text-slate-700 text-sm leading-relaxed">
                  The recommended first-line therapy is <strong>triple therapy</strong> combining a proton pump inhibitor (PPI) with clarithromycin and amoxicillin for 7–14 days.
                </p>
                <div className="mt-3 inline-flex items-center gap-1 text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded cursor-pointer hover:bg-blue-100 transition-colors">
                  <Document /> BSG Guidelines, page 14
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section id="features" className="py-24 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Built for clinical safety</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Every feature exists to reduce hallucinations and increase trust in AI-generated answers.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="card p-6 border-0 bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works pipeline ── */}
      <section id="how-it-works" className="py-24 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">The Verification Pipeline</h2>
          <p className="text-lg text-slate-600">Explainable and auditable steps for every query.</p>
        </div>
        <div className="space-y-4">
          {steps.map((step, i) => (
            <div key={i} className="card p-5 flex items-start gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${i === 2 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {step.num}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  {step.title}
                  {i === 2 && <span className="badge badge-blue">Key Differentiator</span>}
                </h3>
                <p className="text-slate-600 text-sm mt-1">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Dual Roles ── */}
      <section className="py-24 px-6 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Two roles, one platform</h2>
              <div className="space-y-8">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center"><Users /></div>
                    <h3 className="text-xl font-semibold">Clinicians</h3>
                  </div>
                  <p className="text-slate-400 text-sm">A simple chat interface to ask questions and get cited answers instantly. Invite-only access keeps your workspace secure.</p>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center"><ShieldCheck /></div>
                    <h3 className="text-xl font-semibold">Admin Reviewers</h3>
                  </div>
                  <p className="text-slate-400 text-sm">Manage the clinical knowledge base, review borderline answers before they reach the team, and track unanswered questions.</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-800 rounded-xl p-8 border border-slate-700">
              <h3 className="text-lg font-medium mb-4 text-slate-200">Start managing your team</h3>
              <ul className="space-y-3 mb-8">
                {["Upload medical documents", "Review held answers", "Track knowledge gaps", "Invite clinicians"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-slate-300">
                    <span className="text-emerald-400"><CheckCircle /></span> {item}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="btn-primary w-full bg-white text-slate-900 hover:bg-slate-100">
                Create Admin Account <ArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            MedVerify
          </div>
          <p className="text-sm text-slate-500">© 2026 MedVerify. Built for healthcare professionals.</p>
          <div className="flex gap-4 text-sm text-slate-500">
            <a href="#" className="hover:text-slate-900">Privacy</a>
            <a href="#" className="hover:text-slate-900">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
