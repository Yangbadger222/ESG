import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ESG Compliance Platform",
  description: "Automated ESG compliance auditing for global supply chains",
};

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/suppliers", label: "Suppliers", icon: "Factory" },
  { href: "/audits", label: "Audits", icon: "ClipboardCheck" },
  { href: "/reports", label: "Reports", icon: "FileText" },
  { href: "/supply-chain", label: "Supply Chain", icon: "GitBranch" },
  { href: "/alerts", label: "Alerts", icon: "AlertTriangle" },
  { href: "/match", label: "AI Match", icon: "Sparkles" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gray-50">
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="w-64 bg-white border-r border-gray-200 fixed h-full">
            <div className="p-6 border-b border-gray-200">
              <h1 className="text-xl font-bold text-primary-700">ESG Platform</h1>
              <p className="text-xs text-gray-500 mt-1">Supply Chain Compliance</p>
            </div>
            <nav className="p-4 space-y-1">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                >
                  <span className="w-5 h-5 text-gray-400">{item.icon.charAt(0)}</span>
                  {item.label}
                </a>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="ml-64 flex-1 p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
