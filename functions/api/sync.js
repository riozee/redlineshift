export async function onRequest(context) {
  const { request, env } = context;

  const authHeader = request.headers.get("Authorization");
  const token = authHeader ? authHeader.replace("Bearer ", "").trim() : null;

  if (!token || token.length < 20) {
    return new Response("Unauthorized", { status: 401 });
  }

  const passkeyHeader = request.headers.get("X-Workspace-Passkey");

  try {
    if (request.method === "GET") {
      const rawData = await env.STORE.get(token);
      if (!rawData) {
        return new Response(JSON.stringify({ projects: [] }), {
          headers: { "Content-Type": "application/json" },
        });
      }
      const data = JSON.parse(rawData);
      // Strip passkey before sending to client
      return new Response(JSON.stringify({ projects: data.projects || [] }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (request.method === "POST") {
      const body = await request.json();
      const rawData = await env.STORE.get(token);

      if (!rawData) {
        // New workspace creation
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
        // Auto-save: Merge new projects with existing passkey
        const existingData = JSON.parse(rawData);
        await env.STORE.put(
          token,
          JSON.stringify({
            passkey: existingData.passkey,
            projects: body.projects || [],
          }),
        );
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (request.method === "DELETE") {
      const rawData = await env.STORE.get(token);
      if (rawData) {
        const existingData = JSON.parse(rawData);
        // Strict passkey enforcement
        if (existingData.passkey && existingData.passkey !== passkeyHeader) {
          return new Response("Forbidden: Invalid Passkey", { status: 403 });
        }
      }
      await env.STORE.delete(token);
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
