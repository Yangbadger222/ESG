"use client";

import { useState } from "react";

interface Supplier {
  id: number;
  name: string;
  tier: string;
  category: string | null;
  country: string | null;
  city: string | null;
  risk_level: string;
  certifications: string[];
}

const MOCK_SUPPLIERS: Supplier[] = [
  { id: 1, name: "TextileCo Shanghai", tier: "tier_1", category: "fabric", country: "China", city: "Shanghai", risk_level: "low", certifications: ["GOTS", "ISO 14001"] },
  { id: 2, name: "DyeWorks Vietnam", tier: "tier_2", category: "dyeing", country: "Vietnam", city: "Ho Chi Minh", risk_level: "high", certifications: [] },
  { id: 3, name: "SpinTech Bangladesh", tier: "tier_2", category: "spinning", country: "Bangladesh", city: "Dhaka", risk_level: "medium", certifications: ["BSCI"] },
  { id: 4, name: "FabricMill India", tier: "tier_1", category: "fabric", country: "India", city: "Mumbai", risk_level: "medium", certifications: ["OEKO-TEX"] },
  { id: 5, name: "EcoFiber Turkey", tier: "tier_3", category: "raw_material", country: "Turkey", city: "Istanbul", risk_level: "low", certifications: ["GRS", "GOTS"] },
  { id: 6, name: "ChemDye Jiangsu", tier: "tier_2", category: "dyeing", country: "China", city: "Suzhou", risk_level: "critical", certifications: [] },
];

const tierLabels: Record<string, string> = {
  tier_1: "Tier 1",
  tier_2: "Tier 2",
  tier_3: "Tier 3",
  raw_material: "Raw Material",
};

function RiskBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    low: "bg-green-100 text-green-700",
    medium: "bg-amber-100 text-amber-700",
    high: "bg-red-100 text-red-700",
    critical: "bg-red-200 text-red-900",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${styles[level] || "bg-gray-100"}`}>
      {level}
    </span>
  );
}

export default function SuppliersPage() {
  const [suppliers] = useState<Supplier[]>(MOCK_SUPPLIERS);
  const [filterTier, setFilterTier] = useState<string>("");
  const [filterRisk, setFilterRisk] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filtered = suppliers.filter((s) => {
    if (filterTier && s.tier !== filterTier) return false;
    if (filterRisk && s.risk_level !== filterRisk) return false;
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-gray-500 mt-1">Manage your supply chain partners</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            Import CSV
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
          >
            + Add Supplier
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={filterTier}
          onChange={(e) => setFilterTier(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
        >
          <option value="">All Tiers</option>
          <option value="tier_1">Tier 1</option>
          <option value="tier_2">Tier 2</option>
          <option value="tier_3">Tier 3</option>
          <option value="raw_material">Raw Material</option>
        </select>
        <select
          value={filterRisk}
          onChange={(e) => setFilterRisk(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
        >
          <option value="">All Risk Levels</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Supplier</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Tier</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Category</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Location</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Risk</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Certifications</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-gray-900">{s.name}</p>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{tierLabels[s.tier]}</td>
                <td className="px-6 py-4 text-sm text-gray-600 capitalize">{s.category || "-"}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{s.city}, {s.country}</td>
                <td className="px-6 py-4"><RiskBadge level={s.risk_level} /></td>
                <td className="px-6 py-4">
                  <div className="flex gap-1 flex-wrap">
                    {s.certifications.length > 0 ? (
                      s.certifications.map((c) => (
                        <span key={c} className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full font-medium">{c}</span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400">None</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <a href={`/suppliers/${s.id}`} className="text-sm text-primary-600 hover:text-primary-800 font-medium">
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
