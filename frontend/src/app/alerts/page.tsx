"use client";

import { useState } from "react";

interface Alert {
  id: number;
  supplier_name: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string;
  is_resolved: string;
  created_at: string;
}

const MOCK_ALERTS: Alert[] = [
  {
    id: 1, supplier_name: "DyeWorks Vietnam", alert_type: "high_carbon_emissions", severity: "critical",
    title: "Critical carbon emissions level", description: "DyeWorks Vietnam: carbon_emissions = 25000 (critical threshold: 20000)",
    is_resolved: "false", created_at: "2026-03-01",
  },
  {
    id: 2, supplier_name: "TextileCo Shanghai", alert_type: "expired_certification", severity: "critical",
    title: "Expired certification: GOTS", description: "Certification 'GOTS' for TextileCo Shanghai expired on 2025-12-31.",
    is_resolved: "false", created_at: "2026-01-02",
  },
  {
    id: 3, supplier_name: "ChemDye Jiangsu", alert_type: "missing_green_certification", severity: "warning",
    title: "No green certification found for ChemDye Jiangsu", description: "Supplier lacks internationally recognized green certifications (GOTS, OEKO-TEX, Bluesign...).",
    is_resolved: "false", created_at: "2026-02-15",
  },
  {
    id: 4, supplier_name: "FabricMill India", alert_type: "no_esg_data", severity: "warning",
    title: "No ESG data for FabricMill India", description: "Supplier has not submitted any ESG records.",
    is_resolved: "false", created_at: "2026-02-20",
  },
  {
    id: 5, supplier_name: "SpinTech Bangladesh", alert_type: "elevated_safety_incidents", severity: "warning",
    title: "Elevated safety incidents level", description: "SpinTech Bangladesh: safety_incidents = 3 (warning threshold: 2)",
    is_resolved: "true", created_at: "2026-01-10",
  },
];

const severityStyles: Record<string, { badge: string; icon: string }> = {
  critical: { badge: "bg-red-100 text-red-800 border-red-200", icon: "!!" },
  warning: { badge: "bg-amber-100 text-amber-800 border-amber-200", icon: "!" },
  info: { badge: "bg-blue-100 text-blue-800 border-blue-200", icon: "i" },
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS);
  const [filterSeverity, setFilterSeverity] = useState<string>("");
  const [showResolved, setShowResolved] = useState(false);

  const filtered = alerts.filter((a) => {
    if (filterSeverity && a.severity !== filterSeverity) return false;
    if (!showResolved && a.is_resolved === "true") return false;
    return true;
  });

  const criticalCount = alerts.filter((a) => a.severity === "critical" && a.is_resolved === "false").length;
  const warningCount = alerts.filter((a) => a.severity === "warning" && a.is_resolved === "false").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance Alerts</h1>
          <p className="text-gray-500 mt-1">Monitor supplier compliance risks and certification status</p>
        </div>
        <button className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700">
          Scan Now
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600 font-medium">Critical</p>
          <p className="text-2xl font-bold text-red-800">{criticalCount}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-600 font-medium">Warning</p>
          <p className="text-2xl font-bold text-amber-800">{warningCount}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600 font-medium">Resolved</p>
          <p className="text-2xl font-bold text-green-800">{alerts.filter((a) => a.is_resolved === "true").length}</p>
        </div>
      </div>

      {/* Filters */}
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
          <input
            type="checkbox"
            checked={showResolved}
            onChange={(e) => setShowResolved(e.target.checked)}
            className="rounded border-gray-300"
          />
          Show Resolved
        </label>
      </div>

      {/* Alert List */}
      <div className="space-y-3">
        {filtered.map((alert) => {
          const style = severityStyles[alert.severity] || severityStyles.info;
          return (
            <div
              key={alert.id}
              className={`bg-white border rounded-xl p-5 hover:shadow-md transition-shadow ${
                alert.is_resolved === "true" ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <span className={`px-2 py-1 border rounded-md text-xs font-bold mt-0.5 ${style.badge}`}>
                    {alert.severity.toUpperCase()}
                  </span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{alert.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>Supplier: {alert.supplier_name}</span>
                      <span>Type: {alert.alert_type}</span>
                      <span>Date: {alert.created_at}</span>
                    </div>
                  </div>
                </div>
                {alert.is_resolved === "false" && (
                  <button
                    onClick={() => {
                      setAlerts((prev) =>
                        prev.map((a) => (a.id === alert.id ? { ...a, is_resolved: "true" } : a))
                      );
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100"
                  >
                    Resolve
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
