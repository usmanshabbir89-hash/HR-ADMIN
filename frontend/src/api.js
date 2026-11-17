// api.js - ONE place where the frontend talks to the FastAPI backend.
// Every page calls api("/api/...") instead of using fetch() directly,
// so error handling is written only once.

export async function api(path, { method = "GET", body } = {}) {
  let response;
  try {
    response = await fetch(path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Cannot reach the server. Is the backend running on port 8000?");
  }

  // Read the JSON reply (some errors may have no JSON body)
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(readError(data, response.status));
  }
  return data;
}

// Turn FastAPI error replies into one readable sentence.
function readError(data, status) {
  const detail = data?.detail;

  // 422 validation errors come as a list: [{loc: [...,"email"], msg: "..."}]
  if (Array.isArray(detail)) {
    return detail
      .map((d) => {
        const field = d.loc?.[d.loc.length - 1];
        const message = d.msg.replace("Value error, ", "");
        return field && field !== "body" ? `${field.replaceAll("_", " ")}: ${message}` : message;
      })
      .join(" • ");
  }
  if (typeof detail === "string") return detail;
  if (status >= 500 && !data) return "Cannot reach the server. Is the backend running on port 8000?";
  return `Request failed (error ${status})`;
}
