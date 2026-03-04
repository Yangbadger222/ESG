"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { dashboardApi } from "@/services/api";

interface ChainNode {
  id: number;
  name: string;
  tier: string;
  country: string | null;
  city: string | null;
  risk_level: string;
  certifications: string[];
  children: ChainNode[];
}

const riskColors: Record<string, string> = {
  low: "border-green-400 bg-green-50",
  medium: "border-amber-400 bg-amber-50",
  high: "border-red-400 bg-red-50",
  critical: "border-red-700 bg-red-100",
};

const riskDotColors: Record<string, string> = {
  low: "bg-green-500",
  medium: "bg-amber-500",
  high: "bg-red-500",
  critical: "bg-red-800",
};

function NodeCard({ node, depth = 0 }: { node: ChainNode; depth?: number }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className={depth > 0 ? "ml-8 mt-3" : "mt-4"}>
      <div
        className={`border-l-4 rounded-lg p-4 ${riskColors[node.risk_level] || "border-gray-300 bg-gray-50"} cursor-pointer hover:shadow-md transition-shadow`}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              {hasChildren && (
                <span className="text-gray-400 text-sm">{expanded ? "▼" : "▶"}</span>
              )}
              <h3 className="font-semibold text-gray-900">{node.name}</h3>
              <span className={`w-2.5 h-2.5 rounded-full ${riskDotColors[node.risk_level] || "bg-gray-400"}`} />
            </div>
            <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
              <span className="uppercase font-medium">{node.tier.replace("_", " ")}</span>
              <span>{[node.city, node.country].filter(Boolean).join(", ")}</span>
            </div>
          </div>
          <div className="flex gap-1 flex-wrap">
            {node.certifications && node.certifications.length > 0 ? (
              node.certifications.map((c) => (
                <span key={c} className="px-2 py-0.5 bg-white/80 text-green-700 text-xs rounded-full font-medium border border-green-200">{c}</span>
              ))
            ) : (
              <span className="px-2 py-0.5 bg-white/80 text-red-600 text-xs rounded-full font-medium border border-red-200">No Cert</span>
            )}
          </div>
        </div>
      </div>
      {expanded && hasChildren && (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-4 w-px bg-gray-300" />
          {node.children.map((child) => (
            <NodeCard key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SupplyChainPage() {
  const [chain, setChain] = useState<ChainNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.supplyChain()
      .then((data) => setChain(data as unknown as ChainNode[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Supply Chain Transparency</h1>
          <p className="text-gray-500 mt-1">Deep multi-tier supply chain visualization with environmental records and geographic data</p>
        </div>

        <div className="flex items-center gap-6 mb-6 p-4 bg-white rounded-lg border border-gray-200">
          <span className="text-sm font-medium text-gray-600">Risk Level:</span>
          {Object.entries(riskDotColors).map(([level, color]) => (
            <div key={level} className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded-full ${color}`} />
              <span className="text-sm text-gray-600 capitalize">{level}</span>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="text-gray-400 text-sm py-20 text-center">Loading supply chain...</div>
        ) : chain.length === 0 ? (
          <div className="text-gray-400 text-sm py-20 text-center">No supply chain data. Add suppliers with parent relationships to build the chain.</div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            {chain.map((root) => (
              <NodeCard key={root.id} node={root} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
