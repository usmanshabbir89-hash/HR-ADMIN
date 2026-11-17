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

// Today's date as "YYYY-MM-DD" (local time) - used as the max value of date inputs
export function todayISO() {
  return new Date().toLocaleDateString("en-CA");
}

// "Ayesha Khan" -> "AK" (for the round avatar)
export function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

// 140000 -> "One Hundred Forty Thousand" (used on salary certificates)
const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function underThousand(n) {
  const words = [];
  if (n >= 100) {
    words.push(`${ONES[Math.floor(n / 100)]} Hundred`);
    n %= 100;
  }
  if (n >= 20) {
    words.push(TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : ""));
  } else if (n > 0) {
    words.push(ONES[n]);
  }
  return words.join(" ");
}

export function numberToWords(amount) {
  let n = Math.floor(Number(amount) || 0);
  if (n === 0) return "Zero";
  const parts = [];
  for (const [size, name] of [[1e9, "Billion"], [1e6, "Million"], [1e3, "Thousand"], [1, ""]]) {
    if (n >= size) {
      parts.push(underThousand(Math.floor(n / size)) + (name ? ` ${name}` : ""));
      n %= size;
    }
  }
  return parts.join(" ");
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
