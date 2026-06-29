"use client";

import { useEffect, useState } from "react";
import { Clock, AlertCircle, CheckCircle2, FileText, ChevronRight, Search } from "lucide-react";
import { mockHistory } from "@/lib/mockData";
import { useAuthStore } from "@/store/authStore";

interface Citation {
  document_title: string;
  page_number?: number | null;
  document_id: string;
}

interface QueryHistory {
  id: string;
  query_text: string;
  answer_text: string | null;
  confidence_score: number;
  route: "answered" | "review" | "gap";
  citations: Citation[];
  created_at: string;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<QueryHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { token } = useAuthStore();

  const useMock = process.env.NEXT_PUBLIC_USE_MOCK === "true";

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        if (useMock) {
          // Simulate network delay
          await new Promise(r => setTimeout(r, 400));
          setHistory(mockHistory as QueryHistory[]);
        } else {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/queries/me`, {
            headers: {
              "Authorization": `Bearer ${token}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            setHistory(data.queries || []);
          }
        }
      } catch (err) {
        console.error("Failed to fetch history", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [useMock, token]);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const renderBadge = (route: string) => {
    if (route === "answered") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
          <CheckCircle2 className="w-3 h-3" /> Answered
        </span>
      );
    }
    if (route === "review") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200">
          <AlertCircle className="w-3 h-3" /> Under Review
        </span>
      );
    }
    if (route === "gap") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 text-xs font-medium border border-red-200">
          <AlertCircle className="w-3 h-3" /> Insufficient Evidence
        </span>
      );
    }
    return null;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins || 1} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <header className="h-16 flex items-center px-6 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-500" />
          <h1 className="text-xl font-semibold text-slate-800">My Query History</h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p>Loading history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-1">No queries yet</h3>
              <p className="text-slate-500 max-w-sm mb-6">You haven't asked any clinical questions yet. Head over to the chat to get started.</p>
              <a href="/chat" className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                New Query
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => {
                const isExpanded = expandedId === item.id;
                
                return (
                  <div key={item.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:border-slate-300 transition-colors">
                    <button 
                      onClick={() => toggleExpand(item.id)}
                      className="w-full flex items-start gap-4 p-5 text-left focus:outline-none"
                    >
                      <div className="pt-0.5">
                        <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1.5">
                          {renderBadge(item.route)}
                          <span className="text-xs text-slate-400 font-medium">{formatDate(item.created_at)}</span>
                        </div>
                        <h3 className="text-base font-medium text-slate-900 truncate">
                          {item.query_text}
                        </h3>
                      </div>
                    </button>
                    
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-2 pl-14 border-t border-slate-100">
                        <div className="bg-slate-50 rounded-lg p-4 text-[14px] text-slate-700 leading-relaxed border border-slate-100">
                          {item.answer_text ? item.answer_text : (
                            <span className="italic text-slate-500">
                              {item.route === "review" ? "Draft answer is under review by a clinical specialist." : "No answer was generated due to insufficient evidence."}
                            </span>
                          )}
                        </div>
                        
                        {item.citations && item.citations.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Sources Cited</h4>
                            <div className="flex flex-wrap gap-2">
                              {item.citations.map((cit, idx) => (
                                <div key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-xs text-slate-600 shadow-sm">
                                  <FileText className="w-3 h-3 text-blue-500" />
                                  {cit.document_title}
                                  {cit.page_number && <span className="text-slate-400">— p.{cit.page_number}</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
