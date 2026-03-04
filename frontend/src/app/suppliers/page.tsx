"use client";

import { useState, useEffect, useRef } from "react";
import AppShell from "@/components/AppShell";
import { supplierApi } from "@/services/api";

interface Supplier {
  id: number;
  name: string;
  tier: string;
  category: string | null;
  country: string | null;
  city: string | null;
  risk_level: string;
  parent_supplier_id: number | null;
  created_at: string;
}

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
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTier, setFilterTier] = useState("");
  const [filterRisk, setFilterRisk] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTier, setNewTier] = useState("tier_1");
  const [newCategory, setNewCategory] = useState("");
  const [newCountry, setNewCountry] = useState("");
  const [newCity, setNewCity] = useState("");
  const [creating, setCreating] = useState(false);
  const csvRef = useRef<HTMLInputElement>(null);

  const fetchSuppliers = () => {
    const params: Record<string, string> = {};
    if (filterTier) params.tier = filterTier;
    if (filterRisk) params.risk_level = filterRisk;
    setLoading(true);
    supplierApi
      .list(Object.keys(params).length > 0 ? params : undefined)
      .then((data) => setSuppliers(data as unknown as Supplier[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSuppliers(); }, [filterTier, filterRisk]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await supplierApi.create({
        name: newName, tier: newTier,
        category: newCategory || null, country: newCountry || null, city: newCity || null,
      });
      setShowCreateModal(false);
      setNewName(""); setNewCategory(""); setNewCountry(""); setNewCity("");
      fetchSuppliers();
    } catch { /* ignore */ }
    setCreating(false);
  };

  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await supplierApi.importCsv(file);
      alert(`Successfully imported ${res.imported} suppliers`);
      fetchSuppliers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Import failed");
    }
    if (csvRef.current) csvRef.current.value = "";
  };

  return (
    <AppShell>
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
            <p className="text-gray-500 mt-1">Manage your supply chain partners</p>
          </div>
          <div className="flex gap-3">
            <input type="file" accept=".csv" ref={csvRef} onChange={handleCsvImport} className="hidden" />
            <button onClick={() => csvRef.current?.click()} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
              Import CSV
            </button>
            <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700">
              + Add Supplier
            </button>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <select value={filterTier} onChange={(e) => setFilterTier(e.target.value)} className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white">
            <option value="">All Tiers</option>
            <option value="tier_1">Tier 1</option>
            <option value="tier_2">Tier 2</option>
            <option value="tier_3">Tier 3</option>
            <option value="raw_material">Raw Material</option>
          </select>
          <select value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)} className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white">
            <option value="">All Risk Levels</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        {loading ? (
          <div className="text-gray-400 text-sm py-20 text-center">Loading suppliers...</div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Supplier</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Tier</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Category</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Location</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4"><p className="text-sm font-medium text-gray-900">{s.name}</p></td>
                    <td className="px-6 py-4 text-sm text-gray-600">{tierLabels[s.tier] || s.tier}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">{s.category || "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{[s.city, s.country].filter(Boolean).join(", ") || "-"}</td>
                    <td className="px-6 py-4"><RiskBadge level={s.risk_level} /></td>
                  </tr>
                ))}
                {suppliers.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400">No suppliers found. Seed the database or add a supplier.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowCreateModal(false)}>
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Supplier</h2>
              <div className="space-y-3">
                <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Supplier name *" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg" />
                <select value={newTier} onChange={(e) => setNewTier(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg">
                  <option value="tier_1">Tier 1</option>
                  <option value="tier_2">Tier 2</option>
                  <option value="tier_3">Tier 3</option>
                  <option value="raw_material">Raw Material</option>
                </select>
                <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Category (e.g. fabric, dyeing)" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg" />
                <input value={newCountry} onChange={(e) => setNewCountry(e.target.value)} placeholder="Country" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg" />
                <input value={newCity} onChange={(e) => setNewCity(e.target.value)} placeholder="City" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button onClick={handleCreate} disabled={creating || !newName.trim()} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50">
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
