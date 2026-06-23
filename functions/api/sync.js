const JSON_CT = { "Content-Type": "application/json" };

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: JSON_CT });

export async function onRequest(context) {
  const { request, env } = context;

  // ── Auth: Bearer token required ──────────────────────────────────────────
  const authHeader = request.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (token.length < 20) return new Response("Unauthorized", { status: 401 });

  const passkeyHeader = request.headers.get("X-Workspace-Passkey") ?? "";

  try {
    // ── GET — fetch workspace projects (passkey is stripped from response) ──
    if (request.method === "GET") {
      const raw = await env.STORE.get(token);
      if (!raw) return json({ projects: [] });
      const data = JSON.parse(raw);
      return json({ projects: data.projects || [] });
    }

    // ── POST — create new workspace OR auto-save existing projects ──────────
    if (request.method === "POST") {
      const body = await request.json();
      const raw = await env.STORE.get(token);

      if (!raw) {
        // New workspace: passkey is mandatory
        if (!body.passkey)
          return new Response("Passkey required to initialize workspace", {
            status: 400,
          });
        await env.STORE.put(
          token,
          JSON.stringify({
            passkey: body.passkey,
            projects: body.projects || [],
          }),
        );
      } else {
        // Auto-save: preserve stored passkey, update projects
        const existing = JSON.parse(raw);
        await env.STORE.put(
          token,
          JSON.stringify({
            passkey: existing.passkey,
            projects: body.projects || [],
          }),
        );
      }

      return json({ success: true });
    }

    // ── DELETE — destroy workspace; passkey strictly enforced ───────────────
    if (request.method === "DELETE") {
      const raw = await env.STORE.get(token);
      if (raw) {
        const existing = JSON.parse(raw);
        if (existing.passkey && existing.passkey !== passkeyHeader) {
          return new Response("Forbidden: Invalid Passkey", { status: 403 });
        }
      }
      await env.STORE.delete(token);
      return json({ success: true });
    }

    return new Response("Method Not Allowed", { status: 405 });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}
