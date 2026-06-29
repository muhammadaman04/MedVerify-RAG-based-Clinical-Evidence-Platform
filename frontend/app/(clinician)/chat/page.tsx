"use client";

import { useState, useRef, useEffect } from "react";
import { Send, AlertCircle, CheckCircle2, ChevronRight, FileText, Loader2 } from "lucide-react";
import { mockResponses } from "@/lib/mockData";
import { useAuthStore } from "@/store/authStore";

// Type definitions
type RouteType = "answered" | "review" | "gap";

interface Citation {
  document_title: string;
  page_number?: number | null;
  document_id: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  confidence_score?: number;
  route?: RouteType;
  citations?: Citation[];
  verifier_reason?: string;
}

export default function ChatPage() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { token } = useAuthStore();
  
  // Use mock data flag
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK === "true";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const simulateStreaming = async (text: string, messageId: string, metadata: any) => {
    // Add empty message first
    setMessages(prev => [...prev, { id: messageId, role: "assistant", content: "" }]);
    
    // Simulate streaming word by word
    const words = text.split(" ");
    let currentText = "";
    
    for (let i = 0; i < words.length; i++) {
      currentText += (i === 0 ? "" : " ") + words[i];
      setMessages(prev => 
        prev.map(m => m.id === messageId ? { ...m, content: currentText } : m)
      );
      // Random delay between 20ms and 60ms
      await new Promise(r => setTimeout(r, Math.random() * 40 + 20));
    }
    
    // Once streaming is done, append metadata (confidence, route, citations)
    setMessages(prev => 
      prev.map(m => m.id === messageId ? { ...m, ...metadata } : m)
    );
    setIsTyping(false);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: query.trim()
    };

    setMessages(prev => [...prev, userMsg]);
    setQuery("");
    setIsTyping(true);

    const assistantMsgId = (Date.now() + 1).toString();

    try {
      if (useMock) {
        // Mock mode: Decide route based on query content
        let mockRes = mockResponses.gap;
        const q = userMsg.content.toLowerCase();
        
        if (q.includes("h. pylori") || q.includes("treatment")) {
          mockRes = mockResponses.answered;
        } else if (q.includes("dosage") || q.includes("child")) {
          mockRes = mockResponses.review;
        }

        // Simulate network delay
        await new Promise(r => setTimeout(r, 600));
        
        const { answer, ...metadata } = mockRes;
        await simulateStreaming(answer, assistantMsgId, metadata);

      } else {
        // Real API call
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/query`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ query: userMsg.content })
        });

        if (!response.ok) {
          throw new Error("Failed to fetch response");
        }

        const data = await response.json();
        const { answer, ...metadata } = data;
        
        // Even with JSON, we can simulate typewriter effect for better UX
        await simulateStreaming(answer, assistantMsgId, metadata);
      }
    } catch (error) {
      console.error(error);
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: assistantMsgId,
        role: "assistant",
        content: "Sorry, there was an error processing your request. Please try again."
      }]);
    }
  };

  const renderConfidencePill = (route?: RouteType, score?: number) => {
    if (!route) return null;

    if (route === "answered") {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium border border-emerald-200 mt-3">
          <CheckCircle2 className="w-4 h-4" />
          High Confidence — {score?.toFixed(2)}
        </div>
      );
    }
    
    if (route === "review") {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-sm font-medium border border-amber-200 mt-3">
          <AlertCircle className="w-4 h-4" />
          Under Review
        </div>
      );
    }
    
    if (route === "gap") {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-sm font-medium border border-red-200 mt-3">
          <AlertCircle className="w-4 h-4" />
          Insufficient Evidence
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header */}
      <header className="h-16 flex items-center px-6 border-b border-slate-200 bg-white z-10 sticky top-0">
        <h1 className="text-xl font-semibold text-slate-800">Clinical Verification</h1>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-32">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-4">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">How can I help you today?</h2>
              <p className="text-slate-500 max-w-md">
                Ask a clinical question. MedVerify will search the approved knowledge base, evaluate the evidence, and provide a cited answer.
              </p>
              
              <div className="mt-8 grid grid-cols-1 gap-3 w-full max-w-lg text-left">
                {["What is the first-line treatment for H. pylori?", "What is the recommended dosage of amoxicillin for a 3-year old?"].map((suggestion, i) => (
                  <button 
                    key={i}
                    onClick={() => setQuery(suggestion)}
                    className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-slate-700"
                  >
                    <span className="text-sm font-medium">{suggestion}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`flex items-start gap-3 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                    msg.role === "user" ? "bg-slate-800 text-white" : "bg-blue-600 text-white"
                  }`}>
                    {msg.role === "user" ? "U" : <ShieldCheck className="w-4 h-4" />}
                  </div>

                  {/* Bubble */}
                  <div className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    <div className={`px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed ${
                      msg.role === "user" 
                        ? "bg-slate-800 text-white rounded-tr-sm" 
                        : "bg-slate-50 text-slate-800 border border-slate-200 rounded-tl-sm"
                    }`}>
                      {msg.content || (
                        <div className="flex items-center gap-2 text-slate-500 h-6">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm font-medium">Thinking...</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Metadata (Confidence, route, citations) */}
                    {msg.role === "assistant" && msg.route && (
                      <div className="flex flex-col items-start mt-1">
                        {renderConfidencePill(msg.route, msg.confidence_score)}
                        
                        {msg.citations && msg.citations.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {msg.citations.map((cit, idx) => (
                              <div key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-xs text-slate-600 shadow-sm hover:border-slate-300 hover:shadow transition-all cursor-pointer">
                                <FileText className="w-3 h-3 text-blue-500" />
                                {cit.document_title}
                                {cit.page_number && <span className="text-slate-400">— p.{cit.page_number}</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent pt-10">
        <div className="max-w-3xl mx-auto relative">
          <form 
            onSubmit={handleSubmit}
            className="flex items-end gap-2 bg-white border border-slate-200 shadow-sm rounded-2xl p-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all"
          >
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Ask a clinical question... (Press Enter to submit)"
              className="w-full max-h-32 min-h-[44px] resize-none border-0 focus:ring-0 text-[15px] p-3 text-slate-800 bg-transparent"
              rows={1}
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!query.trim() || isTyping}
              className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-xl bg-blue-600 text-white disabled:bg-slate-100 disabled:text-slate-400 transition-colors mb-0.5 mr-0.5"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <div className="text-center mt-2 text-xs text-slate-400">
            MedVerify provides evidence-backed clinical information. Not a substitute for professional judgement.
          </div>
        </div>
      </div>
    </div>
  );
}
