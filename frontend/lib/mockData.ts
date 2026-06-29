export const mockResponses = {
  answered: {
    answer: "Based on the provided guidelines, first-line treatment for H. pylori infection typically involves a proton pump inhibitor (PPI) combined with clarithromycin and amoxicillin or metronidazole for 14 days. If clarithromycin resistance is suspected to be high (>15%), bismuth quadruple therapy (PPI, bismuth, tetracycline, and a nitroimidazole) is recommended as the first-line empirical option.",
    confidence_score: 0.89,
    verifier_reason: "Multiple high-quality evidence chunks directly support the first-line therapies.",
    route: "answered",
    citations: [
      { document_title: "MedVerify_Dummy_H_Pylori_Guideline", page_number: 1, document_id: "doc-1" },
      { document_title: "MedVerify_Dummy_H_Pylori_Guideline", page_number: 2, document_id: "doc-1" }
    ],
    query_id: "mock-1"
  },
  review: {
    answer: "The available evidence has moderate confidence for this query. Your question has been forwarded to a clinical specialist for review. You will receive a verified response shortly.",
    confidence_score: 0.65,
    verifier_reason: "Evidence mentions generic treatments but lacks specific dosage for this age group.",
    route: "review",
    citations: [],
    query_id: "mock-2"
  },
  gap: {
    answer: "Insufficient clinical evidence was found in the knowledge base to answer this question reliably. Please consult a specialist directly. This gap has been logged for the documentation team to address.",
    confidence_score: 0.35,
    verifier_reason: "No evidence found regarding the specific experimental protocol.",
    route: "gap",
    citations: [],
    query_id: "mock-3"
  }
};

export const mockHistory = [
  {
    id: "history-1",
    query_text: "What is the first-line treatment for H. pylori?",
    answer_text: mockResponses.answered.answer,
    confidence_score: 0.89,
    route: "answered",
    citations: mockResponses.answered.citations,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  },
  {
    id: "history-2",
    query_text: "Dosage of amoxicillin for a 3-year old child?",
    answer_text: null,
    confidence_score: 0.65,
    route: "review",
    citations: [],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  },
  {
    id: "history-3",
    query_text: "Use of experimental drug X for stage 4 cancer?",
    answer_text: null,
    confidence_score: 0.15,
    route: "gap",
    citations: [],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
  }
];
