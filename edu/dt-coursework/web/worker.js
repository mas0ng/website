export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "text/plain"
    };

    if (url.pathname.includes("/activate")) {
      await env.ESP32_NAMESPACE.put("status", "true");
      return new Response("true", { headers });
    }

    if (url.pathname.includes("/deactivate")) {
      await env.ESP32_NAMESPACE.put("status", "nil");
      return new Response("nil", { headers });
    }

    const status = await env.ESP32_NAMESPACE.get("status");
    return new Response(status || "nil", { headers });
  }
};
