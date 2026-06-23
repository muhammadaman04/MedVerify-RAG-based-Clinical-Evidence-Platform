"use client";

import { useAuthStore } from "@/store/authStore";

// ─── Metric card ─────────────────────────────────────────────────────────────
function MetricCard({
  label, value, sub, colorClass, icon, bgClass
}: {
  label: string; value: string; sub: string; colorClass: string; icon: React.ReactNode; bgClass: string;
}) {
  return (
    <div className="card p-5 border-0 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bgClass} ${colorClass}`}>
          {icon}
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
          Last 30d
        </span>
      </div>
      <div className="text-3xl font-bold text-slate-900 mb-1">{value}</div>
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className={`text-xs mt-2 font-medium ${colorClass}`}>{sub}</div>
    </div>
  );
}

// ─── Skeleton placeholder ─────────────────────────────────────────────────────
function ComingSoon({ title, phase }: { title: string; phase: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 rounded-xl border border-dashed border-slate-300 bg-slate-50/50">
      <p className="font-medium text-slate-600 mb-1">{title}</p>
      <p className="text-xs text-slate-400">Coming in {phase}</p>
    </div>
  );
}

// ─── Recent query row ─────────────────────────────────────────────────────────
const mockQueries = [
  { q: "First-line treatment for H. pylori?", conf: 0.91, route: "answered", time: "2m ago" },
  { q: "Dosing for paediatric amoxicillin?", conf: 0.63, route: "review", time: "14m ago" },
  { q: "Latest NICE hypertension guidelines?", conf: 0.87, route: "answered", time: "1h ago" },
  { q: "Management of AFib in pregnancy?", conf: 0.38, route: "gap", time: "2h ago" },
  { q: "DVT prophylaxis post-surgery?", conf: 0.79, route: "answered", time: "3h ago" },
];

function RouteChip({ route, conf }: { route: string; conf: number }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    answered: { label: "Answered", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
    review: { label: "In Review", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
    gap: { label: "Evidence Gap", color: "text-red-700", bg: "bg-red-50 border-red-200" },
  };
  const s = map[route];
  return (
    <div className="flex items-center gap-2">
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${s.bg} ${s.color}`}>
        {s.label}
      </span>
      <span className="text-xs text-slate-500 font-medium">
        {(conf * 100).toFixed(0)}%
      </span>
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const user = useAuthStore((s) => s.user);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">
          {greeting}, {user?.name?.split(" ")[0] ?? "Admin"} 👋
        </h1>
        <p className="text-sm text-slate-500">
          Here's an overview of MedVerify's clinical performance today.
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <MetricCard
          label="Total queries" value="1,284" sub="↑ 12% vs last month"
          colorClass="text-blue-600" bgClass="bg-blue-50"
          icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" /></svg>}
        />
        <MetricCard
          label="Avg confidence score" value="0.82" sub="↑ Above 0.75 target"
          colorClass="text-emerald-600" bgClass="bg-emerald-50"
          icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <MetricCard
          label="Open knowledge gaps" value="34" sub="12 asked 3+ times"
          colorClass="text-red-600" bgClass="bg-red-50"
          icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>}
        />
        <MetricCard
          label="Stale documents" value="3" sub="Need re-ingestion"
          colorClass="text-amber-600" bgClass="bg-amber-50"
          icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>}
        />
      </div>

      {/* Confidence distribution bar */}
      <div className="card p-5 mb-8 border-0 shadow-sm">
        <p className="text-sm font-semibold text-slate-900 mb-4">
          Confidence distribution (Last 30 days)
        </p>
        <div className="flex rounded-full overflow-hidden h-2 mb-3 bg-slate-100">
          <div style={{ width: "68%" }} className="bg-emerald-500" title="Answered (68%)" />
          <div style={{ width: "19%" }} className="bg-amber-500" title="In Review (19%)" />
          <div style={{ width: "13%" }} className="bg-red-500" title="Gap (13%)" />
        </div>
        <div className="flex gap-6">
          {[
            { label: "Answered", pct: "68%", color: "bg-emerald-500" },
            { label: "In Review", pct: "19%", color: "bg-amber-500" },
            { label: "Evidence Gap", pct: "13%", color: "bg-red-500" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <span className={`w-2 h-2 rounded-full ${s.color}`} />
              {s.label} <span className="text-slate-400">{s.pct}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Two-panel row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Recent queries */}
        <div className="card p-0 border-0 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <h2 className="font-semibold text-sm text-slate-900">Recent Queries</h2>
            <button className="text-xs font-medium text-blue-600 hover:text-blue-700">View all →</button>
          </div>
          <div className="divide-y divide-slate-100">
            {mockQueries.map((q, i) => (
              <div key={i} className="flex items-start justify-between gap-4 p-4 hover:bg-slate-50 transition-colors">
                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                  {q.q}
                </p>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <RouteChip route={q.route} conf={q.conf} />
                  <span className="text-xs text-slate-400 font-medium">
                    {q.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column stacked */}
        <div className="space-y-8">
          
          {/* Review queue preview */}
          <div className="card p-0 border-0 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="font-semibold text-sm text-slate-900">Review Queue</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-800">
                3 pending
              </span>
            </div>
            <div className="p-5">
              <div className="space-y-3">
                {mockQueries.filter((q) => q.route === "review").map((q, i) => (
                  <div key={i} className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                    <p className="text-sm font-medium text-slate-800 mb-3">{q.q}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 font-medium shadow-sm">
                        Conf: {(q.conf * 100).toFixed(0)}%
                      </span>
                      <button className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                        Review Answer →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Analytics teaser */}
          <div className="card p-5 border-0 shadow-sm">
            <h2 className="font-semibold text-sm text-slate-900 mb-4">Analytics</h2>
            <ComingSoon title="Query volume & latency metrics" phase="Phase 4" />
          </div>
        </div>
      </div>
    </div>
  );
}
