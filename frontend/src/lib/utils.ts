import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function riskColor(level: string): string {
  const colors: Record<string, string> = {
    low: "text-green-600 bg-green-50",
    medium: "text-amber-600 bg-amber-50",
    high: "text-red-600 bg-red-50",
    critical: "text-red-900 bg-red-100",
  };
  return colors[level] || "text-gray-600 bg-gray-50";
}

export function complianceColor(status: string): string {
  const colors: Record<string, string> = {
    compliant: "text-green-700 bg-green-50 border-green-200",
    partial: "text-amber-700 bg-amber-50 border-amber-200",
    non_compliant: "text-red-700 bg-red-50 border-red-200",
    pending: "text-gray-500 bg-gray-50 border-gray-200",
  };
  return colors[status] || "text-gray-500 bg-gray-50 border-gray-200";
}
