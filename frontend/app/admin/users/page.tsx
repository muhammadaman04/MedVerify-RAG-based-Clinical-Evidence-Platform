"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "clinician";
  status: "pending" | "active" | "deactivated";
  created_at: string;
  last_active_at: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: User["status"] }) {
  const map = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    deactivated: "bg-slate-100 text-slate-500 border-slate-200",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full border ${map[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "active" ? "bg-emerald-500" : status === "pending" ? "bg-amber-500" : "bg-slate-400"}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function RoleBadge({ role }: { role: User["role"] }) {
  return (
    <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-md ${
      role === "admin" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"
    }`}>
      {role}
    </span>
  );
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Invite Modal ─────────────────────────────────────────────────────────────
function InviteModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (link: string, email: string) => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"clinician" | "admin">("clinician");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError("Email is required."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/admin/invite", { email: email.toLowerCase(), role });
      onSuccess(res.data.invite_link, email.toLowerCase());
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to send invite.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h2 className="font-semibold text-slate-900">Invite team member</h2>
            <p className="text-xs text-slate-500 mt-0.5">They will receive an email to set their password.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="input-field" placeholder="dr.james@hospital.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
            <div className="grid grid-cols-2 gap-3">
              {(["clinician", "admin"] as const).map(r => (
                <button
                  key={r} type="button" onClick={() => setRole(r)}
                  className={`p-3 rounded-lg border text-sm font-medium text-left transition-all ${
                    role === r
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <div className="font-semibold capitalize mb-0.5">{r}</div>
                  <div className={`text-xs ${role === r ? "text-blue-600" : "text-slate-400"}`}>
                    {r === "clinician" ? "Can ask questions" : "Full admin access"}
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? "Sending..." : "Send invite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Success Modal ────────────────────────────────────────────────────────────
function InviteSentModal({ link, email, onClose }: { link: string; email: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md mx-4 p-6">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="font-semibold text-slate-900 mb-1">Invite sent!</h2>
          <p className="text-sm text-slate-500">
            An invite email has been sent to <strong>{email}</strong>. The link expires in 48 hours.
          </p>
        </div>
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-3 mb-4">
          <p className="text-xs font-medium text-slate-500 mb-1.5">Invite link (dev mode)</p>
          <p className="text-xs text-slate-700 break-all leading-relaxed">{link}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={copy} className="btn-secondary flex-1 text-sm">
            {copied ? "✓ Copied!" : "Copy link"}
          </button>
          <button onClick={onClose} className="btn-primary flex-1 text-sm">Done</button>
        </div>
      </div>
    </div>
  );
}

// ─── Confirm Deactivate Modal ─────────────────────────────────────────────────
function DeactivateModal({ user, onClose, onConfirm }: { user: User; onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm mx-4 p-6">
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="font-semibold text-slate-900 mb-1">Deactivate account?</h2>
        <p className="text-sm text-slate-600 mb-6">
          <strong>{user.name}</strong> ({user.email}) will immediately lose access to MedVerify. You can re-activate them later.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={onConfirm}
            className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
          >
            Deactivate
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | User["status"]>("all");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ link: string; email: string } | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data.users);
    } catch {
      setError("Failed to load users. Check that the backend is running.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleDeactivate = async (user: User) => {
    setActionLoading(user.id);
    try {
      await api.patch(`/admin/users/${user.id}`, { status: "deactivated" });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: "deactivated" } : u));
    } catch {
      // silently fail for now
    } finally {
      setActionLoading(null);
      setDeactivateTarget(null);
    }
  };

  const handleReactivate = async (user: User) => {
    setActionLoading(user.id);
    try {
      await api.patch(`/admin/users/${user.id}`, { status: "active" });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: "active" } : u));
    } catch {
      // silently fail
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = filter === "all" ? users : users.filter(u => u.status === filter);

  const counts = {
    all: users.length,
    active: users.filter(u => u.status === "active").length,
    pending: users.filter(u => u.status === "pending").length,
    deactivated: users.filter(u => u.status === "deactivated").length,
  };

  return (
    <>
      {/* Modals */}
      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onSuccess={(link, email) => {
            setShowInvite(false);
            setInviteResult({ link, email });
            loadUsers();
          }}
        />
      )}
      {inviteResult && (
        <InviteSentModal
          link={inviteResult.link}
          email={inviteResult.email}
          onClose={() => { setInviteResult(null); loadUsers(); }}
        />
      )}
      {deactivateTarget && (
        <DeactivateModal
          user={deactivateTarget}
          onClose={() => setDeactivateTarget(null)}
          onConfirm={() => handleDeactivate(deactivateTarget)}
        />
      )}

      <div className="p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Team Members</h1>
            <p className="text-sm text-slate-500 mt-1">Manage clinician and admin access to MedVerify.</p>
          </div>
          <button onClick={() => setShowInvite(true)} className="btn-primary gap-2">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
            </svg>
            Invite member
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 mb-6 bg-slate-100 p-1 rounded-lg w-fit">
          {(["all", "active", "pending", "deactivated"] as const).map(f => (
            <button
              key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                filter === f
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className={`ml-1.5 text-xs ${filter === f ? "text-slate-500" : "text-slate-400"}`}>
                {counts[f]}
              </span>
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">{error}</div>
        )}

        {/* Table */}
        <div className="card border-0 shadow-sm overflow-hidden">
          {loading ? (
            <div className="divide-y divide-slate-100">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
                  <div className="w-9 h-9 rounded-full bg-slate-200 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-200 rounded w-40" />
                    <div className="h-3 bg-slate-100 rounded w-56" />
                  </div>
                  <div className="h-5 bg-slate-200 rounded-full w-16" />
                  <div className="h-5 bg-slate-100 rounded-full w-20" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              <p className="font-medium text-slate-600 mb-1">No {filter === "all" ? "" : filter} users</p>
              <p className="text-sm text-slate-400">
                {filter === "all" ? "Invite your first team member to get started." : `No users with '${filter}' status.`}
              </p>
              {filter === "all" && (
                <button onClick={() => setShowInvite(true)} className="btn-primary mt-4 text-sm">
                  Send first invite
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Table header */}
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-6 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <span>Member</span>
                <span>Role</span>
                <span>Status</span>
                <span>Last active</span>
                <span></span>
              </div>
              <div className="divide-y divide-slate-100">
                {filtered.map(user => (
                  <div key={user.id} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center px-6 py-4 hover:bg-slate-50 transition-colors">
                    {/* Name + email */}
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-sm font-semibold text-slate-600 flex-shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                    <RoleBadge role={user.role} />
                    <StatusBadge status={user.status} />
                    <span className="text-xs text-slate-400 font-medium">
                      {timeAgo(user.last_active_at)}
                    </span>
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {user.status === "active" && (
                        <button
                          onClick={() => setDeactivateTarget(user)}
                          disabled={actionLoading === user.id}
                          className="text-xs font-medium text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-200 px-2.5 py-1 rounded-md transition-colors"
                        >
                          Deactivate
                        </button>
                      )}
                      {user.status === "deactivated" && (
                        <button
                          onClick={() => handleReactivate(user)}
                          disabled={actionLoading === user.id}
                          className="text-xs font-medium text-slate-500 hover:text-emerald-600 border border-slate-200 hover:border-emerald-200 px-2.5 py-1 rounded-md transition-colors"
                        >
                          {actionLoading === user.id ? "..." : "Reactivate"}
                        </button>
                      )}
                      {user.status === "pending" && (
                        <span className="text-xs text-amber-600 font-medium">Invite pending</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
