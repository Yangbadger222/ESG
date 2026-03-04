"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isLoggedIn, clearToken } from "@/services/api";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "D" },
  { href: "/suppliers", label: "Suppliers", icon: "S" },
  { href: "/audits", label: "Audits", icon: "A" },
  { href: "/reports", label: "Reports", icon: "R" },
  { href: "/supply-chain", label: "Supply Chain", icon: "C" },
  { href: "/alerts", label: "Alerts", icon: "!" },
  { href: "/match", label: "AI Match", icon: "*" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-white border-r border-gray-200 fixed h-full">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-primary-700">ESG Platform</h1>
          <p className="text-xs text-gray-500 mt-1">Supply Chain Compliance</p>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-700 hover:bg-primary-50 hover:text-primary-700"
                }`}
              >
                <span className={`w-5 h-5 flex items-center justify-center text-xs font-bold rounded ${
                  active ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-500"
                }`}>
                  {item.icon}
                </span>
                {item.label}
              </a>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button
            onClick={() => { clearToken(); router.push("/login"); }}
            className="w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-left"
          >
            Sign Out
          </button>
        </div>
      </aside>
      <main className="ml-64 flex-1 p-8">{children}</main>
    </div>
  );
}
