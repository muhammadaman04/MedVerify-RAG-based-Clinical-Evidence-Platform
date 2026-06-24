"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import api from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Document {
  id: string;
  title: string;
  file_type: "pdf" | "docx";
  status: "processing" | "ready" | "failed";
  ocr_used: boolean;
  freshness_status: "fresh" | "stale" | "critical";
  created_at: string;
  last_ingested_at: string | null;
  chunk_count: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function FreshnessDot({ status }: { status: Document["freshness_status"] }) {
  const colors = { fresh: "bg-emerald-500", stale: "bg-amber-500", critical: "bg-red-500" };
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[status]}`} title={status} />;
}

function StatusBadge({ status }: { status: Document["status"] }) {
  if (status === "ready") return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Ready
    </span>
  );
  if (status === "processing") return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />Processing
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />Failed
    </span>
  );
}

function FileTypeBadge({ type }: { type: string }) {
  return (
    <span className={`inline-flex text-xs font-semibold px-2 py-0.5 rounded uppercase tracking-wide ${
      type === "pdf" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"
    }`}>{type}</span>
  );
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// ─── Upload Zone ──────────────────────────────────────────────────────────────
function UploadZone({ onUploadSuccess }: { onUploadSuccess: (docId: string) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const ACCEPTED = ["application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

  const handleFile = (f: File) => {
    if (!ACCEPTED.includes(f.type)) {
      setError("Only PDF and DOCX files are accepted.");
      return;
    }
    setFile(f);
    setError("");
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setError("Please select a file."); return; }
    if (!title.trim()) { setError("Please enter a title."); return; }

    setUploading(true);
    setProgress(0);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title.trim());

    try {
      const res = await api.post("/admin/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (ev) => {
          if (ev.total) setProgress(Math.round((ev.loaded / ev.total) * 100));
        },
      });
      setFile(null);
      setTitle("");
      setProgress(0);
      onUploadSuccess(res.data.document_id);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="card bg-white border-0 shadow-sm p-6 mb-8">
      <h2 className="text-base font-semibold text-slate-900 mb-4">Upload Document</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Drop zone */}
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            dragging
              ? "border-blue-500 bg-blue-50"
              : file
              ? "border-emerald-400 bg-emerald-50"
              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
          }`}
        >
          <input
            ref={inputRef} type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          {file ? (
            <div className="flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                file.type === "application/pdf" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
              }`}>
                {file.type === "application/pdf" ? "PDF" : "DOC"}
              </div>
              <p className="font-medium text-slate-900 text-sm">{file.name}</p>
              <p className="text-xs text-slate-400">{formatBytes(file.size)}</p>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setFile(null); setTitle(""); }}
                className="text-xs text-slate-400 hover:text-red-500 underline"
              >Remove</button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <p className="text-sm font-medium text-slate-600">
                Drop a file here, or <span className="text-blue-600">browse</span>
              </p>
              <p className="text-xs text-slate-400">PDF or DOCX · Max 50 MB</p>
            </div>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Document title</label>
          <input
            type="text" value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field" placeholder="e.g. NICE Guideline CG160 — Atrial Fibrillation"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {/* Progress */}
        {uploading && (
          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Uploading…</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            className="btn-primary"
            disabled={uploading || !file}
          >
            {uploading ? "Uploading…" : "Upload & Process"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Processing Status Card ───────────────────────────────────────────────────
function ProcessingCard({ documentId, title, onComplete }: {
  documentId: string;
  title: string;
  onComplete: () => void;
}) {
  const [status, setStatus] = useState<"processing" | "ready" | "failed">("processing");
  const [chunkCount, setChunkCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await api.get(`/admin/documents/${documentId}/status`);
        setStatus(res.data.status);
        setChunkCount(res.data.chunk_count);
        if (res.data.status === "ready" || res.data.status === "failed") {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setTimeout(onComplete, 2000); // Let the user see the result for 2s
        }
      } catch { /* ignore */ }
    };

    poll();
    intervalRef.current = setInterval(poll, 3000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [documentId]);

  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border mb-4 ${
      status === "ready" ? "bg-emerald-50 border-emerald-200"
      : status === "failed" ? "bg-red-50 border-red-200"
      : "bg-blue-50 border-blue-200"
    }`}>
      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
        status === "ready" ? "bg-emerald-100" : status === "failed" ? "bg-red-100" : "bg-blue-100"
      }`}>
        {status === "processing" && (
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        )}
        {status === "ready" && (
          <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        )}
        {status === "failed" && (
          <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-900">{title}</p>
        <p className={`text-xs mt-0.5 ${
          status === "ready" ? "text-emerald-700"
          : status === "failed" ? "text-red-700"
          : "text-blue-700"
        }`}>
          {status === "processing" && "Extracting text, embedding chunks…"}
          {status === "ready" && `Ready · ${chunkCount} chunks indexed`}
          {status === "failed" && "Processing failed. Check the backend logs."}
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingDocs, setProcessingDocs] = useState<{ id: string; title: string }[]>([]);

  const loadDocuments = useCallback(async () => {
    try {
      const res = await api.get("/admin/documents");
      setDocuments(res.data.documents);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDocuments(); }, [loadDocuments]);

  const handleUploadSuccess = (docId: string) => {
    // Add to the live processing cards
    setProcessingDocs(prev => [...prev, { id: docId, title: "Document" }]);
    loadDocuments();
  };

  const handleProcessingComplete = (docId: string) => {
    setProcessingDocs(prev => prev.filter(d => d.id !== docId));
    loadDocuments();
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
        <p className="text-sm text-slate-500 mt-1">Upload PDFs and DOCX files to build the clinical evidence knowledge base.</p>
      </div>

      {/* Upload zone */}
      <UploadZone onUploadSuccess={handleUploadSuccess} />

      {/* Active processing cards */}
      {processingDocs.map(d => (
        <ProcessingCard
          key={d.id}
          documentId={d.id}
          title={d.title}
          onComplete={() => handleProcessingComplete(d.id)}
        />
      ))}

      {/* Documents table */}
      <div className="card bg-white border-0 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Uploaded Documents</h2>
          <span className="text-xs text-slate-400 font-medium">{documents.length} total</span>
        </div>

        {loading ? (
          <div className="divide-y divide-slate-100">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
                <div className="w-8 h-8 rounded-lg bg-slate-200 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-200 rounded w-56" />
                  <div className="h-3 bg-slate-100 rounded w-32" />
                </div>
                <div className="h-5 bg-slate-200 rounded-full w-16" />
              </div>
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <p className="font-medium text-slate-600 mb-1">No documents yet</p>
            <p className="text-sm text-slate-400">Upload your first PDF or DOCX to get started.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-4 px-6 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <span></span>
              <span>Document</span>
              <span>Status</span>
              <span>Chunks</span>
              <span>Freshness</span>
              <span>Uploaded</span>
              <span></span>
            </div>
            <div className="divide-y divide-slate-100">
              {documents.map(doc => (
                <div key={doc.id} className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-4 items-center px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    doc.file_type === "pdf" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                  }`}>
                    {doc.file_type.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{doc.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {doc.ocr_used && (
                        <span className="text-xs text-amber-600 font-medium bg-amber-50 px-1.5 py-0.5 rounded">OCR</span>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={doc.status} />
                  <span className="text-sm text-slate-500 font-medium tabular-nums">
                    {doc.chunk_count > 0 ? doc.chunk_count.toLocaleString() : "—"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <FreshnessDot status={doc.freshness_status} />
                    <span className="text-xs text-slate-500 capitalize">{doc.freshness_status}</span>
                  </div>
                  <span className="text-xs text-slate-400">{formatDate(doc.created_at)}</span>
                  <button className="text-xs font-medium text-slate-400 hover:text-red-600 border border-slate-200 hover:border-red-200 px-2.5 py-1 rounded-md transition-colors">
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
