"use client";

import { useState, useEffect } from "react";

interface DashboardStats {
  totalSuppliers: number;
  activeAudits: number;
  criticalAlerts: number;
  avgComplianceScore: number;
  riskDistribution: Record<string, number>;
  recentAlerts: Array<{
    id: number;
    title: string;
    severity: string;
    created_at: string;
  }>;
}

const MOCK_STATS: DashboardStats = {
  totalSuppliers: 48,
  activeAudits: 3,
  criticalAlerts: 7,
  avgComplianceScore: 72.5,
  riskDistribution: { low: 20, medium: 15, high: 10, critical: 3 },
  recentAlerts: [
    { id: 1, title: "Expired GOTS certification - TextileCo Shanghai", severity: "critical", created_at: "2026-03-01" },
    { id: 2, title: "High carbon emissions - DyeWorks Vietnam", severity: "warning", created_at: "2026-03-02" },
    { id: 3, title: "No ESG data submitted - FabricMill India", severity: "warning", created_at: "2026-03-03" },
    { id: 4, title: "Missing green certification - SpinTech Bangladesh", severity: "info", created_at: "2026-03-03" },
  ],
};

function StatCard({ title, value, subtitle, color }: { title: string; value: string | number; subtitle?: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    critical: "bg-red-100 text-red-700",
    warning: "bg-amber-100 text-amber-700",
    info: "bg-blue-100 text-blue-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[severity] || "bg-gray-100 text-gray-600"}`}>
      {severity}
    </span>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(MOCK_STATS);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">ESG supply chain compliance overview</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Suppliers" value={stats.totalSuppliers} subtitle="Across all tiers" color="text-primary-700" />
        <StatCard title="Active Audits" value={stats.activeAudits} subtitle="In progress" color="text-blue-600" />
        <StatCard title="Critical Alerts" value={stats.criticalAlerts} subtitle="Requires attention" color="text-red-600" />
        <StatCard title="Avg. Compliance" value={`${stats.avgComplianceScore}%`} subtitle="Overall score" color="text-green-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Risk Distribution</h2>
          <div className="space-y-3">
            {Object.entries(stats.riskDistribution).map(([level, count]) => {
              const total = Object.values(stats.riskDistribution).reduce((a, b) => a + b, 0);
              const pct = Math.round((count / total) * 100);
              const barColors: Record<string, string> = {
                low: "bg-green-500",
                medium: "bg-amber-500",
                high: "bg-red-500",
                critical: "bg-red-800",
              };
              return (
                <div key={level} className="flex items-center gap-3">
                  <span className="w-16 text-sm text-gray-600 capitalize">{level}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-3">
                    <div className={`h-3 rounded-full ${barColors[level]}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-10 text-sm text-gray-600 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h2>
          <div className="space-y-3">
            {stats.recentAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <SeverityBadge severity={alert.severity} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{alert.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{alert.created_at}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
