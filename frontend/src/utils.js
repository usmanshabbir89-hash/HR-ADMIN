// utils.js - small helper functions used by many pages.

// 150000 -> "PKR 150,000"
export function formatMoney(amount, currency = "PKR") {
  return `${currency} ${Number(amount || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

// "2026-11-17" -> "17 Nov 2026"
export function formatDate(isoDate) {
  if (!isoDate) return "—";
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// "2026-11-17" -> "Tuesday, 17 November 2026"
export function formatLongDate(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
