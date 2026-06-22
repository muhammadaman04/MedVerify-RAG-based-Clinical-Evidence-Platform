"use client";

import { useAuthStore } from "@/store/authStore";

// ─── Metric card ─────────────────────────────────────────────────────────────
function MetricCard({
  label,
  value,
  sub,
  color = "var(--primary)",
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  color?: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="glass rounded-2xl p-5 card-hover"
      style={{ border: "1px solid var(--border)" }}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}18`, color }}
        >
          {icon}
        </div>
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
        >
          Last 30d
        </span>
      </div>
      <div className="text-3xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
        {value}
      </div>
      <div className="text-sm" style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
      <div className="text-xs mt-1" style={{ color }}>
        {sub}
      </div>
    </div>
  );
}

// ─── Skeleton placeholder ─────────────────────────────────────────────────────
function ComingSoon({ title, phase }: { title: string; phase: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 rounded-2xl" style={{ border: "1px dashed var(--border)" }}>
      <p className="font-medium mb-1" style={{ color: "var(--text-secondary)" }}>{title}</p>
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>Coming in {phase}</p>
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
    answered: { label: "Answered", color: "var(--success)", bg: "var(--success-dim)" },
    review: { label: "In Review", color: "var(--warning)", bg: "var(--warning-dim)" },
    gap: { label: "Evidence Gap", color: "var(--danger)", bg: "var(--danger-dim)" },
  };
  const s = map[route];
  return (
    <div className="flex items-center gap-2">
      <span
        className="text-xs px-2 py-0.5 rounded-full font-medium"
        style={{ background: s.bg, color: s.color }}
      >
        {s.label}
      </span>
      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
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
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
          {greeting}, {user?.name?.split(" ")[0] ?? "Admin"} 👋
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Here&apos;s what&apos;s happening across MedVerify today.
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Total queries"
          value="1,284"
          sub="↑ 12% from last month"
          color="var(--primary)"
          icon={
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
            </svg>
          }
        />
        <MetricCard
          label="Avg confidence score"
          value="0.82"
          sub="↑ Above 0.75 target"
          color="var(--success)"
          icon={
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <MetricCard
          label="Open knowledge gaps"
          value="34"
          sub="12 asked 3+ times"
          color="var(--danger)"
          icon={
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          }
        />
        <MetricCard
          label="Stale documents"
          value="3"
          sub="Need re-ingestion"
          color="var(--warning)"
          icon={
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          }
        />
      </div>

      {/* Confidence distribution bar */}
      <div className="glass rounded-2xl p-5 mb-6">
        <p className="text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>
          Confidence distribution — last 30 days
        </p>
        <div className="flex rounded-full overflow-hidden h-3">
          <div style={{ width: "68%", background: "var(--success)" }} title="Answered (68%)" />
          <div style={{ width: "19%", background: "var(--warning)" }} title="In Review (19%)" />
          <div style={{ width: "13%", background: "var(--danger)" }} title="Gap (13%)" />
        </div>
        <div className="flex gap-5 mt-2">
          {[
            { label: "Answered", pct: "68%", color: "var(--success)" },
            { label: "In Review", pct: "19%", color: "var(--warning)" },
            { label: "Evidence Gap", pct: "13%", color: "var(--danger)" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
              <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
              {s.label} {s.pct}
            </div>
          ))}
        </div>
      </div>

      {/* Two-panel row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent queries */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
              Recent Queries
            </h2>
            <span className="text-xs" style={{ color: "var(--primary)", cursor: "pointer" }}>
              View all →
            </span>
          </div>
          <div className="space-y-3">
            {mockQueries.map((q, i) => (
              <div
                key={i}
                className="flex items-start justify-between gap-3 p-3 rounded-xl"
                style={{ background: "var(--surface-2)" }}
              >
                <p
                  className="text-xs flex-1 leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {q.q}
                </p>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <RouteChip route={q.route} conf={q.conf} />
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {q.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column stacked */}
        <div className="space-y-6">
          {/* Review queue preview */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                Review Queue
              </h2>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: "var(--warning-dim)", color: "var(--warning)" }}
              >
                3 pending
              </span>
            </div>
            <div className="space-y-3">
              {mockQueries.filter((q) => q.route === "review").map((q, i) => (
                <div key={i} className="p-3 rounded-xl" style={{ background: "var(--surface-2)" }}>
                  <p className="text-xs mb-2" style={{ color: "var(--text-secondary)" }}>{q.q}</p>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: "var(--warning-dim)", color: "var(--warning)" }}
                    >
                      Low confidence · {(q.conf * 100).toFixed(0)}%
                    </span>
                    <button
                      className="text-xs ml-auto"
                      style={{ color: "var(--primary)" }}
                    >
                      Review →
                    </button>
                  </div>
                </div>
              ))}
              <ComingSoon title="Full review queue" phase="Phase 4" />
            </div>
          </div>

          {/* Analytics teaser */}
          <div className="glass rounded-2xl p-5">
            <h2 className="font-semibold text-sm mb-3" style={{ color: "var(--text-primary)" }}>
              Analytics
            </h2>
            <ComingSoon title="Charts & analytics" phase="Phase 4" />
          </div>
        </div>
      </div>
    </div>
  );
}
