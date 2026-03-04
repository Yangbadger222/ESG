"use client";

import { useState } from "react";

interface AuditTask {
  id: number;
  title: string;
  status: string;
  overall_score: number | null;
  created_at: string;
  completed_at: string | null;
  supplier_count: number;
  standards: string[];
}

const MOCK_AUDITS: AuditTask[] = [
  {
    id: 1,
    title: "Q1 2026 CSRD Compliance Audit",
    status: "completed",
    overall_score: 72.5,
    created_at: "2026-01-15",
    completed_at: "2026-01-20",
    supplier_count: 12,
    standards: ["CSRD"],
  },
  {
    id: 2,
    title: "CBAM Carbon Assessment - EU Suppliers",
    status: "in_progress",
    overall_score: null,
    created_at: "2026-02-28",
    completed_at: null,
    supplier_count: 8,
    standards: ["CBAM"],
  },
  {
    id: 3,
    title: "New Supplier Onboarding Audit",
    status: "draft",
    overall_score: null,
    created_at: "2026-03-01",
    completed_at: null,
    supplier_count: 3,
    standards: ["CSRD", "CBAM"],
  },
];

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    in_progress: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    archived: "bg-gray-100 text-gray-500",
  };
  const labels: Record<string, string> = {
    draft: "Draft",
    in_progress: "In Progress",
    completed: "Completed",
    archived: "Archived",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>
      {labels[status] || status}
    </span>
  );
}

function ScoreGauge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-gray-400 text-sm">-</span>;
  const color = score >= 80 ? "text-green-600" : score >= 50 ? "text-amber-600" : "text-red-600";
  return <span className={`text-lg font-bold ${color}`}>{score}%</span>;
}

export default function AuditsPage() {
  const [audits] = useState<AuditTask[]>(MOCK_AUDITS);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Tasks</h1>
          <p className="text-gray-500 mt-1">Run ESG compliance audits against international standards</p>
        </div>
        <button className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700">
          + New Audit
        </button>
      </div>

      <div className="space-y-4">
        {audits.map((audit) => (
          <div key={audit.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{audit.title}</h3>
                  <StatusBadge status={audit.status} />
                </div>
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <span>{audit.supplier_count} suppliers</span>
                  <span>Standards: {audit.standards.join(", ")}</span>
                  <span>Created: {audit.created_at}</span>
                  {audit.completed_at && <span>Completed: {audit.completed_at}</span>}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <ScoreGauge score={audit.overall_score} />
                <div className="flex gap-2">
                  {audit.status === "draft" && (
                    <button className="px-3 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700">
                      Run Audit
                    </button>
                  )}
                  {audit.status === "completed" && (
                    <button className="px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100">
                      Generate Report
                    </button>
                  )}
                  <a
                    href={`/audits/${audit.id}`}
                    className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Details
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
