const API_BASE =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) ||
  "http://localhost:5000/api";

const DEFAULT_TIMEOUT_MS = 15000;

function token() {
  try { return localStorage.getItem("ideaToken") || ""; }
  catch { return ""; }
}

export async function api(path, { method = "GET", body, timeout = DEFAULT_TIMEOUT_MS } = {}) {
  const headers = { "Content-Type": "application/json" };
  const t = token();
  if (t) headers.Authorization = `Bearer ${t}`;
  const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), timeout) : null;
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl ? ctrl.signal : undefined,
    });
  } catch (e) {
    if (timer) clearTimeout(timer);
    const err = new Error("Cannot reach the API server. Is it running?");
    err.status = 0;
    throw err;
  }
  if (timer) clearTimeout(timer);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export function setToken(t) {
  try {
    if (t) localStorage.setItem("ideaToken", t);
    else localStorage.removeItem("ideaToken");
  } catch {}
}
