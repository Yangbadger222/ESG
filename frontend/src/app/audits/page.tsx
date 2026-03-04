"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { auditApi, supplierApi, reportApi } from "@/services/api";

interface AuditTask {
  id: number;
  title: string;
  status: string;
  overall_score: number | null;
  created_at: string;
  completed_at: string | null;
}

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
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status] || "bg-gray-100"}`}>
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
  const [audits, setAudits] = useState<AuditTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedStandards, setSelectedStandards] = useState<string[]>(["CSRD"]);
  const [suppliers, setSuppliers] = useState<{ id: number; name: string }[]>([]);
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<number[]>([]);
  const [creating, setCreating] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchAudits = () => {
    setLoading(true);
    auditApi.list()
      .then((data) => setAudits(data as unknown as AuditTask[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAudits(); }, []);

  const openCreate = async () => {
    setShowCreate(true);
    try {
      const sups = await supplierApi.list();
      setSuppliers(sups.map((s) => ({ id: s.id as number, name: s.name as string })));
    } catch { /* ignore */ }
  };

  const handleCreate = async () => {
    if (!title.trim() || selectedSupplierIds.length === 0 || selectedStandards.length === 0) return;
    setCreating(true);
    try {
      await auditApi.create({
        title,
        supplier_ids: selectedSupplierIds,
        standard_codes: selectedStandards,
      });
      setShowCreate(false);
      setTitle("");
      setSelectedSupplierIds([]);
      fetchAudits();
    } catch { /* ignore */ }
    setCreating(false);
  };

  const handleRun = async (id: number) => {
    setActionLoading(id);
    try {
      await auditApi.run(id);
      fetchAudits();
    } catch { /* ignore */ }
    setActionLoading(null);
  };

  const handleGenReport = async (id: number) => {
    setActionLoading(id);
    try {
      await reportApi.generate(id);
      alert("Report generated! Go to Reports page to download.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    }
    setActionLoading(null);
  };

  const toggleSupplier = (id: number) => {
    setSelectedSupplierIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleStandard = (code: string) => {
    setSelectedStandards((prev) =>
      prev.includes(code) ? prev.filter((x) => x !== code) : [...prev, code]
    );
  };

  return (
    <AppShell>
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Tasks</h1>
            <p className="text-gray-500 mt-1">Run ESG compliance audits against international standards</p>
          </div>
          <button onClick={openCreate} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700">
            + New Audit
          </button>
        </div>

        {loading ? (
          <div className="text-gray-400 text-sm py-20 text-center">Loading audits...</div>
        ) : audits.length === 0 ? (
          <div className="text-gray-400 text-sm py-20 text-center">No audits yet. Create one to get started.</div>
        ) : (
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
                      <span>Created: {new Date(audit.created_at).toLocaleDateString("zh-CN")}</span>
                      {audit.completed_at && <span>Completed: {new Date(audit.completed_at).toLocaleDateString("zh-CN")}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <ScoreGauge score={audit.overall_score} />
                    <div className="flex gap-2">
                      {audit.status === "draft" && (
                        <button
                          onClick={() => handleRun(audit.id)}
                          disabled={actionLoading === audit.id}
                          className="px-3 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                        >
                          {actionLoading === audit.id ? "Running..." : "Run Audit"}
                        </button>
                      )}
                      {audit.status === "completed" && (
                        <button
                          onClick={() => handleGenReport(audit.id)}
                          disabled={actionLoading === audit.id}
                          className="px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 disabled:opacity-50"
                        >
                          {actionLoading === audit.id ? "Generating..." : "Generate Report"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showCreate && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
            <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">New Audit Task</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Audit Title</label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Q1 2026 CSRD Compliance" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Standards</label>
                  <div className="flex gap-3">
                    {["CSRD", "CBAM"].map((code) => (
                      <label key={code} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={selectedStandards.includes(code)} onChange={() => toggleStandard(code)} className="rounded border-gray-300" />
                        {code}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Suppliers</label>
                  {suppliers.length === 0 ? (
                    <p className="text-xs text-gray-400">Loading suppliers...</p>
                  ) : (
                    <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto p-2 space-y-1">
                      {suppliers.map((s) => (
                        <label key={s.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 text-sm cursor-pointer">
                          <input type="checkbox" checked={selectedSupplierIds.includes(s.id)} onChange={() => toggleSupplier(s.id)} className="rounded border-gray-300" />
                          {s.name}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button onClick={handleCreate} disabled={creating || !title.trim() || selectedSupplierIds.length === 0} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50">
                  {creating ? "Creating..." : "Create Audit"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
