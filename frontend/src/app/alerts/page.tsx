"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { alertApi } from "@/services/api";

interface Alert {
  id: number;
  supplier_id: number;
  alert_type: string;
  severity: string;
  title: string;
  description: string | null;
  is_resolved: string;
  created_at: string;
}

const severityStyles: Record<string, string> = {
  critical: "bg-red-100 text-red-800 border-red-200",
  warning: "bg-amber-100 text-amber-800 border-amber-200",
  info: "bg-blue-100 text-blue-800 border-blue-200",
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState("");
  const [showResolved, setShowResolved] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [resolving, setResolving] = useState<number | null>(null);
  const [summaryCount, setSummaryCount] = useState({ critical: 0, warning: 0, resolved: 0 });

  const fetchAlerts = () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (filterSeverity) params.severity = filterSeverity;
    if (!showResolved) params.is_resolved = "false";
    alertApi.list(Object.keys(params).length > 0 ? params : undefined)
      .then((data) => setAlerts(data as unknown as Alert[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const fetchSummary = () => {
    Promise.all([
      alertApi.list({ severity: "critical", is_resolved: "false" }),
      alertApi.list({ severity: "warning", is_resolved: "false" }),
      alertApi.list({ is_resolved: "true", limit: "200" }),
    ])
      .then(([c, w, r]) =>
        setSummaryCount({ critical: c.length, warning: w.length, resolved: r.length })
      )
      .catch(() => {});
  };

  useEffect(() => { fetchAlerts(); fetchSummary(); }, [filterSeverity, showResolved]);

  const handleScan = async () => {
    setScanning(true);
    try {
      const res = await alertApi.scan();
      alert(`Scan complete. ${res.new_alerts} new alerts created.`);
      fetchAlerts();
      fetchSummary();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Scan failed");
    }
    setScanning(false);
  };

  const handleResolve = async (id: number) => {
    setResolving(id);
    try {
      await alertApi.resolve(id);
      fetchAlerts();
      fetchSummary();
    } catch { /* ignore */ }
    setResolving(null);
  };

  return (
    <AppShell>
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Compliance Alerts</h1>
            <p className="text-gray-500 mt-1">Monitor supplier compliance risks and certification status</p>
          </div>
          <button
            onClick={handleScan}
            disabled={scanning}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {scanning ? "Scanning..." : "Scan Now"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600 font-medium">Critical</p>
          <p className="text-2xl font-bold text-red-800">{summaryCount.critical}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-600 font-medium">Warning</p>
          <p className="text-2xl font-bold text-amber-800">{summaryCount.warning}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600 font-medium">Resolved</p>
          <p className="text-2xl font-bold text-green-800">{summaryCount.resolved}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} className="rounded border-gray-300" />
            Show Resolved
          </label>
        </div>

        {loading ? (
          <div className="text-gray-400 text-sm py-20 text-center">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="text-gray-400 text-sm py-20 text-center">No alerts. Click &quot;Scan Now&quot; to check for compliance issues.</div>
        ) : (
          <div className="space-y-3">
            {alerts.map((a) => {
              const style = severityStyles[a.severity] || severityStyles.info;
              return (
                <div
                  key={a.id}
                  className={`bg-white border rounded-xl p-5 hover:shadow-md transition-shadow ${a.is_resolved === "true" ? "opacity-60" : ""}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <span className={`px-2 py-1 border rounded-md text-xs font-bold mt-0.5 ${style}`}>
                        {a.severity.toUpperCase()}
                      </span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{a.title}</h3>
                        {a.description && <p className="text-sm text-gray-500 mt-1">{a.description}</p>}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <span>Type: {a.alert_type}</span>
                          <span>Date: {new Date(a.created_at).toLocaleDateString("zh-CN")}</span>
                        </div>
                      </div>
                    </div>
                    {a.is_resolved === "false" && (
                      <button
                        onClick={() => handleResolve(a.id)}
                        disabled={resolving === a.id}
                        className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 disabled:opacity-50"
                      >
                        {resolving === a.id ? "..." : "Resolve"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
