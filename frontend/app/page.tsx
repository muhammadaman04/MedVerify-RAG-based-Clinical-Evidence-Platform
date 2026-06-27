"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Brain,
  FileText,
  Activity,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  AlertCircle,
  FileSearch,
  Shield,
  Stethoscope,
  Building2,
  Database,
  Lock,
  Search,
  Check,
  AlertTriangle
} from "lucide-react";

// ─── Animation Variants ───────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const fadeScale = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } }
};

// ─── Data ─────────────────────────────────────────────────────────────────
const features = [
  {
    icon: <Shield className="w-6 h-6 text-emerald-600" />,
    title: "Evidence Verification",
    desc: "Every answer is backed by retrieved and ranked medical evidence. We verify against trusted clinical guidelines before generating a response.",
    color: "bg-emerald-50",
    border: "border-emerald-100"
  },
  {
    icon: <Activity className="w-6 h-6 text-blue-600" />,
    title: "Confidence Scoring",
    desc: "Our system evaluates the quality of the retrieved evidence. If the confidence score is low, the system flags the query rather than guessing.",
    color: "bg-blue-50",
    border: "border-blue-100"
  },
  {
    icon: <FileSearch className="w-6 h-6 text-purple-600" />,
    title: "Verifiable Citations",
    desc: "Responses include exact page references and document links, allowing clinicians to instantly verify the source material.",
    color: "bg-purple-50",
    border: "border-purple-100"
  },
  {
    icon: <AlertCircle className="w-6 h-6 text-amber-600" />,
    title: "Uncertainty Detection",
    desc: "When clinical evidence is insufficient or contradictory, the platform explicitly states 'I don't know' to ensure patient safety.",
    color: "bg-amber-50",
    border: "border-amber-100"
  },
  {
    icon: <Users className="w-6 h-6 text-indigo-600" />,
    title: "Human Review Loop",
    desc: "Uncertain cases are logged and flagged for expert review, creating a continuous improvement cycle for your institutional knowledge.",
    color: "bg-indigo-50",
    border: "border-indigo-100"
  },
  {
    icon: <Lock className="w-6 h-6 text-slate-600" />,
    title: "Enterprise Security",
    desc: "Built for healthcare. Your queries and institutional documents are secure, private, and never used to train public models.",
    color: "bg-slate-50",
    border: "border-slate-200"
  }
];

const faqs = [
  {
    q: "How does MedVerify differ from generic AI chatbots?",
    a: "Generic AI chatbots generate answers based on broad internet data and are prone to 'hallucinations' (making things up). MedVerify uses a constrained pipeline: it only retrieves answers from the clinical documents you upload, verifies the evidence, and provides exact citations. If the answer isn't in your documents, it won't guess."
  },
  {
    q: "Who is this platform built for?",
    a: "MedVerify is designed for hospitals, clinical research teams, medical affairs departments, and healthcare administrators who need to quickly query complex clinical guidelines, protocols, and policies with 100% confidence."
  },
  {
    q: "Can I upload my own clinical guidelines?",
    a: "Yes. The platform includes a secure admin portal where you can upload PDFs and DOCX files. The system automatically processes, indexes, and makes these documents securely searchable for your team."
  },
  {
    q: "What happens if the system cannot find an answer?",
    a: "Safety is our priority. If the retrieved evidence does not contain a confident answer, MedVerify will state that there is insufficient evidence and flag the query for human expert review."
  }
];

function Users({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

// ─── Interactive Hero Mockup Component ─────────────────────────────────────
function HeroMockup() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Animation sequence sequence
    const timer1 = setTimeout(() => setStep(1), 1000); // Type question
    const timer2 = setTimeout(() => setStep(2), 2500); // Show loading
    const timer3 = setTimeout(() => setStep(3), 4500); // Show result
    const timer4 = setTimeout(() => setStep(0), 10000); // Reset after 10s

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [step]);

  return (
    <div className="relative w-full max-w-lg mx-auto bg-white rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden flex flex-col h-[400px]">
      {/* Mockup Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50/50">
        <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-900">MedVerify Assistant</div>
          <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            System Online
          </div>
        </div>
      </div>

      {/* Mockup Body */}
      <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-5 bg-slate-50/30">
        
        {/* Step 1: Question */}
        <AnimatePresence>
          {step >= 1 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="self-end max-w-[85%]"
            >
              <div className="bg-slate-900 text-white text-sm px-4 py-2.5 rounded-2xl rounded-tr-sm shadow-sm">
                What is the recommended first-line treatment for H. pylori infection in adults?
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 2: Loading & Verifying */}
        <AnimatePresence>
          {step === 2 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, height: 0, marginTop: -20 }}
              className="self-start max-w-[85%] w-full"
            >
              <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                Retrieving & verifying evidence...
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 3: Verified Result */}
        <AnimatePresence>
          {step >= 3 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="self-start max-w-[90%] w-full"
            >
              <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-sm shadow-sm">
                
                {/* Confidence Badge */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 
                    Verified Evidence
                  </div>
                  <div className="text-xs font-medium text-slate-400">
                    94% Confidence
                  </div>
                </div>

                {/* Answer Text */}
                <p className="text-sm text-slate-700 leading-relaxed">
                  The recommended first-line therapy is <strong>triple therapy</strong> combining a proton pump inhibitor (PPI) with clarithromycin and amoxicillin for 7–14 days.
                </p>

                {/* Citation */}
                <div className="mt-4 pt-3 border-t border-slate-50">
                  <div className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50/50 hover:bg-blue-50 px-2 py-1.5 rounded-md cursor-pointer transition-colors border border-blue-100/50">
                    <FileText className="w-3.5 h-3.5" />
                    BSG Clinical Guidelines 2024, Page 14
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mockup Input */}
      <div className="p-4 bg-white border-t border-slate-100">
        <div className="relative">
          <input 
            type="text" 
            disabled 
            placeholder={step === 0 ? "Ask a clinical question..." : ""}
            className="w-full bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5 text-sm text-slate-900 focus:outline-none"
          />
          <div className="absolute right-1 top-1 bottom-1 w-8 bg-blue-600 rounded-full flex items-center justify-center">
            <ArrowRight className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      
      {/* ── Navigation ── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/80 backdrop-blur-lg border-b border-slate-200 shadow-sm py-3" : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-slate-900">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-b from-blue-500 to-blue-600 flex items-center justify-center shadow-sm shadow-blue-500/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            MedVerify
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500">
            <a href="#problem" className="hover:text-slate-900 transition-colors">The Problem</a>
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How it Works</a>
            <a href="#benefits" className="hover:text-slate-900 transition-colors">Benefits</a>
            <a href="#faq" className="hover:text-slate-900 transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Log in
            </Link>
            <Link href="/signup" className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2 rounded-full transition-all shadow-sm hover:shadow">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section (Asymmetrical) ── */}
      <section className="relative pt-40 pb-20 overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] -z-10 opacity-40"></div>
        
        <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-16">
          
          {/* Left Content */}
          <motion.div 
            className="flex-1 text-center lg:text-left z-10"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-8 border border-blue-100/50">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Clinical Decision Support Platform
            </motion.div>
            
            <motion.h1 variants={fadeUp} className="text-5xl lg:text-[72px] font-extrabold tracking-tight text-slate-900 mb-8 leading-[1.05]">
              Medical AI that knows when to say <span className="text-blue-600 relative inline-block">
                "I don't know"
                <svg className="absolute -bottom-2 left-0 w-full h-3 text-blue-200" viewBox="0 0 100 12" preserveAspectRatio="none">
                  <path d="M0,10 Q50,0 100,10" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                </svg>
              </span>
            </motion.h1>
            
            <motion.p variants={fadeUp} className="text-lg lg:text-xl text-slate-600 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Empower your clinical teams with a platform that verifies evidence before every answer. High-confidence queries get cited responses. Uncertain cases get flagged for review. Built for safety, designed for trust.
            </motion.p>
            
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Link href="/signup" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-base font-medium px-8 py-3.5 rounded-full transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2">
                Create Admin Account
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="#how-it-works" className="w-full sm:w-auto bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-base font-medium px-8 py-3.5 rounded-full transition-all flex items-center justify-center">
                See How it Works
              </Link>
            </motion.div>
            
            <motion.div variants={fadeUp} className="mt-10 flex items-center justify-center lg:justify-start gap-6 text-sm text-slate-500 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Setup in minutes
              </div>
            </motion.div>
          </motion.div>

          {/* Right Content (Interactive Mockup) */}
          <motion.div 
            className="flex-1 w-full relative z-10"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          >
            {/* Decorative background blur behind mockup */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-blue-400/20 blur-[100px] rounded-full -z-10"></div>
            <HeroMockup />
          </motion.div>

        </div>
      </section>

      {/* ── Problem Section ── */}
      <section id="problem" className="py-24 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
              General-purpose AI is dangerous in medicine.
            </motion.h2>
            <motion.p variants={fadeUp} className="text-lg md:text-xl text-slate-600 leading-relaxed mb-12">
              Standard AI chatbots generate answers by predicting the next word based on broad internet data. They are designed to sound confident, even when they are completely wrong. In a clinical setting, this "hallucination" problem is a critical safety risk.
            </motion.p>
            
            <motion.div variants={fadeUp} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-2xl mx-auto flex flex-col md:flex-row gap-6 items-center text-left">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">The MedVerify Solution</h3>
                <p className="text-slate-600">
                  MedVerify restricts the system to your approved clinical documents. It extracts relevant evidence, scores it for confidence, and synthesizes an answer <span className="font-semibold text-slate-900">only</span> if the evidence supports it.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Workflow / How it works ── */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">A transparent verification pipeline</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              We replace black-box generation with a clear, auditable process designed for clinical rigor.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: <Search className="w-6 h-6 text-blue-600" />,
                title: "Ask & Retrieve",
                desc: "A clinician asks a question. MedVerify searches your uploaded guidelines, policies, and research papers to find the most relevant paragraphs.",
                color: "bg-blue-50 border-blue-100"
              },
              {
                step: "02",
                icon: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
                title: "Verify & Score",
                desc: "Before generating an answer, a secondary verification system evaluates the retrieved evidence to ensure it directly answers the question.",
                color: "bg-emerald-50 border-emerald-100"
              },
              {
                step: "03",
                icon: <AlertTriangle className="w-6 h-6 text-amber-600" />,
                title: "Answer or Escalate",
                desc: "If confidence is high, a cited answer is provided. If evidence is contradictory or missing, the query is flagged for human review.",
                color: "bg-amber-50 border-amber-100"
              }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="relative p-8 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow group"
              >
                <div className="text-5xl font-extrabold text-slate-50 absolute top-6 right-6 -z-10 group-hover:text-slate-100 transition-colors">
                  {item.step}
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 border ${item.color}`}>
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Key Benefits (Bento Grid) ── */}
      <section id="benefits" className="py-24 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Built for clinical safety</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Every feature exists to reduce hallucinations, provide transparency, and increase trust.
            </p>
          </div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            {features.map((f, i) => (
              <motion.div 
                key={i} 
                variants={fadeScale}
                className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 border ${f.color} ${f.border}`}>
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">{f.title}</h3>
                <p className="text-slate-600 leading-relaxed text-sm flex-1">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Comparison Section ── */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Why hospitals choose MedVerify</h2>
            <p className="text-lg text-slate-600">A clear contrast with traditional consumer AI tools.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-slate-50 p-8 rounded-3xl border border-slate-200"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-slate-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Standard AI Chatbot</h3>
              </div>
              <ul className="space-y-4">
                {[
                  "Generates answers from unverified internet data",
                  "Prone to confident hallucinations",
                  "No visibility into source materials",
                  "Guesses answers when unsure",
                  "Uses your queries to train public models"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-600">
                    <div className="mt-1 w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-blue-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden"
            >
              {/* Decorative gradient */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-[80px] opacity-30 -mr-20 -mt-20"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-blue-800 flex items-center justify-center border border-blue-700">
                    <ShieldCheck className="w-5 h-5 text-blue-300" />
                  </div>
                  <h3 className="text-xl font-bold text-white">MedVerify Platform</h3>
                </div>
                <ul className="space-y-4">
                  {[
                    "Answers strictly from your approved documents",
                    "Evidence is scored and verified before synthesis",
                    "Provides exact citations and page numbers",
                    "Explicitly flags uncertain queries for human review",
                    "100% private, enterprise-grade security"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-blue-50">
                      <div className="mt-1 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FAQ Section ── */}
      <section id="faq" className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-slate-600">Everything you need to know about the platform.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <FAQItem key={i} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-600 -z-20"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500 rounded-full blur-[120px] -z-10 opacity-50"></div>
        
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
              Ready to deploy safer medical AI?
            </h2>
            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
              Join leading healthcare organizations using MedVerify to provide clinicians with fast, verifiable, and safe answers.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup" className="w-full sm:w-auto bg-white text-blue-700 hover:bg-slate-50 text-lg font-semibold px-8 py-4 rounded-full transition-all shadow-lg flex items-center justify-center gap-2">
                Create Admin Account
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <p className="mt-8 text-sm text-blue-200 font-medium">
              Secure setup. SOC2 Compliant infrastructure.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 bg-slate-900 text-slate-400 text-center">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg text-white mb-4 md:mb-0">
            <ShieldCheck className="w-5 h-5 text-blue-500" />
            MedVerify
          </div>
          <div className="text-sm">
            &copy; {new Date().getFullYear()} MedVerify Inc. All rights reserved. Designed for clinical safety.
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── FAQ Item Component ───────────────────────────────────────────────────
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden transition-shadow hover:shadow-sm">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
      >
        <span className="font-semibold text-slate-900 pr-8">{question}</span>
        <ChevronDown 
          className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} 
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="px-6 pb-5 text-slate-600 leading-relaxed text-sm">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
