"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import { matchApi } from "@/services/api";

interface MatchResult {
  supplier_id: number;
  name: string;
  country: string | null;
  category: string | null;
  tier: string;
  risk_level: string;
  match_score: number;
  certifications: string[];
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? "bg-green-500" : score >= 60 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <div className="w-32 bg-gray-100 rounded-full h-2.5">
        <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-sm font-bold ${score >= 80 ? "text-green-600" : score >= 60 ? "text-amber-600" : "text-red-600"}`}>
        {score}%
      </span>
    </div>
  );
}

export default function MatchPage() {
  const [requirement, setRequirement] = useState("");
  const [results, setResults] = useState<MatchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleMatch = async () => {
    if (!requirement.trim()) return;
    setLoading(true);
    setError("");
    try {
      const data = await matchApi.match(requirement);
      setResults(data as unknown as MatchResult[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Matching failed");
    }
    setLoading(false);
  };

  return (
    <AppShell>
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">AI Supplier Matching</h1>
          <p className="text-gray-500 mt-1">Describe your procurement needs in natural language, and our AI will match the best-fit suppliers</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">Describe your requirements</label>
          <textarea
            value={requirement}
            onChange={(e) => setRequirement(e.target.value)}
            placeholder="e.g., I need a GOTS-certified organic cotton fabric supplier in China with low carbon emissions..."
            className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
          />
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-gray-400">Supports English and Chinese. Parses materials, certifications, regions, and sustainability criteria.</p>
            <button
              onClick={handleMatch}
              disabled={loading || !requirement.trim()}
              className="px-6 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Analyzing..." : "Find Suppliers"}
            </button>
          </div>
        </div>

        {results && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Matched Suppliers ({results.length} results)
            </h2>
            {results.length === 0 ? (
              <div className="text-gray-400 text-sm py-10 text-center">No matching suppliers found. Try broadening your criteria.</div>
            ) : (
              <div className="space-y-4">
                {results.map((r, idx) => (
                  <div key={r.supplier_id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">{idx + 1}</div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{r.name}</h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                            <span>{r.country || "Unknown"}</span>
                            <span className="capitalize">{r.category || "-"}</span>
                            <span className="uppercase text-xs">{r.tier.replace("_", " ")}</span>
                          </div>
                          <div className="flex gap-1.5 mt-2">
                            {r.certifications.map((c) => (
                              <span key={c} className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full font-medium border border-green-200">{c}</span>
                            ))}
                            {r.certifications.length === 0 && <span className="text-xs text-gray-400">No certifications</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400 mb-1">Match Score</p>
                        <ScoreBar score={r.match_score} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
