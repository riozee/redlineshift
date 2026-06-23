const JSON_HEADERS = { "Content-Type": "application/json" };

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });

/** Load workspace projects. Throws with .status on non-2xx. */
export const fetchWorkspace = async (token) => {
  const res = await fetch("/api/sync", { headers: authHeaders(token) });
  if (!res.ok)
    throw Object.assign(new Error("Fetch failed"), { status: res.status });
  return res.json();
};

/** Auto-save current projects to the workspace. */
export const saveWorkspace = async (token, projects) => {
  const res = await fetch("/api/sync", {
    method: "POST",
    headers: { ...authHeaders(token), ...JSON_HEADERS },
    body: JSON.stringify({ projects }),
  });
  if (!res.ok) throw new Error("Save failed");
  return res.json();
};

/** Initialize a brand-new workspace with a passkey. */
export const initWorkspace = async (token, passkey, projects = []) => {
  const res = await fetch("/api/sync", {
    method: "POST",
    headers: { ...authHeaders(token), ...JSON_HEADERS },
    body: JSON.stringify({ passkey, projects }),
  });
  if (!res.ok) throw new Error("Init failed");
  return res.json();
};

/** Delete a workspace. Requires matching passkey. Throws with .status on 403. */
export const deleteWorkspace = async (token, passkey) => {
  const res = await fetch("/api/sync", {
    method: "DELETE",
    headers: { ...authHeaders(token), "X-Workspace-Passkey": passkey },
  });
  if (!res.ok)
    throw Object.assign(new Error("Delete failed"), { status: res.status });
  return res.json();
};
