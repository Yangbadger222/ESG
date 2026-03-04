"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { dashboardApi } from "@/services/api";

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
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi
      .stats()
      .then((data) => setStats(data as unknown as DashboardStats))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">ESG supply chain compliance overview</p>
        </div>

        {loading ? (
          <div className="text-gray-400 text-sm py-20 text-center">Loading dashboard data...</div>
        ) : !stats ? (
          <div className="text-gray-400 text-sm py-20 text-center">Failed to load data. Please check backend connection.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard title="Total Suppliers" value={stats.totalSuppliers} subtitle="Across all tiers" color="text-primary-700" />
              <StatCard title="Active Audits" value={stats.activeAudits} subtitle="In progress" color="text-blue-600" />
              <StatCard title="Critical Alerts" value={stats.criticalAlerts} subtitle="Requires attention" color="text-red-600" />
              <StatCard title="Avg. Compliance" value={stats.avgComplianceScore ? `${stats.avgComplianceScore}%` : "N/A"} subtitle="Overall score" color="text-green-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Risk Distribution</h2>
                {Object.keys(stats.riskDistribution).length === 0 ? (
                  <p className="text-sm text-gray-400">No supplier data yet. Seed the database first.</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(stats.riskDistribution).map(([level, count]) => {
                      const total = Object.values(stats.riskDistribution).reduce((a, b) => a + b, 0);
                      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                      const barColors: Record<string, string> = { low: "bg-green-500", medium: "bg-amber-500", high: "bg-red-500", critical: "bg-red-800" };
                      return (
                        <div key={level} className="flex items-center gap-3">
                          <span className="w-16 text-sm text-gray-600 capitalize">{level}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-3">
                            <div className={`h-3 rounded-full ${barColors[level] || "bg-gray-400"}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-10 text-sm text-gray-600 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h2>
                {stats.recentAlerts.length === 0 ? (
                  <p className="text-sm text-gray-400">No alerts. Run a compliance scan to generate alerts.</p>
                ) : (
                  <div className="space-y-3">
                    {stats.recentAlerts.map((alert) => (
                      <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                        <SeverityBadge severity={alert.severity} />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">{alert.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{alert.created_at ? new Date(alert.created_at).toLocaleDateString("zh-CN") : ""}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
