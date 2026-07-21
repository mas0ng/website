(() => {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  const severities = new Set(["info", "warning", "error", "critical"]);

  const readText = (name, fallback, maxLength) => {
    const value = params.get(name);
    if (!value) return fallback;

    const cleaned = value.replace(/[\u0000-\u001F\u007F]/g, " ").trim();
    return cleaned ? cleaned.slice(0, maxLength) : fallback;
  };

  const title = readText("title", "Something went wrong.", 100);
  const description = readText(
    "description",
    "We couldn't complete that request. Please try again or return to the home page.",
    320
  );
  const action = readText("action", "Go home", 60);
  const from = readText("from", "", 160);
  const code = readText("code", "", 80);
  const requestedSeverity = readText("severity", "error", 20).toLowerCase();
  const severity = severities.has(requestedSeverity) ? requestedSeverity : "error";

  const resolveNextUrl = () => {
    const value = params.get("next");
    if (!value) return { trusted: true, href: "/" };

    const candidate = value.trim();
    if (!candidate) return { trusted: false, href: "" };

    const bareMas0ngHost = /^(?:[a-z0-9-]+\.)*mas0ng\.com(?::\d+)?(?:[/?#]|$)/i.test(candidate);
    const normalized = bareMas0ngHost ? `https://${candidate}` : candidate;
    const isRelativePath = normalized.startsWith("/") && !normalized.startsWith("//");

    try {
      const destination = new URL(normalized, window.location.origin);
      const hostname = destination.hostname.toLowerCase();
      const isMas0ngHost = hostname === "mas0ng.com" || hostname.endsWith(".mas0ng.com");

      if (isRelativePath) {
        if (destination.protocol !== "https:" || !isMas0ngHost) {
          return { trusted: false, href: "" };
        }
        return {
          trusted: true,
          href: `${destination.pathname}${destination.search}${destination.hash}`
        };
      }

      if (destination.protocol === "https:" && isMas0ngHost) {
        return { trusted: true, href: destination.href };
      }

      return { trusted: false, href: "" };
    } catch {
      return { trusted: false, href: "" };
    }
  };

  const setText = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  };

  document.body.dataset.severity = severity;
  setText("error-title", title);
  setText("error-description", description);
  setText("error-action-label", action);

  const actionLink = document.getElementById("error-action");
  const invalidDestination = document.getElementById("error-invalid-destination");
  const nextUrl = resolveNextUrl();
  if (nextUrl.trusted) {
    if (actionLink) actionLink.href = nextUrl.href;
  } else {
    if (actionLink) actionLink.hidden = true;
    if (invalidDestination) invalidDestination.hidden = false;
  }

  const details = document.getElementById("error-details");
  const showDetail = (rowId, valueId, value) => {
    if (!value) return;
    setText(valueId, value);
    const row = document.getElementById(rowId);
    if (row) row.hidden = false;
    if (details) details.hidden = false;
  };

  showDetail("error-from-row", "error-from", from);
  showDetail("error-code-row", "error-code", code);

  document.title = `${title.replace(/[.!?]+$/, "")} | mas0ng.com`;
})();
