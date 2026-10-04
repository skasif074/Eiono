 const BASE = import.meta.env.DEV ? "" : "https://eiono.onrender.com";

// FastAPI errors look like {"detail": "..."}; pull out a readable message
async function readError(res) {
  const raw = await res.text();
  try {
    const data = JSON.parse(raw);
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail)) {
      return data.detail.map((d) => d.msg).join(", ");
    }
  } catch {
    // not JSON, fall through
  }
  return raw || `Request failed (${res.status})`;
}

export async function runResearch(topic) {
  const res = await fetch(`${BASE}/api/research`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic }),
  });

  if (!res.ok) {
    throw new Error(await readError(res));
  }
  return res.json();
}

// One health check with a timeout. A sleeping Render service
// answers slowly or with a 502, which counts as "not ready".
export async function checkHealth() {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(`${BASE}/health`, {
      signal: ctrl.signal,
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}